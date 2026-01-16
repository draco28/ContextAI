/**
 * @contextai/rag - RAG Engine
 *
 * Document loading, chunking, and retrieval for AI applications.
 *
 * @packageDocumentation
 */

export const VERSION = '0.0.1';

// Document Loaders
export {
  // Classes
  BaseDocumentLoader,
  DocumentLoaderRegistry,
  LoaderError,
  defaultRegistry,
  // Types
  type Document,
  type DocumentLoader,
  type DocumentMetadata,
  type LoadOptions,
  type LoaderErrorCode,
  type LoaderErrorDetails,
  type RegisterOptions,
} from './loaders/index.js';

// Embedding Providers
export {
  // Classes
  BaseEmbeddingProvider,
  EmbeddingError,
  // Utilities
  dotProduct,
  l2Norm,
  normalizeL2,
  cosineSimilarity,
  euclideanDistance,
  isNormalized,
  meanEmbedding,
  // Types
  type EmbeddingResult,
  type EmbeddingProvider,
  type EmbeddingProviderConfig,
  type EmbeddingErrorCode,
  type EmbeddingErrorDetails,
} from './embeddings/index.js';

// Vector Stores
export {
  // Classes
  BaseVectorStore,
  InMemoryVectorStore,
  VectorStoreError,
  // Types
  type Chunk,
  type ChunkMetadata,
  type ChunkWithEmbedding,
  type SearchOptions,
  type SearchResult,
  type MetadataFilter,
  type FilterOperator,
  type DistanceMetric,
  type VectorStore,
  type VectorStoreConfig,
  type VectorStoreErrorCode,
  type VectorStoreErrorDetails,
} from './vector-store/index.js';
