/**
 * ChromaDB Vector Store
 *
 * Vector store implementation using ChromaDB (embedded or server mode).
 *
 * @example
 * ```typescript
 * // Embedded mode (local storage)
 * const store = new ChromaVectorStore({
 *   dimensions: 1536,
 *   mode: 'embedded',
 *   persistPath: './chroma_data',
 * });
 *
 * // Server mode (connect to Chroma server)
 * const store = new ChromaVectorStore({
 *   dimensions: 1536,
 *   mode: 'server',
 *   serverUrl: 'http://localhost:8000',
 * });
 *
 * await store.insert(chunks);
 * const results = await store.search(queryVector, { topK: 10 });
 * ```
 */

import type {
  ChromaVectorStoreConfig,
  ChunkWithEmbedding,
  SearchOptions,
  SearchResult,
  Chunk,
  MetadataFilter,
  FilterOperator,
} from './types.js';
import { BaseVectorStore } from './base-store.js';
import { VectorStoreError } from './errors.js';

// ============================================================================
// Chroma Types (inline to avoid requiring chromadb types)
// ============================================================================

/** Minimal ChromaClient interface */
interface ChromaClient {
  getOrCreateCollection(params: {
    name: string;
    metadata?: Record<string, unknown>;
  }): Promise<ChromaCollection>;
}

/** Minimal Collection interface */
interface ChromaCollection {
  add(params: {
    ids: string[];
    embeddings: number[][];
    documents?: string[];
    metadatas?: Record<string, unknown>[];
  }): Promise<void>;
  update(params: {
    ids: string[];
    embeddings?: number[][];
    documents?: string[];
    metadatas?: Record<string, unknown>[];
  }): Promise<void>;
  query(params: {
    queryEmbeddings: number[][];
    nResults?: number;
    where?: Record<string, unknown>;
    include?: string[];
  }): Promise<ChromaQueryResult>;
  get(params: { ids: string[]; include?: string[] }): Promise<ChromaGetResult>;
  delete(params: { ids: string[] }): Promise<void>;
  count(): Promise<number>;
}

/** Query result from Chroma */
interface ChromaQueryResult {
  ids: string[][];
  distances?: number[][];
  documents?: (string | null)[][];
  metadatas?: (Record<string, unknown> | null)[][];
  embeddings?: number[][][];
}

/** Get result from Chroma */
interface ChromaGetResult {
  ids: string[];
  documents?: (string | null)[];
  metadatas?: (Record<string, unknown> | null)[];
  embeddings?: number[][];
}

/**
 * ChromaDB vector store for production vector search.
 *
 * Features:
 * - Embedded or server mode
 * - Native metadata filtering
 * - Automatic collection management
 * - Simple setup (no SQL)
 */
export class ChromaVectorStore extends BaseVectorStore {
  readonly name = 'ChromaVectorStore';

  private client: ChromaClient | null = null;
  private collection: ChromaCollection | null = null;
  private readonly collectionName: string;
  private readonly mode: 'embedded' | 'server';
  private readonly serverUrl: string;
  private readonly persistPath: string;
  private readonly auth?: { provider: 'token' | 'basic'; credentials: string };

  constructor(config: ChromaVectorStoreConfig) {
    super(config);

    this.collectionName = config.collectionName ?? 'default_collection';
    this.mode = config.mode ?? 'embedded';
    this.serverUrl = config.serverUrl ?? 'http://localhost:8000';
    this.persistPath = config.persistPath ?? './chroma_data';
    this.auth = config.auth;
  }

