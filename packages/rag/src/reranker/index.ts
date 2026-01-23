/**
 * Reranker Module
 *
 * Post-retrieval re-ranking for improved relevance.
 * Rerankers score query-document pairs more accurately than initial retrieval.
 *
 * Available rerankers:
 * - BGEReranker: Cross-encoder via Transformers.js (recommended)
 * - MMRReranker: Maximal Marginal Relevance for diversity
 * - LLMReranker: LLM-based scoring (most accurate, most expensive)
 *
 * Position bias utilities help optimize document ordering for LLM context.
 *
 * @example
 * ```typescript
 * import {
 *   BGEReranker,
 *   MMRReranker,
 *   LLMReranker,
 *   applyPositionBias,
 * } from '@contextaisdk/rag';
 *
 * // Cross-encoder reranking (best balance of quality/speed)
 * const bgeReranker = new BGEReranker({
 *   modelName: 'Xenova/bge-reranker-base',
 * });
 *
 * // Diversity-aware reranking
 * const mmrReranker = new MMRReranker({
 *   defaultLambda: 0.7,
 *   embeddingProvider: myEmbeddings,
 * });
 *
 * // Rerank and apply position bias
 * const reranked = await bgeReranker.rerank(query, results, { topK: 10 });
 * const optimized = applyPositionBias(reranked, { strategy: 'sandwich' });
 * ```
 *
 * @module reranker
 */

// Types
export type {
  Reranker,
  RerankerResult,
  RerankerScores,
  RerankerOptions,
  MMRRerankerOptions,
  LLMRerankerOptions,
  BGERerankerConfig,
  MMRRerankerConfig,
  LLMRerankerConfig,
  PositionBiasStrategy,
  PositionBiasConfig,
  RerankerErrorCode,
  RerankerErrorDetails,
} from './types.js';

// Errors
export { RerankerError } from './errors.js';

// Base class (for extension)
export { BaseReranker, type InternalRerankerResult } from './base-reranker.js';

// Reranker implementations
export { BGEReranker } from './bge-reranker.js';
export { MMRReranker } from './mmr-reranker.js';
export { LLMReranker } from './llm-reranker.js';

// Position bias utilities
export {
  applyPositionBias,
  applySandwichOrdering,
  applyReverseSandwichOrdering,
  applyInterleaveOrdering,
  analyzePositionDistribution,
  recommendPositionBiasConfig,
} from './position-bias.js';
