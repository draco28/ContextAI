import { ContextAIError } from '@contextai/core';

/**
 * Error codes for OpenAI provider errors.
 */
export type OpenAIErrorCode =
  | 'OPENAI_API_ERROR'
  | 'OPENAI_AUTH_ERROR'
  | 'OPENAI_RATE_LIMIT'
  | 'OPENAI_INVALID_REQUEST'
  | 'OPENAI_CONTENT_FILTER'
  | 'OPENAI_TIMEOUT'
  | 'OPENAI_CONNECTION_ERROR'
  | 'OPENAI_INVALID_RESPONSE';

/**
 * Error thrown by the OpenAI provider.
 *
 * @example
 * ```typescript
 * try {
 *   await provider.chat(messages);
 * } catch (error) {
 *   if (error instanceof OpenAIProviderError) {
 *     if (error.code === 'OPENAI_RATE_LIMIT') {
 *       // Wait and retry
 *     }
 *   }
 * }
 * ```
 */
export class OpenAIProviderError extends ContextAIError {
  override readonly code: OpenAIErrorCode;
  readonly statusCode?: number;
  readonly requestId?: string;
  readonly cause?: Error;

  constructor(
    message: string,
    code: OpenAIErrorCode,
    options?: {
      cause?: Error;
      statusCode?: number;
      requestId?: string;
    }
  ) {
    super(message, code);
    this.name = 'OpenAIProviderError';
    this.code = code;
    this.cause = options?.cause;
    this.statusCode = options?.statusCode;
    this.requestId = options?.requestId;
  }

  /**
   * Check if this error is retryable (rate limits, temporary failures).
   */
  get isRetryable(): boolean {
    return (
      this.code === 'OPENAI_RATE_LIMIT' ||
      this.code === 'OPENAI_TIMEOUT' ||
      this.code === 'OPENAI_CONNECTION_ERROR' ||
      (this.statusCode !== undefined && this.statusCode >= 500)
    );
  }
}

/**
 * Map OpenAI SDK error to our error type.
 */
export function mapOpenAIError(error: unknown): OpenAIProviderError {
  // Handle OpenAI SDK errors (they have specific structure)
  if (error && typeof error === 'object') {
    const err = error as {
      status?: number;
      message?: string;
      code?: string;
      error?: { message?: string; type?: string; code?: string };
      headers?: { 'x-request-id'?: string };
    };

    const message =
      err.error?.message || err.message || 'Unknown OpenAI API error';
    const statusCode = err.status;
    const requestId = err.headers?.['x-request-id'];

    // Map status codes to error codes
    let code: OpenAIErrorCode = 'OPENAI_API_ERROR';

    if (statusCode === 401) {
      code = 'OPENAI_AUTH_ERROR';
    } else if (statusCode === 429) {
      code = 'OPENAI_RATE_LIMIT';
    } else if (statusCode === 400) {
      code = 'OPENAI_INVALID_REQUEST';
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
      code = 'OPENAI_TIMEOUT';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      code = 'OPENAI_CONNECTION_ERROR';
    } else if (err.error?.type === 'content_filter') {
      code = 'OPENAI_CONTENT_FILTER';
    }

    return new OpenAIProviderError(message, code, {
      cause: error instanceof Error ? error : undefined,
      statusCode,
      requestId,
    });
  }

  // Fallback for unknown errors
  return new OpenAIProviderError(
    error instanceof Error ? error.message : 'Unknown error',
    'OPENAI_API_ERROR',
    { cause: error instanceof Error ? error : undefined }
  );
}
