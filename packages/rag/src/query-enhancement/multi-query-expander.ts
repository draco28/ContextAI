/**
 * Multi-Query Expander
 *
 * Expands a single query into multiple perspectives to retrieve
 * a broader, more diverse set of relevant documents.
 *
 * How it works:
 * 1. User asks: "How do I deploy to AWS?"
 * 2. LLM generates variants:
 *    - "AWS deployment tutorial"
 *    - "EC2 instance setup and configuration"
 *    - "AWS cloud infrastructure deployment guide"
 * 3. Each variant is used for retrieval in parallel
 * 4. Results are merged and deduplicated
 *
 * This helps when:
 * - The user's query might miss relevant terminology
 * - Different docs use different words for the same concept
 * - You want broader coverage at the cost of more retrieval calls
 *
 * @example
 * ```typescript
 * const expander = new MultiQueryExpander({
 *   llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
 *   numVariants: 3,
 * });
 *
 * const result = await expander.enhance('How do I deploy to AWS?');
 * // result.enhanced: [
 * //   'AWS deployment tutorial',
 * //   'EC2 instance setup and configuration',
 * //   'AWS cloud infrastructure deployment guide'
 * // ]
 * ```
 */

import type { LLMProvider, ChatMessage } from '@contextaisdk/core';
import type {
  MultiQueryConfig,
  EnhanceOptions,
  EnhancementResult,
  EnhancementStrategy,
} from './types.js';
import { BaseQueryEnhancer } from './base-enhancer.js';
import { QueryEnhancementError } from './errors.js';

/**
 * Default system prompt for multi-query expansion.
 */
const DEFAULT_SYSTEM_PROMPT = `You are a search query expert. Your task is to generate alternative search queries that approach the same topic from different angles.

Rules:
1. Each query should be semantically related to the original
2. Use different terminology and phrasing for each variant
3. Cover different aspects or perspectives of the topic
4. Keep queries focused and search-friendly
5. Do NOT include numbering, bullets, or explanations
6. Return ONLY the queries, one per line`;

/**
 * Default prompt template for multi-query expansion.
 * Placeholders: {query}, {numVariants}
 */
const DEFAULT_PROMPT_TEMPLATE = `Generate {numVariants} alternative search queries for this topic:

Original query: {query}

Alternative queries (one per line):`;

/**
 * Default temperature for multi-query expansion.
 * Moderate temperature balances diversity with relevance.
 */
const DEFAULT_TEMPERATURE = 0.5;

/**
 * Default number of query variants to generate.
 */
const DEFAULT_NUM_VARIANTS = 3;

/**
 * Multi-Query Expander using LLM.
 *
 * Generates multiple query variants from different perspectives
 * to improve retrieval coverage. Use when you want to cast a
 * wider net and retrieve more diverse documents.
 *
 * Cost: ~200-400 tokens total (one call generates all variants)
 * Latency: ~300-600ms depending on LLM
 *
 * Note: Using multi-query means multiple retrieval calls,
 * so consider the cost/latency tradeoff.
 *
 * @example
 * ```typescript
 * import { OpenAIProvider } from '@contextaisdk/provider-openai';
 *
 * const expander = new MultiQueryExpander({
 *   llmProvider: new OpenAIProvider({
 *     model: 'gpt-4o-mini',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   }),
 *   numVariants: 4,
 *   temperature: 0.6,  // Slightly more creative variants
 * });
 *
 * const result = await expander.enhance('react hooks best practices');
 *
 * // Retrieve with each variant
 * const allResults = [];
 * for (const variant of result.enhanced) {
 *   const docs = await retriever.retrieve(variant);
 *   allResults.push(...docs);
 * }
 *
 * // Deduplicate and rerank
 * const unique = deduplicateByContent(allResults);
 * const reranked = await reranker.rerank(originalQuery, unique);
 * ```
 */
export class MultiQueryExpander extends BaseQueryEnhancer {
  readonly name: string;
  readonly strategy: EnhancementStrategy = 'multi-query';

  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly systemPrompt: string;
  private readonly defaultTemperature: number;
  private readonly defaultNumVariants: number;

  constructor(config: MultiQueryConfig) {
    super();

    if (!config.llmProvider) {
      throw QueryEnhancementError.configError(
        'MultiQueryExpander',
        'llmProvider is required'
      );
    }

    this.name = config.name ?? 'MultiQueryExpander';
    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.systemPrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.defaultTemperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.defaultNumVariants = config.numVariants ?? DEFAULT_NUM_VARIANTS;
  }

  /**
   * Expand the query into multiple variants.
   */
  protected _enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    const startTime = Date.now();
    const temperature = options?.temperature ?? this.defaultTemperature;
    const numVariants = options?.maxVariants ?? this.defaultNumVariants;

    // Build the prompt
    const prompt = this.promptTemplate
      .replace('{query}', query)
      .replace('{numVariants}', String(numVariants));

    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature,
        maxTokens: numVariants * 50, // ~50 tokens per variant
      });

      const variants = this.parseVariants(response.content, query, numVariants);
      const llmLatencyMs = Date.now() - startTime;

      return this.createResult(query, variants, {
        llmLatencyMs,
      });
    } catch (error) {
      throw QueryEnhancementError.llmError(
        this.name,
        `Failed to expand query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Parse the LLM response to extract query variants.
   */
  private parseVariants(
    response: string,
    originalQuery: string,
    expectedCount: number
  ): string[] {
    const lines = response
      .split('\n')
      .map((line) => this.cleanLine(line))
      .filter((line) => line.length > 0);

    // Deduplicate and filter out the original query if it appears
    const uniqueVariants = [...new Set(lines)]
      .filter((variant) => this.isValidVariant(variant, originalQuery));

    // If we got fewer variants than expected, that's okay
    if (uniqueVariants.length < expectedCount) {
      console.warn(
        `[MultiQueryExpander] Generated ${uniqueVariants.length} variants, ` +
          `expected ${expectedCount}`
      );
    }

    return uniqueVariants.slice(0, expectedCount);
  }

  /**
   * Clean a single line from the response.
   */
  private cleanLine(line: string): string {
    let cleaned = line.trim();

    // Remove numbering (1., 1), -, *, etc.)
    cleaned = cleaned.replace(/^[\d]+[.)]\s*/, '');
    cleaned = cleaned.replace(/^[-*]\s*/, '');

    // Remove quotes
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove common prefixes
    const prefixes = ['Query:', 'Alternative:', 'Variant:'];
    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.slice(prefix.length).trim();
        break;
      }
    }

    return cleaned.trim();
  }

  /**
   * Check if a variant is valid (not empty, not too similar to original).
   */
  private isValidVariant(variant: string, originalQuery: string): boolean {
    // Must have content
    if (variant.length === 0) {
      return false;
    }

    // Should not be identical to original (case-insensitive)
    if (variant.toLowerCase() === originalQuery.toLowerCase()) {
      return false;
    }

    // Should not be too short (probably parsing artifact)
    if (variant.length < 3) {
      return false;
    }

    return true;
  }
}
