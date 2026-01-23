/**
 * Context Assembly Module
 *
 * Stage 8 of the RAG pipeline: formats retrieved and reranked chunks
 * for LLM consumption with ordering, deduplication, and token budget management.
 *
 * @example
 * ```typescript
 * import {
 *   XMLAssembler,
 *   MarkdownAssembler,
 *   applyOrdering,
 *   estimateTokens,
 * } from '@contextaisdk/rag';
 *
 * // Create an XML assembler with sandwich ordering
 * const assembler = new XMLAssembler({
 *   ordering: 'sandwich',
 *   tokenBudget: { maxTokens: 4000 },
 *   deduplication: { similarityThreshold: 0.8 },
 * });
 *
 * // Assemble reranked results
 * const context = await assembler.assemble(rerankedResults, {
 *   topK: 10,
 *   preamble: 'Use the following sources to answer the question:',
 * });
 *
 * console.log(context.content); // Formatted XML
 * console.log(`Included ${context.chunkCount} chunks`);
 * console.log(`Estimated ${context.estimatedTokens} tokens`);
 * ```
 *
 * @module
 */

// ============================================================================
// Types (tree-shakeable)
// ============================================================================

export type {
  // Core types
  ContextAssembler,
  AssembledContext,
  AssemblerConfig,
  AssemblyOptions,
  SourceAttribution,

  // Strategy types
  OrderingStrategy,

  // Configuration types
  TokenBudgetConfig,
  DeduplicationConfig,
  XMLAssemblerConfig,
  MarkdownAssemblerConfig,

  // Error types
  AssemblyErrorCode,
  AssemblyErrorDetails,
} from './types.js';

// ============================================================================
// Errors
// ============================================================================

export { AssemblyError } from './errors.js';

// ============================================================================
// Base Class (for extension)
// ============================================================================

export { BaseAssembler, DEFAULT_ASSEMBLER_CONFIG } from './base-assembler.js';

// ============================================================================
// Assembler Implementations
// ============================================================================

export { XMLAssembler, DEFAULT_XML_CONFIG, escapeXml, escapeXmlAttribute } from './xml-assembler.js';
export { MarkdownAssembler, DEFAULT_MARKDOWN_CONFIG } from './markdown-assembler.js';

// ============================================================================
// Ordering Utilities
// ============================================================================

export {
  applyOrdering,
  orderByRelevance,
  orderBySandwich,
  orderChronologically,
  analyzeOrdering,
} from './ordering.js';
export type { OrderingAnalysis } from './ordering.js';

// ============================================================================
// Token Budget Utilities
// ============================================================================

export {
  estimateTokens,
  estimateChunkTokens,
  calculateTokenBudget,
  applyTokenBudget,
  truncateText,
  analyzeBudget,
  DEFAULT_TOKEN_BUDGET,
} from './token-budget.js';
export type { BudgetResult, BudgetAnalysis, ChunkTokenAnalysis } from './token-budget.js';

// ============================================================================
// Deduplication Utilities
// ============================================================================

export {
  jaccardSimilarity,
  tokenize,
  deduplicateResults,
  findSimilarPairs,
  analyzeSimilarity,
  DEFAULT_DEDUPLICATION_CONFIG,
} from './deduplication.js';
export type {
  DeduplicationResult,
  DuplicateInfo,
  SimilarPair,
  SimilarityAnalysis,
} from './deduplication.js';
