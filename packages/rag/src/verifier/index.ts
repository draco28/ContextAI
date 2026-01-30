/**
 * Verifier Module
 *
 * LLM-based relevance verification for retrieved documents.
 * Verifies that documents actually answer the query before
 * including them in the context assembly.
 *
 * @module verifier
 *
 * @example
 * ```typescript
 * import { LLMVerifier } from '@contextaisdk/rag';
 *
 * const verifier = new LLMVerifier({
 *   llmProvider: myProvider,
 *   verificationThreshold: 6,
 * });
 *
 * const verified = await verifier.verify(query, results, {
 *   skipThreshold: 0.8,     // Skip verification for high-confidence
 *   filterThreshold: 0.3,  // Reject low-confidence
 * });
 *
 * // Filter to only verified documents
 * const relevant = verified.filter(r => r.verification?.verified);
 * ```
 */

// Types
export type {
  Verifier,
  VerifierOptions,
  VerificationResult,
  VerifiedRetrievalResult,
  LLMVerifierConfig,
  VerifierErrorCode,
  VerifierErrorDetails,
} from './types.js';

// Errors
export { VerifierError } from './errors.js';

// Implementation
export { LLMVerifier } from './llm-verifier.js';
