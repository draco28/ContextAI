/**
 * Graph Hybrid Retriever
 *
 * Combines dense (vector), sparse (BM25), and graph context signals using RRF fusion.
 * This provides three complementary retrieval dimensions:
 * - Dense: Semantic similarity via embeddings
 * - Sparse: Keyword/term matching via BM25
 * - Graph: Structural relationships from knowledge graph
 */

import type { VectorStore } from '../vector-store/types.js';
import type { EmbeddingProvider } from '../embeddings/types.js';
import type { GraphStore } from '../knowledge-graph/types.js';
import type {
  Retriever,
  RetrievalResult,
  GraphHybridRetrievalOptions,
  GraphHybridRetrieverConfig,
  GraphContextConfig,
  GraphHybridScore,
  BM25Document,
  RankedItem,
} from './types.js';
import { RetrieverError } from './errors.js';
import { HybridRetriever } from './hybrid-retriever.js';
import {
  reciprocalRankFusion,
  normalizeRRFScores,
  DEFAULT_RRF_K,
  type RankingList,
} from './rrf.js';

// ============================================================================
// Constants
// ============================================================================

/** Default graph weight for 3-way fusion */
const DEFAULT_GRAPH_WEIGHT = 0.3;

/** Default property name for chunk-to-node mapping */
const DEFAULT_CHUNK_TO_NODE_PROPERTY = 'graphNodeId';

/** Default graph context configuration */
const DEFAULT_GRAPH_CONTEXT: Required<GraphContextConfig> = {
  depth: 1,
  direction: 'both',
  edgeTypes: [],
  nodeTypes: [],
  minWeight: 0.0,
  maxNeighborsPerChunk: 10,
};

/** Default candidate multiplier (fetch 3x topK from hybrid retriever) */
const DEFAULT_CANDIDATE_MULTIPLIER = 3;

// ============================================================================
// Graph Hybrid Retriever Implementation
// ============================================================================

/**
 * Graph-enhanced hybrid retriever combining dense, sparse, and graph signals.
 *
 * This retriever extends the hybrid (dense + sparse) approach by adding
 * graph context as a third signal. Results are fused using Reciprocal Rank
 * Fusion (RRF), providing transparent scoring across all three dimensions.
 *
 * **How Graph Context Works:**
 * 1. Retrieved chunks are mapped to graph nodes via metadata
 * 2. Each node's neighbors are expanded using GraphStore.getNeighbors()
 * 3. Cross-pollination: Chunks with neighbors also in results get higher graph scores
 * 4. Connection strength: Edge weights and proximity boost graph relevance
 *
 * @example
 * ```typescript
 * const retriever = new GraphHybridRetriever(
 *   vectorStore,
 *   graphStore,
 *   embeddingProvider,
 *   {
 *     defaultGraphWeight: 0.3,
 *     graphContext: { depth: 2, nodeTypes: ['chunk', 'concept'] },
 *   }
 * );
 *
 * retriever.buildIndex(documents);
 *
 * const results = await retriever.retrieve('machine learning concepts', {
 *   topK: 10,
 *   alpha: 0.6,      // Favor dense over sparse
 *   graphWeight: 0.4, // Strong graph influence
 * });
 *
 * // Results include full transparency
 * results.forEach(r => {
 *   console.log(`Dense: ${r.scores?.dense}, Sparse: ${r.scores?.sparse}`);
 *   console.log(`Graph: ${r.scores?.graph}, Fused: ${r.scores?.fused}`);
 * });
 * ```
 */
export class GraphHybridRetriever implements Retriever {
  readonly name: string;

  private readonly hybridRetriever: HybridRetriever;
  private readonly graphStore: GraphStore;
  private readonly defaultGraphWeight: number;
  private readonly defaultGraphContext: Required<GraphContextConfig>;
  private readonly chunkToNodeProperty: string;
  private readonly rrfK: number;

  constructor(
    vectorStore: VectorStore,
    graphStore: GraphStore,
    embeddingProvider: EmbeddingProvider,
    config: GraphHybridRetrieverConfig = {}
  ) {
    this.name = config.name ?? 'GraphHybridRetriever';
    this.graphStore = graphStore;
    this.defaultGraphWeight = config.defaultGraphWeight ?? DEFAULT_GRAPH_WEIGHT;
    this.chunkToNodeProperty =
      config.chunkToNodeProperty ?? DEFAULT_CHUNK_TO_NODE_PROPERTY;
    this.rrfK = config.rrfK ?? DEFAULT_RRF_K;

    // Validate graph weight
    if (this.defaultGraphWeight < 0 || this.defaultGraphWeight > 1) {
      throw RetrieverError.configError(
        this.name,
        'defaultGraphWeight must be between 0 and 1'
      );
    }

    // Merge graph context config with defaults
    this.defaultGraphContext = {
      ...DEFAULT_GRAPH_CONTEXT,
      ...config.graphContext,
    };

    // Compose HybridRetriever for dense + sparse
    this.hybridRetriever = new HybridRetriever(
      vectorStore,
      embeddingProvider,
      {
        name: `${this.name}:Hybrid`,
        defaultAlpha: config.defaultAlpha,
        rrfK: config.rrfK,
        bm25Config: config.bm25Config,
      }
    );
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
    this.hybridRetriever.buildIndex(documents);
  };

