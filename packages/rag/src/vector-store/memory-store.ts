/**
 * In-Memory Vector Store
 *
 * Vector store implementation supporting both brute-force O(n) search
 * and HNSW O(log n) approximate search.
 *
 * - Brute-force (default): Exact results, suitable for <10K vectors
 * - HNSW: Approximate results, suitable for 10K-100K+ vectors
 */

import type {
  ChunkWithEmbedding,
  SearchOptions,
  SearchResult,
  Chunk,
  InMemoryVectorStoreConfig,
  HNSWConfig,
} from './types.js';
import { BaseVectorStore } from './base-store.js';
import { HNSWIndex } from './hnsw-index.js';

/**
 * Internal storage format for chunks.
 */
interface StoredChunk {
  chunk: Chunk;
  embedding: number[];
}

/**
 * In-memory vector store supporting both brute-force and HNSW search.
 *
 * Features:
 * - No external dependencies
 * - Two search modes: brute-force (exact) and HNSW (approximate)
 * - Full metadata filtering support
 * - Brute-force: suitable for <10K vectors
 * - HNSW: suitable for 10K-100K+ vectors with <100ms latency
 *
 * @example
 * ```typescript
 * // Default brute-force mode
 * const store = new InMemoryVectorStore({ dimensions: 1536 });
 *
 * // HNSW mode for large datasets
 * const store = new InMemoryVectorStore({
 *   dimensions: 1536,
 *   indexType: 'hnsw',
 *   hnswConfig: { M: 16, efSearch: 100 }
 * });
 *
 * await store.insert([
 *   { id: 'chunk-1', content: 'Hello', embedding: [...], metadata: {} }
 * ]);
 *
 * const results = await store.search(queryVector, { topK: 5 });
 * ```
 */
export class InMemoryVectorStore extends BaseVectorStore {
  readonly name = 'InMemoryVectorStore';

  /** Internal storage: id -> chunk with embedding */
  private store: Map<string, StoredChunk> = new Map();

  /** Index type: 'brute-force' or 'hnsw' */
  private readonly indexType: 'brute-force' | 'hnsw';

  /** HNSW index (only initialized when indexType is 'hnsw') */
  private hnswIndex: HNSWIndex | null = null;

  /** HNSW configuration */
  private readonly hnswConfig: HNSWConfig;

  constructor(config: InMemoryVectorStoreConfig) {
    super(config);
    this.indexType = config.indexType ?? 'brute-force';
    this.hnswConfig = config.hnswConfig ?? {};

    // Initialize HNSW index if enabled
    if (this.indexType === 'hnsw') {
      this.hnswIndex = new HNSWIndex(config.dimensions, this.hnswConfig);
    }
  }

  /**
   * Insert chunks into the store.
   *
   * Generates IDs for chunks without them.
   * If HNSW index is enabled, also adds vectors to the index.
   */
  protected _insert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    const ids: string[] = [];

    for (const chunk of chunks) {
      const id = chunk.id || this.generateId();

      // Store chunk without embedding in the chunk object
      const { embedding, ...chunkWithoutEmbedding } = chunk;
      const storedChunk: StoredChunk = {
        chunk: { ...chunkWithoutEmbedding, id },
        embedding,
      };

      this.store.set(id, storedChunk);

      // Add to HNSW index if enabled
      if (this.hnswIndex) {
        this.hnswIndex.insert(id, embedding);
      }

      ids.push(id);
    }

