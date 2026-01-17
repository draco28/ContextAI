/**
 * Text Chunker Errors
 */

import { ContextAIError } from '@contextai/core';
import type { ChunkerErrorCode, ChunkerErrorDetails } from './types.js';

/**
 * Error thrown when text chunking fails.
 *
 * @example
 * ```typescript
 * throw new ChunkerError(
 *   'Document content is empty',
 *   'EMPTY_DOCUMENT',
 *   'FixedSizeChunker',
 *   'doc-123'
 * );
 * ```
 */
export class ChunkerError extends ContextAIError {
  /** Machine-readable error code */
  readonly code: ChunkerErrorCode;
  /** Name of the chunker that failed */
  readonly chunkerName: string;
  /** Document ID that was being chunked */
  readonly documentId?: string;
  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: ChunkerErrorCode,
    chunkerName: string,
    documentId?: string,
    cause?: Error
  ) {
    super(message, `CHUNKER_${code}`);
    this.name = 'ChunkerError';
    this.code = code;
    this.chunkerName = chunkerName;
    this.documentId = documentId;
    this.cause = cause;
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): ChunkerErrorDetails {
    return {
      code: this.code,
      chunkerName: this.chunkerName,
      documentId: this.documentId,
      cause: this.cause,
    };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create an error for empty document content.
   */
  static emptyDocument(chunkerName: string, documentId?: string): ChunkerError {
    return new ChunkerError(
      'Document content is empty',
      'EMPTY_DOCUMENT',
      chunkerName,
      documentId
    );
  }

  /**
   * Create an error for invalid chunking options.
   */
  static invalidOptions(
    chunkerName: string,
    reason: string,
    documentId?: string
  ): ChunkerError {
    return new ChunkerError(
      `Invalid chunking options: ${reason}`,
      'INVALID_OPTIONS',
      chunkerName,
      documentId
    );
  }

  /**
   * Create an error when chunk size is too small.
   */
  static chunkTooSmall(
    chunkerName: string,
    minSize: number,
    actualSize: number,
    documentId?: string
  ): ChunkerError {
    return new ChunkerError(
      `Chunk size ${actualSize} is below minimum ${minSize}`,
      'CHUNK_TOO_SMALL',
      chunkerName,
      documentId
    );
  }

  /**
   * Create a generic chunker error.
   */
  static chunkerError(
    chunkerName: string,
    message: string,
    documentId?: string,
    cause?: Error
  ): ChunkerError {
    return new ChunkerError(
      message,
      'CHUNKER_ERROR',
      chunkerName,
      documentId,
      cause
    );
  }
}
