/**
 * PostgreSQL pgvector Store
 *
 * Vector store implementation using PostgreSQL with the pgvector extension.
 * Supports HNSW indexing for fast approximate nearest neighbor search.
 *
 * @example
 * ```typescript
 * const store = new PgVectorStore({
 *   dimensions: 1536,
 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb',
 * });
 *
 * await store.ensureTable(); // Create table and indexes
 * await store.insert(chunks);
 * const results = await store.search(queryVector, { topK: 10 });
 * await store.close(); // Cleanup
 * ```
 */

import { escapeIdentifier } from '@contextai/core';
import type {
  PgVectorStoreConfig,
  ChunkWithEmbedding,
  SearchOptions,
  SearchResult,
  Chunk,
  MetadataFilter,
  FilterOperator,
} from './types.js';

// ============================================================================
// pg Types (inline to avoid requiring @types/pg for optional dependency)
// ============================================================================

/** Minimal Pool interface from pg */
interface PgPool {
  connect(): Promise<PgPoolClient>;
  query(text: string, values?: unknown[]): Promise<PgQueryResult>;
  end(): Promise<void>;
}

/** Minimal PoolClient interface from pg */
interface PgPoolClient {
  query(text: string, values?: unknown[]): Promise<PgQueryResult>;
  release(): void;
}

/** Minimal QueryResult interface from pg */
interface PgQueryResult {
  rows: PgRow[];
  rowCount: number | null;
}

/** Row type for search results */
interface PgRow {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  document_id: string | null;
  distance: number;
  count?: string;
}
import { BaseVectorStore } from './base-store.js';
import { VectorStoreError } from './errors.js';

/**
 * PostgreSQL pgvector store for production vector search.
 *
 * Features:
 * - HNSW indexing for fast approximate search
 * - JSONB metadata with filtering
 * - Connection pooling
 * - Transaction support for batch operations
 * - All queries use parameterized statements (SQL injection safe)
 */
export class PgVectorStore extends BaseVectorStore {
  readonly name = 'PgVectorStore';

  private pool: PgPool;
  private poolOwned: boolean;
  private readonly tableName: string;
  private readonly schemaName: string;
  private readonly indexType: 'hnsw' | 'ivfflat' | 'none';
  private readonly hnswM: number;
  private readonly hnswEfConstruction: number;

  constructor(config: PgVectorStoreConfig) {
    super(config);

    // Validate: must have either connectionString or pool
    if (!config.connectionString && !config.pool) {
      throw VectorStoreError.storeUnavailable(
        'PgVectorStore',
        'Either connectionString or pool must be provided'
      );
    }

    // Configuration with defaults
    this.tableName = config.tableName ?? 'vector_chunks';
    this.schemaName = config.schemaName ?? 'public';
    this.indexType = config.indexType ?? 'hnsw';
    this.hnswM = config.hnswM ?? 16;
    this.hnswEfConstruction = config.hnswEfConstruction ?? 64;

    // Initialize pool
    if (config.pool) {
      this.pool = config.pool as PgPool;
      this.poolOwned = false;
    } else {
      // Lazy import pg to keep it optional
      this.pool = this.createPool(config);
      this.poolOwned = true;
    }
  }

