/**
 * Retrieval Module
 *
 * Provides dense, sparse, and hybrid retrieval capabilities for RAG.
 *
 * @example
 * ```typescript
 * import {
 *   HybridRetriever,
 *   BM25Retriever,
 *   DenseRetriever,
 *   reciprocalRankFusion,
 * } from '@contextaisdk/rag';
 *
 * // Create hybrid retriever
 * const retriever = new HybridRetriever(vectorStore, embeddingProvider);
 * retriever.buildIndex(documents);
 *
 * // Retrieve with alpha tuning
 * const results = await retriever.retrieve('my query', { alpha: 0.7 });
 * ```
 */

// Types
export type {
  // Core retrieval types
  Retriever,
  RetrievalResult,
  RetrievalOptions,
  HybridRetrievalOptions,
  HybridScore,
  // Configuration types
  BM25Config,
  BM25Document,
  DenseRetrieverConfig,
  HybridRetrieverConfig,
  // RRF types
  RankedItem,
  RRFResult,
  // Error types
  RetrieverErrorCode,
  RetrieverErrorDetails,
} from './types.js';

// Errors
export { RetrieverError } from './errors.js';

// Retrievers
export { BM25Retriever } from './bm25.js';
export { DenseRetriever } from './dense-retriever.js';
export { HybridRetriever } from './hybrid-retriever.js';

// RRF utilities
export {
  reciprocalRankFusion,
  rrfScore,
  maxRRFScore,
  normalizeRRFScores,
  DEFAULT_RRF_K,
  type RankingList,
} from './rrf.js';
