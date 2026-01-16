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

// Classes
export { EmbeddingError } from './errors.js';
export { BaseEmbeddingProvider } from './base-provider.js';

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
