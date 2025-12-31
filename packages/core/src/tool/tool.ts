import type { z } from 'zod';
import { zodToJsonSchema } from './zod-to-json';
import type { Tool, ToolConfig, ToolExecuteContext, ToolResult } from './types';
import { ToolError, ValidationError } from '../errors/errors';

/**
 * Define a type-safe tool with Zod validation
 *
 * @example
 * ```typescript
 * const searchTool = defineTool({
 *   name: 'search',
 *   description: 'Search for information',
 *   parameters: z.object({
 *     query: z.string().describe('Search query'),
 *     limit: z.number().optional().default(10),
 *   }),
 *   execute: async ({ query, limit }) => {
 *     const results = await search(query, limit);
 *     return { success: true, data: results };
 *   },
 * });
 * ```
 */
export function defineTool<
  TInput extends z.ZodType,
  TOutput = unknown,
>(config: ToolConfig<TInput, TOutput>): Tool<TInput, TOutput> {
  const { name, description, parameters, execute } = config;

  return {
    name,
    description,
    parameters,

    async execute(
      input: z.infer<TInput>,
      context: ToolExecuteContext = {}
    ): Promise<ToolResult<TOutput>> {
      // Validate input
      const validation = parameters.safeParse(input);
      if (!validation.success) {
        throw new ValidationError(
          `Tool "${name}" input validation failed`,
          validation.error.issues
        );
      }

      try {
        return await execute(validation.data, context);
      } catch (error) {
        throw new ToolError(
          `Tool "${name}" execution failed: ${error instanceof Error ? error.message : String(error)}`,
          name,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    },

    validate(input: unknown) {
      return parameters.safeParse(input);
    },

    toJSON() {
      return {
        name,
        description,
        parameters: zodToJsonSchema(parameters),
      };
    },
  };
}
