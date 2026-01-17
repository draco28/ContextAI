/**
 * Embedding Provider Module
 *
 * Exports for the RAG embedding system.
 */

// Types
export type {
  EmbeddingResult,
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingErrorCode,
  EmbeddingErrorDetails,
} from './types.js';

// Base Classes & Errors
export { EmbeddingError } from './errors.js';
export { BaseEmbeddingProvider } from './base-provider.js';

// Providers
export {
  HuggingFaceEmbeddingProvider,
  type HuggingFaceEmbeddingConfig,
} from './huggingface-provider.js';

export {
  OllamaEmbeddingProvider,
  type OllamaEmbeddingConfig,
} from './ollama-provider.js';

// Cache
export {
  LRUEmbeddingCache,
  CachedEmbeddingProvider,
  generateCacheKey,
  type EmbeddingCache,
  type LRUEmbeddingCacheConfig,
  type CachedEmbeddingProviderConfig,
} from './cache.js';

// Utilities
export {
  dotProduct,
  l2Norm,
  normalizeL2,
  cosineSimilarity,
  euclideanDistance,
  isNormalized,
  meanEmbedding,
} from './utils.js';
