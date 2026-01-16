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
} from './types.js';

// Classes
export { VectorStoreError } from './errors.js';
export { BaseVectorStore } from './base-store.js';
export { InMemoryVectorStore } from './memory-store.js';
