/**
 * Vector Store Module
 *
 * Provides interfaces and implementations for vector storage.
 */

// Types (exported as types for tree-shaking)
export type {
  Chunk,
  ChunkMetadata,
  ChunkWithEmbedding,
  SearchOptions,
  SearchResult,
  MetadataFilter,
  FilterOperator,
  DistanceMetric,
  VectorStore,
  VectorStoreConfig,
  VectorStoreErrorCode,
  VectorStoreErrorDetails,
  // Store-specific config types
  PgVectorStoreConfig,
  ChromaVectorStoreConfig,
  // HNSW types
  HNSWConfig,
  InMemoryIndexType,
  InMemoryVectorStoreConfig,
  // Memory management types (NFR-103)
  EvictionCallback,
} from './types.js';

// Classes
export { VectorStoreError } from './errors.js';
export { BaseVectorStore } from './base-store.js';
export { InMemoryVectorStore } from './memory-store.js';
export { PgVectorStore } from './pg-store.js';
export { ChromaVectorStore } from './chroma-store.js';

// HNSW Index (for advanced users who need direct access)
export { HNSWIndex } from './hnsw-index.js';
export type { HNSWSearchResult } from './hnsw-index.js';
