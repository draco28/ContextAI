/**
 * Error Formatter Utilities
 *
 * Provides consistent formatting for ContextAI errors across different contexts:
 * - Structured objects for programmatic handling
 * - Single-line strings for log aggregation
 * - Multi-line blocks for console output
 */

import type { ContextAIError, ErrorSeverity } from './errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Structured representation of an actionable error.
 *
 * Contains all information needed for:
 * - User-facing error messages
 * - Programmatic error handling
 * - Retry logic
 * - Documentation linking
 */
export interface FormattedError {
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code: string;
  /** Severity level */
  severity: ErrorSeverity;
  /** Actionable troubleshooting hint */
  hint: string | null;
  /** Link to documentation */
  docsUrl: string | null;
  /** Whether the operation can be retried */
  isRetryable: boolean;
  /** Suggested retry delay in ms */
  retryAfterMs: number | null;
}

// ============================================================================
// Formatter Functions
// ============================================================================

/**
 * Format a ContextAI error into a structured, actionable object.
 *
 * Use this when you need programmatic access to all error properties,
 * such as for serialization, logging infrastructure, or retry logic.
 *
 * @param error - The error to format
 * @returns Structured error object with all actionable information
 *
 * @example
 * ```typescript
 * try {
 *   await provider.chat(messages);
 * } catch (error) {
 *   if (error instanceof ContextAIError) {
 *     const formatted = formatActionableError(error);
 *
 *     logger.error({
 *       code: formatted.code,
 *       message: formatted.message,
 *       retryable: formatted.isRetryable,
 *     });
 *
 *     if (formatted.isRetryable && formatted.retryAfterMs) {
 *       await sleep(formatted.retryAfterMs);
 *       // retry...
 *     }
 *   }
 * }
 * ```
 */
export function formatActionableError(error: ContextAIError): FormattedError {
  return {
    message: error.message,
    code: error.code,
    severity: error.severity,
    hint: error.troubleshootingHint,
    docsUrl: error.docsUrl ?? null,
    isRetryable: error.isRetryable,
    retryAfterMs: error.retryAfterMs,
  };
}

/**
 * Format a ContextAI error as a single-line string.
 *
 * Ideal for log aggregation systems that prefer single-line entries.
 * Includes error code, message, and hint (if available).
 *
 * @param error - The error to format
 * @returns Single-line string representation
 *
 * @example
 * ```typescript
 * // Output: "[RATE_LIMIT] Too many requests | Hint: Wait 60 seconds before retrying"
 * console.error(formatErrorLine(error));
 * ```
 */
export function formatErrorLine(error: ContextAIError): string {
  const parts = [`[${error.code}] ${error.message}`];

  if (error.troubleshootingHint) {
    parts.push(`Hint: ${error.troubleshootingHint}`);
  }

  return parts.join(' | ');
}

/**
 * Format a ContextAI error as a multi-line block.
 *
 * Ideal for console output, debugging, or user-facing error displays.
 * Includes all actionable information in a readable format.
 *
 * @param error - The error to format
 * @returns Multi-line string representation
 *
 * @example
 * ```typescript
 * // Output:
 * // Error: Too many requests to OpenAI API
 * // Code: RATE_LIMIT
 * // Severity: error
 * // Hint: Wait 60 seconds before retrying
 * // Retryable: Yes (after 60000ms)
 * console.error(formatErrorBlock(error));
 * ```
 */
export function formatErrorBlock(error: ContextAIError): string {
  const lines = [
    `Error: ${error.message}`,
    `Code: ${error.code}`,
    `Severity: ${error.severity}`,
  ];

  if (error.troubleshootingHint) {
    lines.push(`Hint: ${error.troubleshootingHint}`);
  }

  if (error.docsUrl) {
    lines.push(`Docs: ${error.docsUrl}`);
  }

  if (error.isRetryable) {
    const delay = error.retryAfterMs;
    lines.push(`Retryable: Yes${delay ? ` (after ${delay}ms)` : ''}`);
  } else {
    lines.push('Retryable: No');
  }

  return lines.join('\n');
}

/**
 * Format a ContextAI error for JSON serialization.
 *
 * Converts the error to a plain object suitable for JSON.stringify().
 * Includes stack trace for debugging purposes.
 *
 * @param error - The error to format
 * @param includeStack - Whether to include the stack trace (default: true)
 * @returns Plain object representation
 *
 * @example
 * ```typescript
 * const json = JSON.stringify(formatErrorJson(error), null, 2);
 * ```
 */
export function formatErrorJson(
  error: ContextAIError,
  includeStack: boolean = true
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    name: error.name,
    code: error.code,
    message: error.message,
    severity: error.severity,
    isRetryable: error.isRetryable,
  };

  if (error.troubleshootingHint) {
    result.hint = error.troubleshootingHint;
  }

  if (error.docsUrl) {
    result.docsUrl = error.docsUrl;
  }

  if (error.retryAfterMs) {
    result.retryAfterMs = error.retryAfterMs;
  }

  if (error.cause) {
    result.cause = error.cause instanceof Error
      ? { name: error.cause.name, message: error.cause.message }
      : String(error.cause);
  }

  if (includeStack && error.stack) {
    result.stack = error.stack;
  }

  return result;
}
