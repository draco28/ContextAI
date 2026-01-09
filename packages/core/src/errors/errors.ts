import type { z } from 'zod';

/**
 * Base error class for ContextAI
 *
 * All errors include:
 * - Descriptive message
 * - Error code for programmatic handling
 * - Stack trace
 */
export class ContextAIError extends Error {
  readonly code: string;

  constructor(message: string, code: string = 'CONTEXTAI_ERROR') {
    super(message);
    this.name = 'ContextAIError';
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Agent-related errors
 *
 * Thrown when:
 * - Agent execution fails
 * - Max iterations exceeded
 * - Agent aborted
 */
export class AgentError extends ContextAIError {
  constructor(message: string) {
    super(message, 'AGENT_ERROR');
    this.name = 'AgentError';
  }
}

/**
 * Tool-related errors
 *
 * Thrown when:
 * - Tool execution fails
 * - Tool not found
 * - Tool timeout
 */
export class ToolError extends ContextAIError {
  readonly toolName: string;
  readonly cause?: Error;

  constructor(
    message: string,
    toolName: string,
    cause?: Error,
    code: string = 'TOOL_ERROR'
  ) {
    super(message, code);
    this.name = 'ToolError';
    this.toolName = toolName;
    this.cause = cause;
  }
}

/**
 * Tool timeout error
 *
 * Thrown when:
 * - Tool execution exceeds configured timeout
 */

export class ToolTimeoutError extends ToolError {
  readonly timeoutMs: number;

  constructor(toolName: string, timeoutMs: number) {
    super(
      `Tool "${toolName}" timed out after ${timeoutMs}ms`,
      toolName,
      undefined,
      'TOOL_TIMEOUT_ERROR'
    );
    this.name = 'ToolTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Provider-related errors
 *
 * Thrown when:
 * - LLM API call fails
 * - Rate limit exceeded
 * - Authentication fails
 */
export class ProviderError extends ContextAIError {
  readonly provider: string;
  readonly statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

/**
 * Validation errors (Zod-based)
 *
 * Thrown when:
 * - Tool input validation fails
 * - Configuration validation fails
 */
export class ValidationError extends ContextAIError {
  readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /**
   * Format issues as a human-readable string
   */
  formatIssues(): string {
    return this.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
  }
}
