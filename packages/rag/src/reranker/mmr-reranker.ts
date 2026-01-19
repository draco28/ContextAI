/**
 * MMR (Maximal Marginal Relevance) Reranker
 *
 * Reranks results to balance relevance and diversity.
 * Prevents returning multiple documents that say the same thing.
 *
 * Formula: MMR(d) = λ * Sim(q, d) - (1-λ) * max(Sim(d, d_selected))
 *
 * @example
 * ```typescript
 * const reranker = new MMRReranker({
 *   defaultLambda: 0.7,  // Favor relevance over diversity
 * });
 *
 * const reranked = await reranker.rerank(query, results, {
 *   topK: 5,
 *   lambda: 0.5,  // Override for this query
 * });
 * ```
 */

import type { EmbeddingProvider } from '../embeddings/types.js';
import type { RetrievalResult } from '../retrieval/types.js';
import type { MMRRerankerConfig, MMRRerankerOptions } from './types.js';
import { BaseReranker, type InternalRerankerResult } from './base-reranker.js';
import { RerankerError } from './errors.js';

/**
 * Default lambda value for balancing relevance and diversity.
 * 0.5 gives equal weight to both.
 */
const DEFAULT_LAMBDA = 0.5;

/**
 * MMR Reranker for diversity-aware ranking.
 *
 * Uses Maximal Marginal Relevance to select documents that are
 * both relevant to the query AND different from already-selected docs.
 *
 * This is particularly useful when:
 * - Search results contain near-duplicates
 * - You want to cover multiple aspects of a topic
 * - Context window is limited and diversity maximizes information
 *
 * **Requirements:**
 * - Results must have embeddings OR you must provide an embedding provider
 * - Embeddings are needed to compute inter-document similarity
 *
 * @example
 * ```typescript
 * // With embedding provider (computes embeddings on-the-fly)
 * const reranker = new MMRReranker({
 *   embeddingProvider: new HuggingFaceEmbeddings({ model: 'BAAI/bge-small-en-v1.5' }),
 *   defaultLambda: 0.6,
 * });
 *
 * // With pre-computed embeddings in results
 * const reranker = new MMRReranker({ defaultLambda: 0.5 });
 * const resultsWithEmbeddings = results.map(r => ({
 *   ...r,
 *   embedding: precomputedEmbeddings[r.id],
 * }));
 * const reranked = await reranker.rerank(query, resultsWithEmbeddings);
 * ```
 */
export class MMRReranker extends BaseReranker {
  readonly name: string;
  private readonly defaultLambda: number;
  private readonly similarityFunction: 'cosine' | 'dotProduct' | 'euclidean';
  private readonly embeddingProvider?: EmbeddingProvider;

  /** Query embedding cache (cleared per rerank call) */
  private queryEmbedding: number[] | null = null;

  /**
   * MMR scores are already in a meaningful range, we just need
   * to ensure they're positive. Min-max works well here.
   */
  protected override readonly shouldNormalize = true;

  constructor(
    config: MMRRerankerConfig & { embeddingProvider?: EmbeddingProvider } = {}
  ) {
    super();
    this.name = config.name ?? 'MMRReranker';
    this.defaultLambda = config.defaultLambda ?? DEFAULT_LAMBDA;
    this.similarityFunction = config.similarityFunction ?? 'cosine';
    this.embeddingProvider = config.embeddingProvider;
  }

  /**
   * Rerank using MMR algorithm.
   *
   * Algorithm:
   * 1. Start with empty selected set
   * 2. For each position in output:
   *    a. For each unselected doc, compute MMR score
   *    b. Select doc with highest MMR score
   *    c. Add to selected set
   * 3. Return selected docs in order
   */
  protected _rerank = async (
    query: string,
    results: RetrievalResult[],
    options?: MMRRerankerOptions
  ): Promise<InternalRerankerResult[]> => {
    const lambda = options?.lambda ?? this.defaultLambda;
    const topK = options?.topK ?? results.length;

    // Get embeddings for all documents
    const embeddings = await this.getEmbeddings(query, results);

    // Greedy MMR selection
    const selected: InternalRerankerResult[] = [];
    const selectedIndices = new Set<number>();
    const selectedEmbeddings: number[][] = [];

    // Select up to topK documents
    for (let i = 0; i < Math.min(topK, results.length); i++) {
      let bestScore = -Infinity;
      let bestIndex = -1;
      let bestComponents: { relevanceScore: number; diversityPenalty: number } | null = null;

      // Find document with highest MMR score among unselected
      for (let j = 0; j < results.length; j++) {
        if (selectedIndices.has(j)) continue;

        const docEmbedding = embeddings.documents[j];
        if (!docEmbedding) continue;

        // Relevance: similarity to query
        const relevance = this.similarity(embeddings.query, docEmbedding);

        // Diversity penalty: max similarity to any selected document
        let maxSimToSelected = 0;
        for (const selectedEmb of selectedEmbeddings) {
          const sim = this.similarity(docEmbedding, selectedEmb);
          maxSimToSelected = Math.max(maxSimToSelected, sim);
        }

        // MMR formula: λ * relevance - (1-λ) * maxSimToSelected
        const mmrScore = lambda * relevance - (1 - lambda) * maxSimToSelected;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = j;
          bestComponents = {
            relevanceScore: relevance,
            diversityPenalty: maxSimToSelected,
          };
        }
      }

      // If no valid document found, stop
      if (bestIndex === -1) break;

      // Add best document to selected set
      selectedIndices.add(bestIndex);
      selectedEmbeddings.push(embeddings.documents[bestIndex]!);

      const result = results[bestIndex]!;
      selected.push({
        id: result.id,
        score: bestScore,
        original: result,
        scoreComponents: bestComponents ?? undefined,
      });
    }

