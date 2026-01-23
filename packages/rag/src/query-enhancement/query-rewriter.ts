/**
 * Query Rewriter
 *
 * Rewrites ambiguous or poorly-formed queries for clarity.
 * Uses an LLM to rephrase queries while preserving intent.
 *
 * Use cases:
 * - Fix typos and grammatical errors
 * - Expand abbreviations
 * - Clarify ambiguous terms
 * - Convert questions to search-friendly form
 *
 * @example
 * ```typescript
 * const rewriter = new QueryRewriter({
 *   llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
 * });
 *
 * const result = await rewriter.enhance('hw do i reset pasword?');
 * // result.enhanced: ['How do I reset my password?']
 * ```
 */

import type { LLMProvider, ChatMessage } from '@contextaisdk/core';
import type {
  QueryRewriterConfig,
  EnhanceOptions,
  EnhancementResult,
  EnhancementStrategy,
} from './types.js';
import { BaseQueryEnhancer } from './base-enhancer.js';
import { QueryEnhancementError } from './errors.js';

/**
 * Default system prompt for query rewriting.
 */
const DEFAULT_SYSTEM_PROMPT = `You are a search query optimizer. Your task is to rewrite user queries to be clearer and more effective for document retrieval.

Rules:
1. Fix spelling and grammatical errors
2. Expand abbreviations and acronyms if the meaning is clear
3. Preserve the original intent - do not add or remove meaning
4. Keep the query concise and focused
5. Convert verbose questions into direct search queries when appropriate
6. Do NOT add quotes or special search syntax
7. Return ONLY the rewritten query, nothing else`;

/**
 * Default prompt template for query rewriting.
 * The {query} placeholder is replaced with the user's query.
 */
const DEFAULT_PROMPT_TEMPLATE = `Rewrite this search query to be clearer and more effective:

Original query: {query}

Rewritten query:`;

/**
 * Default temperature for query rewriting.
 * Lower temperature = more conservative, predictable rewrites.
 */
const DEFAULT_TEMPERATURE = 0.3;

/**
 * Query Rewriter using LLM.
 *
 * Transforms queries to improve retrieval by fixing errors
 * and clarifying intent. This is the simplest enhancement
 * strategy - one query in, one query out.
 *
 * Cost: ~100-200 tokens per query (system + user + response)
 * Latency: ~200-500ms depending on LLM
 *
 * @example
 * ```typescript
 * import { OpenAIProvider } from '@contextaisdk/provider-openai';
 *
 * const rewriter = new QueryRewriter({
 *   llmProvider: new OpenAIProvider({
 *     model: 'gpt-4o-mini',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   }),
 *   temperature: 0.2,  // Conservative rewrites
 * });
 *
 * // Fix typos
 * const result = await rewriter.enhance('hw to cnfigure nginx');
 * console.log(result.enhanced[0]); // 'How to configure nginx'
 *
 * // Clarify intent
 * const result2 = await rewriter.enhance('js date');
 * console.log(result2.enhanced[0]); // 'JavaScript date handling'
 * ```
 */
export class QueryRewriter extends BaseQueryEnhancer {
  readonly name: string;
  readonly strategy: EnhancementStrategy = 'rewrite';

  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly systemPrompt: string;
  private readonly defaultTemperature: number;

  constructor(config: QueryRewriterConfig) {
    super();

    if (!config.llmProvider) {
      throw QueryEnhancementError.configError(
        'QueryRewriter',
        'llmProvider is required'
      );
    }

    this.name = config.name ?? 'QueryRewriter';
    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.systemPrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.defaultTemperature = config.temperature ?? DEFAULT_TEMPERATURE;
  }

  /**
   * Rewrite the query for clarity.
   */
  protected _enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    const startTime = Date.now();
    const temperature = options?.temperature ?? this.defaultTemperature;

    // Build the prompt
    const prompt = this.promptTemplate.replace('{query}', query);

    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature,
        maxTokens: 150, // Rewrites should be concise
      });

      const rewritten = this.parseResponse(response.content, query);
      const llmLatencyMs = Date.now() - startTime;

      return this.createResult(query, [rewritten], {
        llmLatencyMs,
      });
    } catch (error) {
      throw QueryEnhancementError.llmError(
        this.name,
        `Failed to rewrite query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Parse the LLM response to extract the rewritten query.
   * Falls back to original query if parsing fails.
   */
  private parseResponse(response: string, originalQuery: string): string {
    // Clean up the response
    let rewritten = response.trim();

    // Remove common prefixes the LLM might add
    const prefixes = [
      'Rewritten query:',
      'Rewritten:',
      'Query:',
      'Here is the rewritten query:',
      'The rewritten query is:',
    ];

    for (const prefix of prefixes) {
      if (rewritten.toLowerCase().startsWith(prefix.toLowerCase())) {
        rewritten = rewritten.slice(prefix.length).trim();
        break;
      }
    }

    // Remove surrounding quotes if present
    if (
      (rewritten.startsWith('"') && rewritten.endsWith('"')) ||
      (rewritten.startsWith("'") && rewritten.endsWith("'"))
    ) {
      rewritten = rewritten.slice(1, -1);
    }

    // If the result is empty or too different, fall back to original
    if (rewritten.length === 0) {
      console.warn(
        `[QueryRewriter] Empty rewrite result, using original query`
      );
      return originalQuery;
    }

    // If rewrite is drastically different in length, warn but use it
    const lengthRatio = rewritten.length / originalQuery.length;
    if (lengthRatio > 5 || lengthRatio < 0.1) {
      console.warn(
        `[QueryRewriter] Rewrite length differs significantly: ` +
          `${originalQuery.length} -> ${rewritten.length} chars`
      );
    }

    return rewritten;
  }
}
