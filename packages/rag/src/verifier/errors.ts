/**
 * Verifier Errors
 *
 * Structured error handling for verification operations.
 * Uses factory methods for consistent error creation.
 */

import { ContextAIError } from '@contextaisdk/core';
import type { VerifierErrorCode, VerifierErrorDetails } from './types.js';

/**
 * Error thrown when verification operations fail.
 *
 * @example
 * ```typescript
 * // Using factory methods (preferred)
 * throw VerifierError.llmError('LLMVerifier', 'API call failed');
 *
 * // Direct construction
 * throw new VerifierError(
 *   'Custom error message',
 *   'VERIFICATION_FAILED',
 *   'MyVerifier',
 *   originalError
 * );
 * ```
 */
export class VerifierError extends ContextAIError {
  /** Machine-readable error code */
  readonly code: VerifierErrorCode;
  /** Name of the verifier that failed */
  readonly verifierName: string;
  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: VerifierErrorCode,
    verifierName: string,
    cause?: Error
  ) {
    super(message, `VERIFIER_${code}`);
    this.name = 'VerifierError';
    this.code = code;
    this.verifierName = verifierName;
    this.cause = cause;
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): VerifierErrorDetails {
    return {
      code: this.code,
      verifierName: this.verifierName,
      cause: this.cause,
    };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create an error for verification operation failure.
   * Used when the overall verification process fails.
   */
  static verificationFailed(
    verifierName: string,
    reason: string,
    cause?: Error
  ): VerifierError {
    return new VerifierError(
      `Verification failed: ${reason}`,
      'VERIFICATION_FAILED',
      verifierName,
      cause
    );
  }

  /**
   * Create an error for invalid input.
   * Used when query or results are malformed.
   */
  static invalidInput(verifierName: string, reason: string): VerifierError {
    return new VerifierError(
      `Invalid input: ${reason}`,
      'INVALID_INPUT',
      verifierName
    );
  }

  /**
   * Create an error for configuration issues.
   * Used when verifier config is missing required fields.
   */
  static configError(verifierName: string, reason: string): VerifierError {
    return new VerifierError(
      `Configuration error: ${reason}`,
      'CONFIG_ERROR',
      verifierName
    );
  }

  /**
   * Create an error for LLM-related failures.
   * Used when the underlying LLM call fails.
   */
  static llmError(
    verifierName: string,
    reason: string,
    cause?: Error
  ): VerifierError {
    return new VerifierError(
      `LLM error: ${reason}`,
      'LLM_ERROR',
      verifierName,
      cause
    );
  }
}