    return ids;
  };

  /**
   * Upsert chunks (insert or update).
   *
   * If a chunk with the same ID exists, it's replaced.
   */
  protected override _upsert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    // For in-memory store, upsert is the same as insert
    // (Map.set overwrites existing keys)
    return this._insert(chunks);
  };

  /**
   * Search for similar chunks.
   *
   * Uses HNSW index when enabled (O(log n)), otherwise brute-force (O(n)).
   */
  protected _search = async (
    query: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> => {
    // Use HNSW index if available
    if (this.hnswIndex) {
      return this.searchWithHNSW(query, options);
    }

    // Fall back to brute-force search
    return this.searchBruteForce(query, options);
  };

  /**
   * HNSW-accelerated search.
   *
   * Gets candidates from HNSW index, then applies metadata filtering
   * and score thresholds from the full chunk data.
   */
  private searchWithHNSW = async (
    query: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> => {
    // Over-fetch candidates to account for filtering
    // If we have filters, get more candidates since some will be filtered out
    const candidateMultiplier = options.filter ? 4 : 2;
    const candidateCount = Math.max(
      (options.topK ?? 10) * candidateMultiplier,
      50 // Minimum candidates for good recall
    );

    // Get candidate IDs from HNSW index
    const candidates = this.hnswIndex!.search(query, candidateCount);

    const results: SearchResult[] = [];

    for (const candidate of candidates) {
      const stored = this.store.get(candidate.id);
      if (!stored) {
        continue; // Should not happen, but be defensive
      }

      // Apply metadata filter
      if (options.filter) {
        if (!this.matchesFilter(stored.chunk.metadata, options.filter)) {
          continue;
        }
      }

      // Convert HNSW distance to similarity score
      // HNSW uses Euclidean distance, convert to similarity: 1 / (1 + distance)
      // But for better accuracy, recompute using the configured distance metric
      const score = this.computeScore(query, stored.embedding);

      // Apply minimum score threshold
      if (options.minScore !== undefined && score < options.minScore) {
        continue;
      }

      // Build result
      const result: SearchResult = {
        id: candidate.id,
        score,
        chunk: options.includeMetadata
          ? stored.chunk
          : { ...stored.chunk, metadata: {} },
      };

      // Optionally include embedding
      if (options.includeVectors) {
        result.embedding = stored.embedding;
      }

      results.push(result);
    }

    // Sort by score descending (HNSW returns by distance, we want similarity)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, options.topK);
  };

  /**
   * Brute-force search (original implementation).
   *
   * Scans all vectors for exact results. O(n) complexity.
   */
  private searchBruteForce = async (
    query: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];

    for (const [id, stored] of this.store) {
      // Apply metadata filter first (cheaper than computing similarity)
      if (options.filter) {
        if (!this.matchesFilter(stored.chunk.metadata, options.filter)) {
          continue;
        }
      }

      // Compute similarity score
      const score = this.computeScore(query, stored.embedding);

      // Apply minimum score threshold
      if (options.minScore !== undefined && score < options.minScore) {
        continue;
      }

      // Build result
      const result: SearchResult = {
        id,
        score,
        chunk: options.includeMetadata
          ? stored.chunk
          : { ...stored.chunk, metadata: {} },
      };

      // Optionally include embedding
      if (options.includeVectors) {
        result.embedding = stored.embedding;
      }

      results.push(result);
    }

    // Sort by score descending and limit to topK
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, options.topK);
  };

  /**
   * Delete chunks by ID.
   *
   * Also removes from HNSW index if enabled.
   */
  protected _delete = async (ids: string[]): Promise<void> => {
    for (const id of ids) {
      this.store.delete(id);

      // Remove from HNSW index if enabled
      if (this.hnswIndex) {
        this.hnswIndex.delete(id);
      }
    }
  };

  /**
   * Get the number of stored chunks.
   */
  count = async (): Promise<number> => {
    return this.store.size;
  };

  /**
   * Remove all chunks from the store.
   *
   * Also clears HNSW index if enabled.
   */
  clear = async (): Promise<void> => {
    this.store.clear();

    // Clear HNSW index if enabled
    if (this.hnswIndex) {
      this.hnswIndex.clear();
    }
  };

  /**
   * Get the current index type.
   */
  getIndexType = (): 'brute-force' | 'hnsw' => {
    return this.indexType;
  };
}
