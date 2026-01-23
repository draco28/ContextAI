/**
 * Query Enhancement Errors
 *
 * Structured error handling for query enhancement operations.
 * Uses factory methods for consistent error creation.
 */

import { ContextAIError } from '@contextaisdk/core';
import type {
  QueryEnhancementErrorCode,
  QueryEnhancementErrorDetails,
} from './types.js';

/**
 * Error thrown when query enhancement operations fail.
 *
 * @example
 * ```typescript
 * // Using factory methods (preferred)
 * throw QueryEnhancementError.llmError('QueryRewriter', 'API rate limit');
 *
 * // Direct construction
 * throw new QueryEnhancementError(
 *   'Custom error message',
 *   'LLM_ERROR',
 *   'MyEnhancer',
 *   originalError
 * );
 * ```
 */
export class QueryEnhancementError extends ContextAIError {
  /** Machine-readable error code */
  readonly code: QueryEnhancementErrorCode;
  /** Name of the enhancer that failed */
  readonly enhancerName: string;
  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: QueryEnhancementErrorCode,
    enhancerName: string,
    cause?: Error
  ) {
    super(message, `QUERY_ENHANCEMENT_${code}`);
    this.name = 'QueryEnhancementError';
    this.code = code;
    this.enhancerName = enhancerName;
    this.cause = cause;
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): QueryEnhancementErrorDetails {
    return {
      code: this.code,
      enhancerName: this.enhancerName,
      cause: this.cause,
    };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create an error for LLM-related failures.
   * Used when the underlying LLM call fails.
   */
  static llmError(
    enhancerName: string,
    reason: string,
    cause?: Error
  ): QueryEnhancementError {
    return new QueryEnhancementError(
      `LLM error: ${reason}`,
      'LLM_ERROR',
      enhancerName,
      cause
    );
  }

  /**
   * Create an error for embedding-related failures.
   * Used when embedding generation fails (HyDE).
   */
  static embeddingError(
    enhancerName: string,
    reason: string,
    cause?: Error
  ): QueryEnhancementError {
    return new QueryEnhancementError(
      `Embedding error: ${reason}`,
      'EMBEDDING_ERROR',
      enhancerName,
      cause
    );
  }

  /**
   * Create an error for invalid input.
   * Used when query validation fails.
   */
  static invalidInput(
    enhancerName: string,
    reason: string
  ): QueryEnhancementError {
    return new QueryEnhancementError(
      `Invalid input: ${reason}`,
      'INVALID_INPUT',
      enhancerName
    );
  }

  /**
   * Create an error for configuration issues.
   * Used when enhancer is misconfigured.
   */
  static configError(
    enhancerName: string,
    reason: string
  ): QueryEnhancementError {
    return new QueryEnhancementError(
      `Configuration error: ${reason}`,
      'CONFIG_ERROR',
      enhancerName
    );
  }

  /**
   * Create an error for response parsing failures.
   * Used when LLM response cannot be parsed.
   */
  static parseError(
    enhancerName: string,
    reason: string,
    cause?: Error
  ): QueryEnhancementError {
    return new QueryEnhancementError(
      `Parse error: ${reason}`,
      'PARSE_ERROR',
      enhancerName,
      cause
    );
  }
}
