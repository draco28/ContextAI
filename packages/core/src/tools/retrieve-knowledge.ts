/**
 * retrieve_knowledge Tool
 *
 * A ReAct-compatible tool that allows agents to search a knowledge base
 * using the RAG pipeline. This is the core integration between the agent
 * loop and RAG functionality.
 *
 * Key Features:
 * - Agent decides WHEN to retrieve (not automatic on every query)
 * - Supports multiple retrievals per conversation
 * - Configurable via options (topK, enhance, rerank)
 * - Returns formatted context ready for LLM consumption
 *
 * @example
 * ```typescript
 * import { createRetrieveKnowledgeTool } from '@contextaisdk/core';
 * import { RAGEngineImpl } from '@contextaisdk/rag';
 *
 * const ragEngine = new RAGEngineImpl({ retriever, assembler });
 * const tool = createRetrieveKnowledgeTool(ragEngine);
 *
 * // Register with agent
 * const agent = new Agent({
 *   llm: openai,
 *   tools: [tool],
 * });
 * ```
 */

import { z } from 'zod';
import { defineTool } from '../tool/tool.js';
import type { Tool, ToolExecuteContext, ToolResult } from '../tool/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Interface for the RAG engine that this tool uses.
 *
 * This is a minimal interface to avoid tight coupling with @contextaisdk/rag.
 * Any object implementing this interface can be used.
 */
export interface RAGEngineInterface {
  /**
   * Search the knowledge base for relevant information.
   *
   * @param query - The search query
   * @param options - Search options
   * @returns Assembled context with sources
   */
  search(
    query: string,
    options?: {
      topK?: number;
      enhance?: boolean;
      rerank?: boolean;
      signal?: AbortSignal;
    }
  ): Promise<{
    content: string;
    estimatedTokens: number;
    sources: Array<{
      index: number;
      chunkId: string;
      source?: string;
      score: number;
    }>;
    metadata: {
      effectiveQuery: string;
      retrievedCount: number;
      assembledCount: number;
      fromCache: boolean;
      timings: { totalMs: number };
    };
  }>;
}

/**
 * Options for configuring the retrieve_knowledge tool.
 */
export interface RetrieveKnowledgeToolOptions {
  /**
   * Custom tool name.
   * Default: 'retrieve_knowledge'
   */
  name?: string;

  /**
   * Custom tool description.
   * This is shown to the LLM to help it decide when to use the tool.
   * Default: A detailed description of when and how to use knowledge retrieval.
   */
  description?: string;

  /**
   * Default topK value if not specified in tool call.
   * Default: 5
   */
  defaultTopK?: number;

  /**
   * Default value for query enhancement.
   * Default: true
   */
  defaultEnhance?: boolean;

  /**
   * Default value for reranking.
   * Default: true
   */
  defaultRerank?: boolean;

  /**
   * Tool execution timeout in milliseconds.
   * Default: 30000 (30 seconds)
   */
  timeout?: number;
}

/**
 * Output type for the retrieve_knowledge tool.
 */
export interface RetrieveKnowledgeOutput {
  /** The assembled context string for LLM consumption */
  context: string;
  /** Number of source chunks included */
  sourceCount: number;
  /** Estimated token count */
  estimatedTokens: number;
  /** Source references for citations */
  sources: Array<{
    index: number;
    chunkId: string;
    source?: string;
    relevance: number;
  }>;
  /** The query that was actually used (may differ from input if enhanced) */
  effectiveQuery: string;
  /** Total search time in milliseconds */
  searchTimeMs: number;
  /** Whether result was served from cache */
  fromCache: boolean;
}

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Zod schema for retrieve_knowledge tool input.
 */
export const retrieveKnowledgeInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'The search query. Be specific and include relevant keywords. ' +
        'Good: "How do I implement JWT authentication in Express?" ' +
        'Bad: "auth"'
    ),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe(
      'Maximum number of relevant chunks to retrieve. ' +
        'Use 3-5 for focused questions, 10+ for broad topics. Default: 5'
    ),
  enhanceQuery: z
    .boolean()
    .optional()
    .describe(
      'Whether to enhance the query for better retrieval. ' +
        'Set to false if your query is already well-formed. Default: true'
    ),
  rerankResults: z
    .boolean()
    .optional()
    .describe(
      'Whether to rerank results for better relevance. ' +
        'Set to false for faster but potentially less relevant results. Default: true'
    ),
});

export type RetrieveKnowledgeInput = z.infer<typeof retrieveKnowledgeInputSchema>;

// ============================================================================
// Default Description
// ============================================================================

const DEFAULT_DESCRIPTION = `Search the knowledge base for relevant information.

**When to use:**
- When you need factual information from the documentation
- When answering questions about how something works
- When you need code examples or implementation details
- When the user asks about features, APIs, or configuration

**When NOT to use:**
- For simple greetings or chitchat
- When you already have the information from context
- For questions about current time, weather, or real-time data

**Tips:**
- Be specific in your query - include technical terms
- Use 3-5 results for focused questions
- Use 10+ results for broad topic overviews
- You can call this multiple times for complex questions`;

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create a retrieve_knowledge tool for agent registration.
 *
 * This factory function creates a Tool that wraps a RAGEngine,
 * allowing agents to search a knowledge base when needed.
 *
 * @param ragEngine - The RAG engine to use for searches
 * @param options - Tool configuration options
 * @returns A Tool compatible with the agent's tool registry
 *
 * @example
 * ```typescript
 * // Basic usage
 * const tool = createRetrieveKnowledgeTool(ragEngine);
 *
 * // With custom options
 * const tool = createRetrieveKnowledgeTool(ragEngine, {
 *   defaultTopK: 10,
 *   timeout: 60000,
 *   description: 'Search the codebase documentation...',
 * });
 * ```
 */
export function createRetrieveKnowledgeTool(
  ragEngine: RAGEngineInterface,
  options: RetrieveKnowledgeToolOptions = {}
): Tool<typeof retrieveKnowledgeInputSchema, RetrieveKnowledgeOutput> {
  const {
    name = 'retrieve_knowledge',
    description = DEFAULT_DESCRIPTION,
    defaultTopK = 5,
    defaultEnhance = true,
    defaultRerank = true,
    timeout = 30000,
  } = options;

  return defineTool({
    name,
    description,
    parameters: retrieveKnowledgeInputSchema,
    timeout,

    execute: async (
      input: RetrieveKnowledgeInput,
      context: ToolExecuteContext
    ): Promise<ToolResult<RetrieveKnowledgeOutput>> => {
      try {
        const result = await ragEngine.search(input.query, {
          topK: input.maxResults ?? defaultTopK,
          enhance: input.enhanceQuery ?? defaultEnhance,
          rerank: input.rerankResults ?? defaultRerank,
          signal: context.signal,
        });

        const output: RetrieveKnowledgeOutput = {
          context: result.content,
          sourceCount: result.sources.length,
          estimatedTokens: result.estimatedTokens,
          sources: result.sources.map((s) => ({
            index: s.index,
            chunkId: s.chunkId,
            source: s.source,
            relevance: s.score,
          })),
          effectiveQuery: result.metadata.effectiveQuery,
          searchTimeMs: result.metadata.timings.totalMs,
          fromCache: result.metadata.fromCache,
        };

        return {
          success: true,
          data: output,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Knowledge retrieval failed',
        };
      }
    },
  });
}
