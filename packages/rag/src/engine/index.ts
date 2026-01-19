/**
 * RAG Engine Module
 *
 * High-level RAG orchestrator that coordinates:
 * Query Enhancement → Retrieval → Reranking → Context Assembly
 *
 * @module engine
 */

// Types
export type {
  RAGEngine,
  RAGEngineConfig,
  RAGSearchOptions,
  RAGSearchDefaults,
  RAGResult,
  RAGSearchMetadata,
  RAGTimings,
  RAGEngineErrorCode,
  RAGEngineErrorDetails,
} from './types.js';

// Implementation
export { RAGEngineImpl } from './rag-engine.js';

// Errors
export { RAGEngineError } from './errors.js';