    // Clear query embedding cache
    this.queryEmbedding = null;

    return selected;
  };

  /**
   * Get embeddings for query and all documents.
   *
   * Uses embeddings from results if available, otherwise
   * computes them using the embedding provider.
   */
  private async getEmbeddings(
    query: string,
    results: RetrievalResult[]
  ): Promise<{
    query: number[];
    documents: (number[] | null)[];
  }> {
    // Check if results have embeddings
    const resultsWithEmbeddings = results.filter(
      (r) => 'embedding' in r && Array.isArray((r as { embedding?: number[] }).embedding)
    );

    // If all results have embeddings, use them directly
    if (resultsWithEmbeddings.length === results.length) {
      // Compute query embedding using provider or throw
      const queryEmb = await this.getQueryEmbedding(query);
      return {
        query: queryEmb,
        documents: results.map((r) => (r as unknown as { embedding: number[] }).embedding),
      };
    }

    // Otherwise, need embedding provider
    if (!this.embeddingProvider) {
      throw RerankerError.embeddingRequired(
        this.name,
        'Results do not have embeddings and no embedding provider was configured. ' +
          'Either provide results with embeddings or configure an embedding provider.'
      );
    }

    // Compute all embeddings
    const queryEmb = await this.getQueryEmbedding(query);
    const docEmbeddings = await Promise.all(
      results.map(async (r) => {
        // Use existing embedding if available
        if ('embedding' in r && Array.isArray((r as { embedding?: number[] }).embedding)) {
          return (r as unknown as { embedding: number[] }).embedding;
        }
        // Otherwise compute
        const result = await this.embeddingProvider!.embed(r.chunk.content);
        return result.embedding;
      })
    );

    return {
      query: queryEmb,
      documents: docEmbeddings,
    };
  }

  /**
   * Get query embedding (cached for the current rerank call).
   */
  private async getQueryEmbedding(query: string): Promise<number[]> {
    if (this.queryEmbedding) {
      return this.queryEmbedding;
    }

    if (!this.embeddingProvider) {
      throw RerankerError.embeddingRequired(
        this.name,
        'No embedding provider configured for query embedding'
      );
    }

    const result = await this.embeddingProvider.embed(query);
    this.queryEmbedding = result.embedding;
    return this.queryEmbedding;
  }

  /**
   * Compute similarity between two vectors.
   */
  private similarity(a: number[], b: number[]): number {
    switch (this.similarityFunction) {
      case 'cosine':
        return this.cosineSimilarity(a, b);
      case 'dotProduct':
        return this.dotProduct(a, b);
      case 'euclidean':
        return this.euclideanSimilarity(a, b);
      default:
        return this.cosineSimilarity(a, b);
    }
  }

  /**
   * Cosine similarity: dot(a, b) / (||a|| * ||b||)
   * Returns value in [-1, 1], where 1 = identical, -1 = opposite
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const ai = a[i] ?? 0;
      const bi = b[i] ?? 0;
      dot += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Dot product: sum(a[i] * b[i])
   * Unbounded, but works well for normalized vectors.
   */
  private dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] ?? 0) * (b[i] ?? 0);
    }
    return sum;
  }

  /**
   * Euclidean similarity: 1 / (1 + euclideanDistance(a, b))
   * Returns value in (0, 1], where 1 = identical
   */
  private euclideanSimilarity(a: number[], b: number[]): number {
    let sumSq = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = (a[i] ?? 0) - (b[i] ?? 0);
      sumSq += diff * diff;
    }
    return 1 / (1 + Math.sqrt(sumSq));
  }
}
