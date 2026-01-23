/**
 * Query Enhancement Module
 *
 * Pre-retrieval query optimization strategies to improve RAG search quality.
 *
 * Available enhancers:
 * - QueryRewriter: Fix typos, clarify intent
 * - HyDEEnhancer: Generate hypothetical documents for retrieval
 * - MultiQueryExpander: Generate multiple query perspectives
 *
 * All enhancers are opt-in and disabled by default per SRS.
 * They add latency (LLM calls) but can significantly improve retrieval quality.
 *
 * @example
 * ```typescript
 * import {
 *   QueryRewriter,
 *   HyDEEnhancer,
 *   MultiQueryExpander,
 * } from '@contextaisdk/rag';
 *
 * // Choose the right enhancer for your use case
 * const rewriter = new QueryRewriter({ llmProvider });
 * const hyde = new HyDEEnhancer({ llmProvider, embeddingProvider });
 * const expander = new MultiQueryExpander({ llmProvider });
 * ```
 *
 * @packageDocumentation
 */

// Base class
export { BaseQueryEnhancer } from './base-enhancer.js';

// Implementations
export { QueryRewriter } from './query-rewriter.js';
export { HyDEEnhancer } from './hyde-enhancer.js';
export { MultiQueryExpander } from './multi-query-expander.js';

// Errors
export { QueryEnhancementError } from './errors.js';

// Types
export type {
  // Core interfaces
  QueryEnhancer,
  EnhancementResult,
  EnhancementMetadata,
  EnhanceOptions,
  EnhancementStrategy,
  // Configuration types
  BaseEnhancerConfig,
  QueryRewriterConfig,
  HyDEConfig,
  MultiQueryConfig,
  // Error types
  QueryEnhancementErrorCode,
  QueryEnhancementErrorDetails,
} from './types.js';
