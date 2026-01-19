/**
 * Hybrid Retriever
 *
 * Combines dense (vector) and sparse (BM25) retrieval using RRF fusion.
 * This provides the "best of both worlds" - semantic understanding + keyword precision.
 */

import type { VectorStore } from '../vector-store/types.js';
import type { EmbeddingProvider } from '../embeddings/types.js';
import type {
  Retriever,
  RetrievalResult,
  HybridRetrievalOptions,
  HybridRetrieverConfig,
  BM25Document,
  RankedItem,
  HybridScore,
} from './types.js';
import { RetrieverError } from './errors.js';
import { BM25Retriever } from './bm25.js';
import { DenseRetriever } from './dense-retriever.js';
import {
  reciprocalRankFusion,
  normalizeRRFScores,
  DEFAULT_RRF_K,
  type RankingList,
} from './rrf.js';

// ============================================================================
// Constants
// ============================================================================

/** Default alpha value (balanced between dense and sparse) */
const DEFAULT_ALPHA = 0.5;

/** Default candidate multiplier (fetch 3x topK from each retriever) */
const DEFAULT_CANDIDATE_MULTIPLIER = 3;

// ============================================================================
// Hybrid Retriever Implementation
// ============================================================================

/**
 * Hybrid retriever combining dense and sparse search with RRF fusion.
 *
 * Hybrid retrieval is the modern best practice for production RAG:
 * - Dense handles semantic similarity and paraphrases
 * - Sparse handles exact keywords and technical terms
 * - RRF fusion combines their strengths
 *
 * The alpha parameter controls the balance:
 * - alpha=0: Pure sparse (BM25 only)
 * - alpha=0.5: Balanced (default, recommended)
 * - alpha=1: Pure dense (vector only)
 *
 * @example
 * ```typescript
 * // Initialize with vector store and embedding provider
 * const retriever = new HybridRetriever({
 *   vectorStore,
 *   embeddingProvider,
 * });
 *
 * // Build BM25 index from documents
 * retriever.buildIndex([
 *   { id: 'doc1', content: 'PostgreSQL is a database', chunk: chunk1 },
 *   { id: 'doc2', content: 'MySQL is also a database', chunk: chunk2 },
 * ]);
 *
 * // Retrieve with balanced fusion (default)
 * const results = await retriever.retrieve('PostgreSQL performance tuning');
 *
 * // Or favor semantic search for conceptual queries
 * const semanticResults = await retriever.retrieve(
 *   'How do I make my database faster?',
 *   { alpha: 0.7, topK: 5 }
 * );
 *
 * // Or favor keyword search for technical queries
 * const keywordResults = await retriever.retrieve(
 *   'PostgreSQL 15.4 release notes',
 *   { alpha: 0.3, topK: 5 }
 * );
 * ```
 */
export class HybridRetriever implements Retriever {
  readonly name: string;

  private readonly denseRetriever: DenseRetriever;
  private readonly sparseRetriever: BM25Retriever;
  private readonly defaultAlpha: number;
  private readonly rrfK: number;

  constructor(
    vectorStore: VectorStore,
    embeddingProvider: EmbeddingProvider,
    config: HybridRetrieverConfig = {}
  ) {
    this.name = config.name ?? 'HybridRetriever';
    this.defaultAlpha = config.defaultAlpha ?? DEFAULT_ALPHA;
    this.rrfK = config.rrfK ?? DEFAULT_RRF_K;

    // Validate alpha
    if (this.defaultAlpha < 0 || this.defaultAlpha > 1) {
      throw RetrieverError.configError(
        this.name,
        'defaultAlpha must be between 0 and 1'
      );
    }

    // Initialize component retrievers
    this.denseRetriever = new DenseRetriever(
      vectorStore,
      embeddingProvider,
      { name: `${this.name}:Dense` }
    );

    this.sparseRetriever = new BM25Retriever(config.bm25Config);
  }

  /**
   * Build the BM25 index for sparse retrieval.
   *
   * This must be called before retrieve() if alpha < 1.
   * The documents should match what's in the vector store.
   *
   * @param documents - Documents to index for BM25
   */
  buildIndex = (documents: BM25Document[]): void => {
    this.sparseRetriever.buildIndex(documents);
  };