  /**
   * Lazily initialize the Chroma client.
   */
  private getClient = async (): Promise<ChromaClient> => {
    if (this.client) {
      return this.client;
    }

    try {
      // Dynamic import to handle optional peer dependency
      // Using variable to prevent TypeScript from resolving the module
      const moduleName = 'chromadb';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chromadb = (await import(moduleName)) as any;

      if (this.mode === 'embedded') {
        // Embedded mode - uses local persistence
        const { ChromaClient: ChromaClientClass } = chromadb;
        this.client = new ChromaClientClass({
          path: this.persistPath,
        }) as ChromaClient;
      } else {
        // Server mode - connects to remote Chroma
        const { ChromaClient: ChromaClientClass } = chromadb;
        const clientConfig: Record<string, unknown> = {
          path: this.serverUrl,
        };

        if (this.auth) {
          clientConfig.auth = this.auth;
        }

        this.client = new ChromaClientClass(clientConfig) as ChromaClient;
      }

      return this.client;
    } catch (error) {
      throw VectorStoreError.storeUnavailable(
        this.name,
        'chromadb package not installed. Run: pnpm add chromadb',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Lazily get or create the collection.
   */
  private getCollection = async (): Promise<ChromaCollection> => {
    if (this.collection) {
      return this.collection;
    }

    const client = await this.getClient();

    try {
      this.collection = await client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          dimensions: this.dimensions,
          distanceMetric: this.distanceMetric,
        },
      });

      return this.collection;
    } catch (error) {
      throw VectorStoreError.storeUnavailable(
        this.name,
        'Failed to create/get collection',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Convert Chroma distance to similarity score.
   *
   * Chroma returns squared L2 distance by default.
   * For cosine, it returns 1 - cosine_similarity.
   */
  private distanceToScore(distance: number): number {
    switch (this.distanceMetric) {
      case 'cosine':
        // Chroma returns cosine distance (1 - similarity)
        return 1 - distance;
      case 'euclidean':
        // Chroma returns squared L2, convert to similarity
        return 1 / (1 + Math.sqrt(distance));
      case 'dotProduct':
        // For dot product, higher is better (no conversion needed)
        // But Chroma may return negative, so negate
        return -distance;
      default:
        return 1 - distance;
    }
  }

  /**
   * Translate our MetadataFilter to Chroma's where clause format.
   */
  private translateFilter(filter: MetadataFilter): Record<string, unknown> {
    const conditions: Record<string, unknown>[] = [];

    for (const [key, condition] of Object.entries(filter)) {
      if (this.isOperatorObject(condition)) {
        conditions.push(this.translateOperator(key, condition));
      } else {
        // Direct equality
        conditions.push({ [key]: { $eq: condition } });
      }
    }

    // Combine with $and if multiple conditions
    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0]!;
    }

    return { $and: conditions };
  }

  /**
   * Translate a single operator to Chroma format.
   */
  private translateOperator(
    key: string,
    operator: FilterOperator
  ): Record<string, unknown> {
    if ('$in' in operator) {
      return { [key]: { $in: operator.$in } };
    }
    if ('$ne' in operator) {
      return { [key]: { $ne: operator.$ne } };
    }
    if ('$gt' in operator) {
      return { [key]: { $gt: operator.$gt } };
    }
    if ('$gte' in operator) {
      return { [key]: { $gte: operator.$gte } };
    }
    if ('$lt' in operator) {
      return { [key]: { $lt: operator.$lt } };
    }
    if ('$lte' in operator) {
      return { [key]: { $lte: operator.$lte } };
    }

    // Fallback - should not reach
    return {};
  }

  /**
   * Check if a value is a filter operator object.
   */
  private isOperatorObject(value: unknown): value is FilterOperator {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const keys = Object.keys(value);
    const firstKey = keys[0];
    return (
      keys.length === 1 &&
      firstKey !== undefined &&
      ['$in', '$gt', '$gte', '$lt', '$lte', '$ne'].includes(firstKey)
    );
  }

  /**
   * Insert chunks with embeddings.
   */
  protected _insert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    const collection = await this.getCollection();

    const ids = chunks.map((c) => c.id || this.generateId());
    const embeddings = chunks.map((c) => c.embedding);
    const documents = chunks.map((c) => c.content);
    const metadatas = chunks.map((c) => ({
      ...c.metadata,
      ...(c.documentId ? { documentId: c.documentId } : {}),
    }));

    try {
      await collection.add({
        ids,
        embeddings,
        documents,
        metadatas,
      });

      return ids;
    } catch (error) {
      throw VectorStoreError.insertFailed(
        this.name,
        'Failed to add to collection',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Upsert chunks (insert or update).
   */
  protected override _upsert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    const collection = await this.getCollection();

    const ids = chunks.map((c) => c.id || this.generateId());
    const embeddings = chunks.map((c) => c.embedding);
    const documents = chunks.map((c) => c.content);
    const metadatas = chunks.map((c) => ({
      ...c.metadata,
      ...(c.documentId ? { documentId: c.documentId } : {}),
    }));

    try {
      // Check which IDs exist
      const existing = await collection.get({ ids });
      const existingIds = new Set(existing.ids);

      // Split into inserts and updates
      const toInsert: {
        ids: string[];
        embeddings: number[][];
        documents: string[];
        metadatas: Record<string, unknown>[];
      } = { ids: [], embeddings: [], documents: [], metadatas: [] };

      const toUpdate: {
        ids: string[];
        embeddings: number[][];
        documents: string[];
        metadatas: Record<string, unknown>[];
      } = { ids: [], embeddings: [], documents: [], metadatas: [] };

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        const target = existingIds.has(id) ? toUpdate : toInsert;
        target.ids.push(id);
        target.embeddings.push(embeddings[i]!);
        target.documents.push(documents[i]!);
        target.metadatas.push(metadatas[i]!);
      }

      // Perform inserts and updates
      if (toInsert.ids.length > 0) {
        await collection.add(toInsert);
      }

      if (toUpdate.ids.length > 0) {
        await collection.update(toUpdate);
      }

      return ids;
    } catch (error) {
      throw VectorStoreError.insertFailed(
        this.name,
        'Failed to upsert to collection',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Search for similar chunks.
   */
  protected _search = async (
    query: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> => {
    const collection = await this.getCollection();

    const queryParams: {
      queryEmbeddings: number[][];
      nResults?: number;
      where?: Record<string, unknown>;
      include: string[];
    } = {
      queryEmbeddings: [query],
      nResults: options.topK,
      include: ['documents', 'metadatas', 'distances'],
    };

    if (options.includeVectors) {
      queryParams.include.push('embeddings');
    }

    if (options.filter) {
      queryParams.where = this.translateFilter(options.filter);
    }

    try {
      const results = await collection.query(queryParams);

      // Chroma returns nested arrays (one per query)
      const ids = results.ids[0] ?? [];
      const distances = results.distances?.[0] ?? [];
      const documents = results.documents?.[0] ?? [];
      const metadatas = results.metadatas?.[0] ?? [];
      const embeddings = results.embeddings?.[0];

      return ids
        .map((id, i) => {
          const score = this.distanceToScore(distances[i] ?? 0);

          // Apply minScore filter
          if (options.minScore !== undefined && score < options.minScore) {
            return null;
          }

          const chunk: Chunk = {
            id,
            content: documents[i] ?? '',
            metadata:
              options.includeMetadata !== false ? (metadatas[i] ?? {}) : {},
          };

          // Extract documentId from metadata if present
          if (chunk.metadata.documentId) {
            chunk.documentId = chunk.metadata.documentId as string;
            if (options.includeMetadata !== false) {
              // Keep it in metadata too
            }
          }

          const searchResult: SearchResult = {
            id,
            score,
            chunk,
          };

          if (options.includeVectors && embeddings) {
            searchResult.embedding = embeddings[i];
          }

          return searchResult;
        })
        .filter((r): r is SearchResult => r !== null);
    } catch (error) {
      throw VectorStoreError.invalidQuery(
        this.name,
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * Delete chunks by ID.
   */
  protected _delete = async (ids: string[]): Promise<void> => {
    const collection = await this.getCollection();

    try {
      await collection.delete({ ids });
    } catch (error) {
      throw VectorStoreError.deleteFailed(
        this.name,
        'Failed to delete from collection',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Get count of stored chunks.
   */
  count = async (): Promise<number> => {
    const collection = await this.getCollection();
    return collection.count();
  };

  /**
   * Remove all chunks from the store.
   *
   * Note: Chroma doesn't have a native "clear" - we delete all IDs.
   */
  clear = async (): Promise<void> => {
    // Get collection and reset it by recreating
    const client = await this.getClient();

    try {
      // Delete and recreate the collection
      // @ts-expect-error - Chroma client has deleteCollection method
      await client.deleteCollection({ name: this.collectionName });

      // Clear cached collection so it gets recreated
      this.collection = null;
    } catch {
      // Collection might not exist, which is fine
      this.collection = null;
    }
  };
}
