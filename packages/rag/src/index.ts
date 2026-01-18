/**
 * @contextai/rag - RAG Engine
 *
 * Document loading, chunking, and retrieval for AI applications.
 *
 * @packageDocumentation
 */

export const VERSION = '0.0.1';

// Cache
export {
  // Classes
  LRUCacheProvider,
  NoCacheProvider,
  // Types
  type CacheProvider,
  type CacheStats,
  type LRUCacheConfig,
} from './cache/index.js';

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
  // Base Classes & Errors
  BaseEmbeddingProvider,
  EmbeddingError,
  // Providers
  HuggingFaceEmbeddingProvider,
  OllamaEmbeddingProvider,
  // Cache
  LRUEmbeddingCache,
  CachedEmbeddingProvider,
  generateCacheKey,
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
  type HuggingFaceEmbeddingConfig,
  type OllamaEmbeddingConfig,
  type EmbeddingCache,
  type LRUEmbeddingCacheConfig,
  type CachedEmbeddingProviderConfig,
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

// Text Chunking
export {
  // Classes
  BaseChunker,
  ChunkerRegistry,
  ChunkerError,
  FixedSizeChunker,
  RecursiveChunker,
  SentenceChunker,
  defaultChunkerRegistry,
  // Utilities
  CHARS_PER_TOKEN,
  estimateTokens,
  countCharacters,
  measureSize,
  convertSize,
  findSizeIndex,
  splitBySize,
  DEFAULT_CHUNKING_OPTIONS,
  // Types
  type ChunkingOptions,
  type ChunkingStrategy,
  type ChunkerErrorCode,
  type ChunkerErrorDetails,
  type SizeUnit,
} from './chunking/index.js';