  /**
   * Retrieve documents using hybrid dense + sparse search.
   *
   * @param query - Search query (natural language)
   * @param options - Retrieval options including alpha
   * @returns Sorted results with full score transparency
   */
  retrieve = async (
    query: string,
    options: HybridRetrievalOptions = {}
  ): Promise<RetrievalResult[]> => {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw RetrieverError.invalidQuery(this.name, 'Query cannot be empty');
    }

    const alpha = options.alpha ?? this.defaultAlpha;
    const topK = options.topK ?? 10;
    const candidateMultiplier = options.candidateMultiplier ?? DEFAULT_CANDIDATE_MULTIPLIER;
    const minScore = options.minScore;
    const filter = options.filter;

    // Validate alpha
    if (alpha < 0 || alpha > 1) {
      throw RetrieverError.invalidQuery(
        this.name,
        'alpha must be between 0 and 1'
      );
    }

    // Calculate how many candidates to fetch from each retriever
    const candidateK = topK * candidateMultiplier;

    // Special case: pure dense (alpha = 1)
    if (alpha === 1) {
      const denseResults = await this.denseRetriever.retrieve(query, {
        topK,
        minScore,
        filter,
      });
      return denseResults.map((r) => ({
        ...r,
        scores: { dense: r.score, sparse: 0, fused: r.score },
        denseRank: denseResults.indexOf(r) + 1,
      }));
    }

    // Special case: pure sparse (alpha = 0)
    if (alpha === 0) {
      const sparseResults = await this.sparseRetriever.retrieve(query, {
        topK,
        minScore,
        // Note: BM25 doesn't support metadata filtering (yet)
      });
      return sparseResults.map((r) => ({
        ...r,
        scores: { dense: 0, sparse: r.score, fused: r.score },
        sparseRank: sparseResults.indexOf(r) + 1,
      }));
    }

    // Hybrid mode: fetch from both retrievers in parallel
    const [denseResults, sparseResults] = await Promise.all([
      this.denseRetriever.retrieve(query, {
        topK: candidateK,
        filter,
        // Don't apply minScore here - we'll apply after fusion
      }),
      this.sparseRetriever.retrieve(query, {
        topK: candidateK,
      }),
    ]);

    // Convert to RankingList format for RRF
    const denseRanking: RankingList = {
      name: 'dense',
      items: denseResults.map((r, idx): RankedItem => ({
        id: r.id,
        rank: idx + 1, // 1-indexed
        score: r.score,
        chunk: r.chunk,
      })),
    };

    const sparseRanking: RankingList = {
      name: 'sparse',
      items: sparseResults.map((r, idx): RankedItem => ({
        id: r.id,
        rank: idx + 1, // 1-indexed
        score: r.score,
        chunk: r.chunk,
      })),
    };

    // Fuse with RRF
    const fusedResults = reciprocalRankFusion(
      [denseRanking, sparseRanking],
      this.rrfK
    );

    // Normalize RRF scores to 0-1 range
    const normalizedResults = normalizeRRFScores(fusedResults, 2, this.rrfK);

    // Apply minScore filter and take topK
    const filteredResults = normalizedResults
      .filter((r) => minScore === undefined || r.score >= minScore)
      .slice(0, topK);

    // Convert to RetrievalResult with full score transparency
    return filteredResults.map((r) => {
      const denseContrib = r.contributions.find((c) => c.name === 'dense');
      const sparseContrib = r.contributions.find((c) => c.name === 'sparse');

      const scores: HybridScore = {
        dense: denseContrib?.score ?? 0,
        sparse: sparseContrib?.score ?? 0,
        fused: r.score,
      };

      return {
        id: r.id,
        chunk: r.chunk,
        score: r.score,
        scores,
        denseRank: denseContrib?.rank,
        sparseRank: sparseContrib?.rank,
      };
    });
  };

  /**
   * Get the underlying dense retriever.
   */
  get dense(): DenseRetriever {
    return this.denseRetriever;
  }

  /**
   * Get the underlying sparse retriever.
   */
  get sparse(): BM25Retriever {
    return this.sparseRetriever;
  }

  /**
   * Check if the BM25 index has been built.
   */
  get isIndexBuilt(): boolean {
    return this.sparseRetriever.documentCount > 0;
  }
}