  /**
   * Create a new pg Pool from config.
   * Separated for testability.
   */
  private createPool(config: PgVectorStoreConfig): PgPool {
    try {
      // Dynamic import to handle optional peer dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const { Pool: PgPoolClass } = require('pg') as {
        Pool: new (config: unknown) => PgPool;
      };
      return new PgPoolClass({
        connectionString: config.connectionString,
        max: config.maxConnections ?? 10,
        idleTimeoutMillis: config.idleTimeoutMs ?? 30000,
      });
    } catch {
      throw VectorStoreError.storeUnavailable(
        this.name,
        'pg package not installed. Run: pnpm add pg'
      );
    }
  }

  /**
   * Get the fully qualified table name (schema.table).
   */
  private get fullTableName(): string {
    return `${escapeIdentifier(this.schemaName)}.${escapeIdentifier(this.tableName)}`;
  }

  /**
   * Get the distance operator for the configured metric.
   */
  private get distanceOperator(): string {
    switch (this.distanceMetric) {
      case 'cosine':
        return '<=>';
      case 'euclidean':
        return '<->';
      case 'dotProduct':
        return '<#>';
      default:
        return '<=>';
    }
  }

  /**
   * Get the index operator class for the configured metric.
   */
  private get indexOpClass(): string {
    switch (this.distanceMetric) {
      case 'cosine':
        return 'vector_cosine_ops';
      case 'euclidean':
        return 'vector_l2_ops';
      case 'dotProduct':
        return 'vector_ip_ops';
      default:
        return 'vector_cosine_ops';
    }
  }

  /**
   * Convert distance to similarity score (higher = more similar).
   */
  private distanceToScore(distance: number): number {
    switch (this.distanceMetric) {
      case 'cosine':
        // Cosine distance is 1 - similarity, so similarity = 1 - distance
        return 1 - distance;
      case 'euclidean':
        // Convert distance to similarity: 1 / (1 + distance)
        return 1 / (1 + distance);
      case 'dotProduct':
        // pgvector stores negative inner product, so negate
        return -distance;
      default:
        return 1 - distance;
    }
  }

  /**
   * Format embedding array as pgvector string.
   */
  private formatVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Create table and indexes if they don't exist.
   *
   * Should be called once before using the store.
   */
  ensureTable = async (): Promise<void> => {
    const client = await this.pool.connect();
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create table
      const createTableSQL = `                                                                                                                    
          CREATE TABLE IF NOT EXISTS ${this.fullTableName} (                                                                                        
            id TEXT PRIMARY KEY,                                                                                                                    
            content TEXT NOT NULL,                                                                                                                  
            embedding vector(${this.dimensions}),                                                                                                   
            metadata JSONB DEFAULT '{}',                                                                                                            
            document_id TEXT,                                                                                                                       
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,                                                                                       
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP                                                                                        
          )                                                                                                                                         
        `;
      await client.query(createTableSQL);

      // Create indexes based on configuration
      if (this.indexType === 'hnsw') {
        const indexName = `${this.tableName}_embedding_hnsw_idx`;
        const createIndexSQL = `                                                                                                                  
            CREATE INDEX IF NOT EXISTS ${escapeIdentifier(indexName)}                                                                               
            ON ${this.fullTableName}                                                                                                                
            USING hnsw (embedding ${this.indexOpClass})                                                                                             
            WITH (m = ${this.hnswM}, ef_construction = ${this.hnswEfConstruction})                                                                  
          `;
        await client.query(createIndexSQL);
      } else if (this.indexType === 'ivfflat') {
        const indexName = `${this.tableName}_embedding_ivfflat_idx`;
        const createIndexSQL = `                                                                                                                  
            CREATE INDEX IF NOT EXISTS ${escapeIdentifier(indexName)}                                                                               
            ON ${this.fullTableName}                                                                                                                
            USING ivfflat (embedding ${this.indexOpClass})                                                                                          
            WITH (lists = 100)                                                                                                                      
          `;
        await client.query(createIndexSQL);
      }

      // Create JSONB index for metadata filtering
      const metadataIndexName = `${this.tableName}_metadata_idx`;
      await client.query(`                                                                                                                        
          CREATE INDEX IF NOT EXISTS ${escapeIdentifier(metadataIndexName)}                                                                         
          ON ${this.fullTableName}                                                                                                                  
          USING gin (metadata)                                                                                                                      
        `);

      // Create document_id index
      const docIdIndexName = `${this.tableName}_document_id_idx`;
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${escapeIdentifier(docIdIndexName)}
        ON ${this.fullTableName} (document_id)
      `);
    } catch (error) {
      throw VectorStoreError.storeUnavailable(
        this.name,
        'Failed to create table/indexes',
        error instanceof Error ? error : undefined
      );
    } finally {
      client.release();
    }
  };

  /**
   * Insert chunks with embeddings.
   */
  protected _insert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const ids: string[] = [];
      for (const chunk of chunks) {
        const id = chunk.id || this.generateId();
        const vectorStr = this.formatVector(chunk.embedding);

        // Parameterized INSERT - no SQL injection possible
        await client.query(
          `INSERT INTO ${this.fullTableName}                                                                                                      
             (id, content, embedding, metadata, document_id)                                                                                        
             VALUES ($1, $2, $3::vector, $4, $5)`,
          [
            id,
            chunk.content,
            vectorStr,
            JSON.stringify(chunk.metadata),
            chunk.documentId ?? null,
          ]
        );
        ids.push(id);
      }

      await client.query('COMMIT');
      return ids;
    } catch (error) {
      await client.query('ROLLBACK');
      throw VectorStoreError.insertFailed(
        this.name,
        'Transaction failed',
        error instanceof Error ? error : undefined
      );
    } finally {
      client.release();
    }
  };

  /**
   * Upsert chunks (insert or update on conflict).
   */
  protected override _upsert = async (
    chunks: ChunkWithEmbedding[]
  ): Promise<string[]> => {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const ids: string[] = [];
      for (const chunk of chunks) {
        const id = chunk.id || this.generateId();
        const vectorStr = this.formatVector(chunk.embedding);

        // Parameterized UPSERT using ON CONFLICT
        await client.query(
          `INSERT INTO ${this.fullTableName}                                                                                                      
             (id, content, embedding, metadata, document_id, updated_at)                                                                            
             VALUES ($1, $2, $3::vector, $4, $5, CURRENT_TIMESTAMP)                                                                                 
             ON CONFLICT (id) DO UPDATE SET                                                                                                         
               content = EXCLUDED.content,                                                                                                          
               embedding = EXCLUDED.embedding,                                                                                                      
               metadata = EXCLUDED.metadata,                                                                                                        
               document_id = EXCLUDED.document_id,                                                                                                  
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            chunk.content,
            vectorStr,
            JSON.stringify(chunk.metadata),
            chunk.documentId ?? null,
          ]
        );
        ids.push(id);
      }

      await client.query('COMMIT');
      return ids;
    } catch (error) {
      await client.query('ROLLBACK');
      throw VectorStoreError.insertFailed(
        this.name,
        'Upsert transaction failed',
        error instanceof Error ? error : undefined
      );
    } finally {
      client.release();
    }
  };

  /**
   * Search for similar chunks.
   */
  protected _search = async (
    query: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> => {
    const vectorStr = this.formatVector(query);
    const values: unknown[] = [vectorStr];
    let paramIndex = 2;

    // Build WHERE clause for metadata filtering
    let whereClause = '';
    if (options.filter) {
      const { sql, filterValues, nextIndex } = this.buildFilterSQL(
        options.filter,
        paramIndex
      );
      if (sql) {
        whereClause = `WHERE ${sql}`;
        values.push(...filterValues);
        paramIndex = nextIndex;
      }
    }

    // Build the search query
    // Using subquery pattern for efficiency with LIMIT
    const searchSQL = `                                                                                                                           
        SELECT                                                                                                                                      
          id,                                                                                                                                       
          content,                                                                                                                                  
          metadata,                                                                                                                                 
          document_id,                                                                                                                              
          embedding ${this.distanceOperator} $1::vector AS distance                                                                                 
        FROM ${this.fullTableName}                                                                                                                  
        ${whereClause}                                                                                                                              
        ORDER BY embedding ${this.distanceOperator} $1::vector                                                                                      
        LIMIT $${paramIndex}                                                                                                                        
      `;
    values.push(options.topK);

    try {
      const result = await this.pool.query(searchSQL, values);

      return result.rows
        .map((row: PgRow) => {
          const score = this.distanceToScore(row.distance);

          // Apply minScore filter (post-query for accuracy)
          if (options.minScore !== undefined && score < options.minScore) {
            return null;
          }

          const chunk: Chunk = {
            id: row.id,
            content: row.content,
            metadata: options.includeMetadata ? row.metadata : {},
            documentId: row.document_id ?? undefined,
          };

          const searchResult: SearchResult = {
            id: row.id,
            score,
            chunk,
          };

          // Note: includeVectors requires additional query or storing in result
          // For efficiency, we don't include vectors by default

          return searchResult;
        })
        .filter((r: SearchResult | null): r is SearchResult => r !== null);
    } catch (error) {
      throw VectorStoreError.invalidQuery(
        this.name,
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * Build SQL WHERE clause from metadata filter.
   */
  private buildFilterSQL(
    filter: MetadataFilter,
    startIndex: number
  ): { sql: string; filterValues: unknown[]; nextIndex: number } {
    const conditions: string[] = [];
    const filterValues: unknown[] = [];
    let paramIndex = startIndex;

    for (const [key, condition] of Object.entries(filter)) {
      if (this.isOperatorObject(condition)) {
        const { sql, values, nextIndex } = this.buildOperatorSQL(
          key,
          condition,
          paramIndex
        );
        conditions.push(sql);
        filterValues.push(...values);
        paramIndex = nextIndex;
      } else {
        // Direct equality: metadata->>'key' = $N
        conditions.push(`metadata->>$${paramIndex} = $${paramIndex + 1}`);
        filterValues.push(key, String(condition));
        paramIndex += 2;
      }
    }

    return {
      sql: conditions.join(' AND '),
      filterValues,
      nextIndex: paramIndex,
    };
  }

  /**
   * Build SQL for a filter operator.
   */
  private buildOperatorSQL(
    key: string,
    operator: FilterOperator,
    startIndex: number
  ): { sql: string; values: unknown[]; nextIndex: number } {
    const paramIndex = startIndex;
    const values: unknown[] = [];

    if ('$in' in operator) {
      // metadata->>'key' = ANY($N)
      const sql = `metadata->>$${paramIndex} = ANY($${paramIndex + 1})`;
      values.push(key, operator.$in.map(String));
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    if ('$ne' in operator) {
      // metadata->>'key' != $N OR metadata->>'key' IS NULL
      const sql = `(metadata->>$${paramIndex} != $${paramIndex + 1} OR metadata->>$${paramIndex} IS NULL)`;
      values.push(key, String(operator.$ne));
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    // Numeric comparisons: cast to numeric
    if ('$gt' in operator) {
      const sql = `(metadata->$${paramIndex})::numeric > $${paramIndex + 1}`;
      values.push(key, operator.$gt);
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    if ('$gte' in operator) {
      const sql = `(metadata->$${paramIndex})::numeric >= $${paramIndex + 1}`;
      values.push(key, operator.$gte);
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    if ('$lt' in operator) {
      const sql = `(metadata->$${paramIndex})::numeric < $${paramIndex + 1}`;
      values.push(key, operator.$lt);
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    if ('$lte' in operator) {
      const sql = `(metadata->$${paramIndex})::numeric <= $${paramIndex + 1}`;
      values.push(key, operator.$lte);
      return { sql, values, nextIndex: paramIndex + 2 };
    }

    // Fallback: should not reach here
    return { sql: 'TRUE', values: [], nextIndex: paramIndex };
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
   * Delete chunks by ID.
   */
  protected _delete = async (ids: string[]): Promise<void> => {
    // Build parameterized IN clause
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const deleteSQL = `DELETE FROM ${this.fullTableName} WHERE id IN (${placeholders})`;

    try {
      await this.pool.query(deleteSQL, ids);
    } catch (error) {
      throw VectorStoreError.deleteFailed(
        this.name,
        'Delete failed',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Get count of stored chunks.
   */
  count = async (): Promise<number> => {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${this.fullTableName}`
    );
    const row = result.rows[0] as { count: string } | undefined;
    return parseInt(row?.count ?? '0', 10);
  };

  /**
   * Remove all chunks from the store.
   */
  clear = async (): Promise<void> => {
    await this.pool.query(`TRUNCATE ${this.fullTableName}`);
  };

  /**
   * Close the connection pool.
   *
   * Only closes if this store owns the pool (created from connectionString).
   */
  close = async (): Promise<void> => {
    if (this.poolOwned) {
      await this.pool.end();
    }
  };
}
