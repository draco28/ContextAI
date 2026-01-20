/**
 * Adaptive RAG Module
 *
 * Query classification and adaptive retrieval for optimizing
 * RAG pipeline based on query complexity.
 *
 * @example
 * ```typescript
 * import { AdaptiveRAG, QueryClassifier } from '@contextai/rag';
 *
 * // Use standalone classifier
 * const classifier = new QueryClassifier();
 * const classification = classifier.classify('Hello there!');
 * // classification.type === 'simple'
 *
 * // Use adaptive wrapper
 * const adaptiveRag = new AdaptiveRAG({ engine: ragEngine });
 * const result = await adaptiveRag.search('Compare React and Vue');
 * // Automatically uses multi-query enhancement
 * ```
 */

// Types
export type {
  QueryType,
  QueryFeatures,
  ClassificationResult,
  PipelineRecommendation,
  ClassificationThresholds,
  QueryClassifierConfig,
  AdaptiveRAGConfig,
  SkipRetrievalOptions,
  AdaptiveSearchOptions,
  ConversationMessage,
  AdaptiveRAGResult,
  IQueryClassifier,
  IAdaptiveRAG,
  AdaptiveRAGErrorCode,
  AdaptiveRAGErrorDetails,
} from './types.js';

// Classes
export { QueryClassifier } from './query-classifier.js';
export { AdaptiveRAG } from './adaptive-rag.js';
export { AdaptiveRAGError } from './errors.js';
