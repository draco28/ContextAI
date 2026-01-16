/**
 * In-Memory Vector Store
 *
 * Reference implementation for testing and development.
 * Uses brute-force similarity search (O(n) per query).
 */

import type {
  VectorStoreConfig,
  ChunkWithEmbedding,
  SearchOptions,
  SearchResult,
  Chunk,
} from './types.js';
import { BaseVectorStore } from './base-store.js';

/**
 * Internal storage format for chunks.
 */
interface StoredChunk {
  chunk: Chunk;
  embedding: number[];
}

/**
 * In-memory vector store for testing and small-scale use.
 *
 * Features:
 * - No external dependencies
 * - Brute-force similarity search
 * - Full metadata filtering support
 * - Suitable for up to ~10K vectors
 *
 * @example
 * ```typescript
 * const store = new InMemoryVectorStore({ dimensions: 1536 });
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

  constructor(config: VectorStoreConfig) {
    super(config);
  }

  /**
   * Insert chunks into the store.
   *
   * Generates IDs for chunks without them.
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
   * Search for similar chunks using brute-force comparison.
   */
  protected _search = async (
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
   */
  protected _delete = async (ids: string[]): Promise<void> => {
    for (const id of ids) {
      this.store.delete(id);
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
   */
  clear = async (): Promise<void> => {
    this.store.clear();
  };
}