  /**
   * Retrieve documents using graph-enhanced hybrid search.
   *
   * Combines three signals:
   * 1. Dense (vector similarity)
   * 2. Sparse (BM25 keyword matching)
   * 3. Graph (structural relationships)
   *
   * @param query - Search query (natural language)
   * @param options - Retrieval options including graphWeight
   * @returns Sorted results with full score transparency
   */
  retrieve = async (
    query: string,
    options: GraphHybridRetrievalOptions = {}
  ): Promise<RetrievalResult[]> => {
    // Validate query
    if (!query || query.trim().length === 0) {
      throw RetrieverError.invalidQuery(this.name, 'Query cannot be empty');
    }

    const graphWeight = options.graphWeight ?? this.defaultGraphWeight;
    const topK = options.topK ?? 10;
    const candidateMultiplier =
      options.candidateMultiplier ?? DEFAULT_CANDIDATE_MULTIPLIER;
    const minScore = options.minScore;

    // Merge graph context options
    const graphContext: Required<GraphContextConfig> = {
      ...this.defaultGraphContext,
      ...options.graphContext,
    };

    // Validate graph weight
    if (graphWeight < 0 || graphWeight > 1) {
      throw RetrieverError.invalidQuery(
        this.name,
        'graphWeight must be between 0 and 1'
      );
    }

    // Special case: graphWeight = 0 means no graph signal
    if (graphWeight === 0) {
      const hybridResults = await this.hybridRetriever.retrieve(query, {
        topK,
        alpha: options.alpha,
        minScore,
        filter: options.filter,
      });
      return hybridResults.map((r) => ({
        ...r,
        scores: {
          dense: r.scores?.dense ?? 0,
          sparse: r.scores?.sparse ?? 0,
          graph: 0,
          fused: r.scores?.fused ?? r.score,
        } as GraphHybridScore,
      }));
    }

    // Calculate how many candidates to fetch
    const candidateK = topK * candidateMultiplier;

    // Step 1: Get candidates from hybrid retriever (dense + sparse)
    const hybridResults = await this.hybridRetriever.retrieve(query, {
      topK: candidateK,
      alpha: options.alpha,
      filter: options.filter,
      // Don't apply minScore yet - we'll apply after 3-way fusion
    });

    // If no results from hybrid, return empty
    if (hybridResults.length === 0) {
      return [];
    }

    // Step 2: Map chunks to graph nodes
    const chunkToNode = new Map<string, string>();
    for (const result of hybridResults) {
      const nodeId = result.chunk.metadata?.[this.chunkToNodeProperty] as
        | string
        | undefined;
      if (nodeId) {
        chunkToNode.set(result.id, nodeId);
      }
    }

    // Step 3: Calculate graph scores for each chunk
    const graphScores = await this.calculateGraphScores(
      hybridResults,
      chunkToNode,
      graphContext
    );

    // Step 4: Create ranking lists for 3-way RRF fusion
    const denseRanking = this.extractDenseRanking(hybridResults);
    const sparseRanking = this.extractSparseRanking(hybridResults);
    const graphRanking = this.createGraphRanking(hybridResults, graphScores);

    // Step 5: Fuse with RRF
    const fusedResults = reciprocalRankFusion(
      [denseRanking, sparseRanking, graphRanking],
      this.rrfK
    );

    // Step 6: Normalize RRF scores to 0-1 range
    const normalizedResults = normalizeRRFScores(fusedResults, 3, this.rrfK);

    // Step 7: Apply minScore filter and take topK
    const filteredResults = normalizedResults
      .filter((r) => minScore === undefined || r.score >= minScore)
      .slice(0, topK);

    // Step 8: Convert to RetrievalResult with full score transparency
    return filteredResults.map((r) => {
      const denseContrib = r.contributions.find((c) => c.name === 'dense');
      const sparseContrib = r.contributions.find((c) => c.name === 'sparse');
      const graphContrib = r.contributions.find((c) => c.name === 'graph');

      const scores: GraphHybridScore = {
        dense: denseContrib?.score ?? 0,
        sparse: sparseContrib?.score ?? 0,
        graph: graphContrib?.score ?? 0,
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
   * Calculate graph relevance scores for each chunk.
   *
   * Graph score is based on:
   * 1. Cross-pollination: Neighbors also in result set (weighted by edge weight)
   * 2. Connection strength: Sum of edge weights / depth
   */
  private calculateGraphScores = async (
    results: RetrievalResult[],
    chunkToNode: Map<string, string>,
    graphContext: Required<GraphContextConfig>
  ): Promise<Map<string, number>> => {
    const graphScores = new Map<string, number>();
    const resultIdSet = new Set(results.map((r) => r.id));

    // Build reverse mapping: node ID -> chunk ID
    const nodeToChunk = new Map<string, string>();
    for (const [chunkId, nodeId] of chunkToNode) {
      nodeToChunk.set(nodeId, chunkId);
    }

    // Process each chunk that has a graph node mapping
    for (const [chunkId, nodeId] of chunkToNode) {
      try {
        const neighbors = await this.graphStore.getNeighbors(nodeId, {
          depth: graphContext.depth,
          direction: graphContext.direction,
          edgeTypes:
            graphContext.edgeTypes?.length > 0
              ? (graphContext.edgeTypes as never[])
              : undefined,
          nodeTypes:
            graphContext.nodeTypes?.length > 0
              ? (graphContext.nodeTypes as never[])
              : undefined,
          minWeight: graphContext.minWeight,
          limit: graphContext.maxNeighborsPerChunk,
        });

        let graphScore = 0;

        for (const neighbor of neighbors) {
          // Cross-pollination: neighbor is also a retrieved chunk
          const neighborChunkId = nodeToChunk.get(neighbor.node.id);
          if (neighborChunkId && resultIdSet.has(neighborChunkId)) {
            // Strong signal: related chunk is also in results
            graphScore += 1.0 * (neighbor.edge.weight ?? 0.5);
          }

          // Connection strength: edge weight decayed by depth
          graphScore += (neighbor.edge.weight ?? 0.5) * (1 / neighbor.depth);
        }

        graphScores.set(chunkId, graphScore);
      } catch {
        // Node not found in graph - score remains 0
        graphScores.set(chunkId, 0);
      }
    }

    // Chunks without graph mapping get score 0
    for (const result of results) {
      if (!graphScores.has(result.id)) {
        graphScores.set(result.id, 0);
      }
    }

    return graphScores;
  };

  /**
   * Extract dense ranking from hybrid results.
   */
  private extractDenseRanking = (results: RetrievalResult[]): RankingList => {
    // Sort by dense score descending
    const sorted = [...results].sort(
      (a, b) => (b.scores?.dense ?? 0) - (a.scores?.dense ?? 0)
    );

    return {
      name: 'dense',
      items: sorted.map(
        (r, idx): RankedItem => ({
          id: r.id,
          rank: idx + 1,
          score: r.scores?.dense ?? 0,
          chunk: r.chunk,
        })
      ),
    };
  };

  /**
   * Extract sparse ranking from hybrid results.
   */
  private extractSparseRanking = (results: RetrievalResult[]): RankingList => {
    // Sort by sparse score descending
    const sorted = [...results].sort(
      (a, b) => (b.scores?.sparse ?? 0) - (a.scores?.sparse ?? 0)
    );

    return {
      name: 'sparse',
      items: sorted.map(
        (r, idx): RankedItem => ({
          id: r.id,
          rank: idx + 1,
          score: r.scores?.sparse ?? 0,
          chunk: r.chunk,
        })
      ),
    };
  };

  /**
   * Create graph ranking from calculated scores.
   */
  private createGraphRanking = (
    results: RetrievalResult[],
    graphScores: Map<string, number>
  ): RankingList => {
    // Normalize graph scores to 0-1 range
    const maxScore = Math.max(...graphScores.values(), 0.001);

    // Sort by normalized graph score descending
    const sorted = [...results].sort(
      (a, b) =>
        (graphScores.get(b.id) ?? 0) / maxScore -
        (graphScores.get(a.id) ?? 0) / maxScore
    );

    return {
      name: 'graph',
      items: sorted.map(
        (r, idx): RankedItem => ({
          id: r.id,
          rank: idx + 1,
          score: (graphScores.get(r.id) ?? 0) / maxScore,
          chunk: r.chunk,
        })
      ),
    };
  };

  /**
   * Get the underlying hybrid retriever.
   */
  get hybrid(): HybridRetriever {
    return this.hybridRetriever;
  }

  /**
   * Get the underlying graph store.
   */
  get graph(): GraphStore {
    return this.graphStore;
  }

  /**
   * Check if the BM25 index has been built.
   */
  get isIndexBuilt(): boolean {
    return this.hybridRetriever.isIndexBuilt;
  }
}
