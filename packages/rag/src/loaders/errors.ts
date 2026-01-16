/**
 * Document Loader Errors
 */

import { ContextAIError } from '@contextai/core';
import type { LoaderErrorCode, LoaderErrorDetails } from './types.js';

/**
 * Error thrown when document loading fails.
 *
 * @example
 * ```typescript
 * throw new LoaderError(
 *   'Failed to parse markdown',
 *   'PARSE_ERROR',
 *   'MarkdownLoader',
 *   '/docs/readme.md',
 *   originalError
 * );
 * ```
 */
export class LoaderError extends ContextAIError {
  /** Machine-readable error code */
  readonly code: LoaderErrorCode;
  /** Name of the loader that failed */
  readonly loaderName: string;
  /** Source that was being loaded */
  readonly source: string;
  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: LoaderErrorCode,
    loaderName: string,
    source: string,
    cause?: Error
  ) {
    super(message, `LOADER_${code}`);
    this.name = 'LoaderError';
    this.code = code;
    this.loaderName = loaderName;
    this.source = source;
    this.cause = cause;
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): LoaderErrorDetails {
    return {
      code: this.code,
      loaderName: this.loaderName,
      source: this.source,
      cause: this.cause,
    };
  }
}
