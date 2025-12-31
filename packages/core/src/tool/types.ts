import type { z } from 'zod';

/**
 * Tool execution context
 */
export interface ToolExecuteContext {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Tool configuration for defineTool()
 */
export interface ToolConfig<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
> {
  /** Unique tool name */
  name: string;
  /** Human-readable description for LLM */
  description: string;
  /** Zod schema for input validation */
  parameters: TInput;
  /** Tool execution function */
  execute: (
    input: z.infer<TInput>,
    context: ToolExecuteContext
  ) => Promise<ToolResult<TOutput>>;
}

/**
 * Tool interface - validated and typed
 */
export interface Tool<
  TInput extends z.ZodType = z.ZodType,
  TOutput = unknown,
> {
  readonly name: string;
  readonly description: string;
  readonly parameters: TInput;

  /**
   * Execute the tool with validated input
   */
  execute(
    input: z.infer<TInput>,
    context?: ToolExecuteContext
  ): Promise<ToolResult<TOutput>>;

  /**
   * Validate input against schema
   */
  validate(
    input: unknown
  ): z.SafeParseReturnType<z.infer<TInput>, z.infer<TInput>>;

  /**
   * Get JSON schema for LLM tool definition
   */
  toJSON(): {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
