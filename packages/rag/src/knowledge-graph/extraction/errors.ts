/**
 * Knowledge Graph Extraction Errors
 *
 * Errors thrown during entity and relation extraction operations.
 * Follows the pattern established by ChunkerError.
 */

import { ContextAIError } from '@contextaisdk/core';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for extraction failures.
 */
export type ExtractionErrorCode =
  | 'EMPTY_TEXT'
  | 'LLM_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'GRAPH_ERROR'
  | 'CONFIG_ERROR'
  | 'EXTRACTION_ERROR';

/**
 * Details about an extraction error.
 */
export interface ExtractionErrorDetails {
  /** Machine-readable error code */
  code: ExtractionErrorCode;
  /** Name of the extractor that failed */
  extractorName: string;
  /** Underlying cause, if any */
  cause?: Error;
}

// ============================================================================
// Error Class
// ============================================================================

/**
 * Error thrown when knowledge extraction fails.
 *
 * Provides actionable troubleshooting hints based on the error code.
 *
 * @example
 * ```typescript
 * throw ExtractionError.emptyText('LLMEntityExtractor');
 * // Error: LLMEntityExtractor: Cannot extract from empty text
 * // Hint: Ensure the input text is not empty before calling extract().
 * ```
 */
export class ExtractionError extends ContextAIError {
  /** Machine-readable error code */
  override readonly code: ExtractionErrorCode;

  /** Name of the extractor that failed */
  readonly extractorName: string;

  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: ExtractionErrorCode,
    extractorName: string,
    cause?: Error
  ) {
    super(message, `EXTRACTION_${code}`, { severity: 'error', cause });
    this.name = 'ExtractionError';
    this.code = code;
    this.extractorName = extractorName;
    this.cause = cause;
  }

  /**
   * Provide actionable troubleshooting hints based on error code.
   */
  override get troubleshootingHint(): string | null {
    switch (this.code) {
      case 'EMPTY_TEXT':
        return 'Ensure the input text is not empty before calling extract().';

      case 'LLM_ERROR':
        return (
          'The LLM provider returned an error. ' +
          'Check your API key, rate limits, and network connectivity.'
        );

      case 'PARSE_ERROR':
        return (
          'LLM returned an unparseable response. ' +
          'Try lowering temperature to 0 for more deterministic output, ' +
          'or check that the model supports structured output.'
        );

      case 'VALIDATION_ERROR':
        return (
          'LLM response did not match expected schema. ' +
          'The response may be missing required fields or have invalid values.'
        );

      case 'GRAPH_ERROR':
        return (
          'Failed to populate the graph store. ' +
          'Check that the graph store is available and has sufficient capacity.'
        );

      case 'CONFIG_ERROR':
        return (
          `Check ${this.extractorName} configuration values are within valid ranges.`
        );

      case 'EXTRACTION_ERROR':
        return null; // Generic error, no specific hint

      default:
        return null;
    }
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): ExtractionErrorDetails {
    return {
      code: this.code,
      extractorName: this.extractorName,
      cause: this.cause,
    };
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create an error for empty input text.
   */
  static emptyText(extractorName: string): ExtractionError {
    return new ExtractionError(
      `${extractorName}: Cannot extract from empty text`,
      'EMPTY_TEXT',
      extractorName
    );
  }

  /**
   * Create an error for LLM call failures.
   *
   * @param extractorName - Name of the extractor
   * @param message - Description of what went wrong
   * @param cause - The underlying error from the LLM provider
   */
  static llmError(
    extractorName: string,
    message: string,
    cause?: Error
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName}: LLM error - ${message}`,
      'LLM_ERROR',
      extractorName,
      cause
    );
  }

  /**
   * Create an error for JSON parsing failures.
   *
   * @param extractorName - Name of the extractor
   * @param details - Description of what couldn't be parsed
   * @param cause - The underlying parsing error
   */
  static parseError(
    extractorName: string,
    details: string,
    cause?: Error
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName}: Failed to parse LLM response - ${details}`,
      'PARSE_ERROR',
      extractorName,
      cause
    );
  }

  /**
   * Create an error for Zod validation failures.
   *
   * @param extractorName - Name of the extractor
   * @param details - Description of validation issues
   */
  static validationError(
    extractorName: string,
    details: string
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName}: Response validation failed - ${details}`,
      'VALIDATION_ERROR',
      extractorName
    );
  }

  /**
   * Create an error for graph store failures.
   *
   * @param extractorName - Name of the extractor
   * @param message - Description of the graph operation that failed
   * @param cause - The underlying graph store error
   */
  static graphError(
    extractorName: string,
    message: string,
    cause?: Error
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName}: Graph operation failed - ${message}`,
      'GRAPH_ERROR',
      extractorName,
      cause
    );
  }

  /**
   * Create an error for invalid configuration.
   *
   * @param extractorName - Name of the extractor
   * @param reason - Description of what's invalid
   */
  static configError(extractorName: string, reason: string): ExtractionError {
    return new ExtractionError(
      `${extractorName}: Invalid configuration - ${reason}`,
      'CONFIG_ERROR',
      extractorName
    );
  }

  /**
   * Create an error when required provider is missing.
   *
   * @param extractorName - Name of the extractor
   * @param providerType - Type of provider needed (e.g., 'llmProvider')
   */
  static providerRequired(
    extractorName: string,
    providerType: string
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName} requires ${providerType}`,
      'CONFIG_ERROR',
      extractorName
    );
  }

  /**
   * Create a generic extraction error.
   *
   * @param extractorName - Name of the extractor
   * @param message - Description of what went wrong
   * @param cause - Optional underlying error
   */
  static extractionError(
    extractorName: string,
    message: string,
    cause?: Error
  ): ExtractionError {
    return new ExtractionError(
      `${extractorName}: ${message}`,
      'EXTRACTION_ERROR',
      extractorName,
      cause
    );
  }
}
