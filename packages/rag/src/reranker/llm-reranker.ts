/**
 * LLM-based Reranker
 *
 * Uses a Large Language Model to score query-document relevance.
 * Most accurate approach but also most expensive (API calls per document).
 *
 * Best used when:
 * - Accuracy is critical (high-stakes queries)
 * - Result set is small (< 20 documents)
 * - Cost is acceptable
 *
 * @example
 * ```typescript
 * const reranker = new LLMReranker({
 *   llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
 * });
 *
 * const reranked = await reranker.rerank(query, results, {
 *   topK: 5,
 *   concurrency: 3,  // Parallel scoring
 * });
 * ```
 */

import type { LLMProvider, ChatMessage } from '@contextai/core';
import type { RetrievalResult } from '../retrieval/types.js';
import type { LLMRerankerConfig, LLMRerankerOptions } from './types.js';
import { BaseReranker, type InternalRerankerResult } from './base-reranker.js';
import { RerankerError } from './errors.js';

/**
 * Default prompt template for relevance scoring.
 * Returns a score from 0-10.
 */
const DEFAULT_PROMPT_TEMPLATE = `Rate the relevance of the following document to the query.
Return ONLY a number from 0 to 10, where:
- 0 = completely irrelevant
- 5 = somewhat relevant
- 10 = highly relevant and directly answers the query

Query: {query}

Document:
{document}

Relevance score (0-10):`;

/**
 * Default system prompt for the LLM.
 */
const DEFAULT_SYSTEM_PROMPT =
  'You are a relevance judge. Your task is to score how relevant a document is to a query. ' +
  'Consider semantic meaning, not just keyword matching. ' +
  'Respond with ONLY a single number from 0 to 10.';

/**
 * Default concurrency for parallel scoring.
 */
const DEFAULT_CONCURRENCY = 5;

/**
 * Default temperature for scoring (low for consistency).
 */
const DEFAULT_TEMPERATURE = 0;

/**
 * LLM-based Reranker.
 *
 * Scores each document's relevance using an LLM, providing the most
 * accurate (but also most expensive) reranking approach.
 *
 * Supports two modes:
 * 1. **Individual scoring** (default): Each document scored separately
 *    - More accurate, especially for nuanced relevance
 *    - Higher latency and cost
 *
 * 2. **Batch scoring**: All documents scored in one prompt
 *    - More efficient for many documents
 *    - May lose accuracy for large batches
 *
 * @example
 * ```typescript
 * import { OpenAIProvider } from '@contextai/provider-openai';
 *
 * const reranker = new LLMReranker({
 *   llmProvider: new OpenAIProvider({
 *     model: 'gpt-4o-mini',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   }),
 *   temperature: 0,  // Deterministic scoring
 * });
 *
 * // Score with controlled concurrency
 * const reranked = await reranker.rerank(query, results, {
 *   topK: 5,
 *   concurrency: 3,
 * });
 *
 * // Check cost breakdown
 * console.log(`Scored ${results.length} documents`);
 * reranked.forEach(r => {
 *   console.log(`Score: ${r.scores.rerankerScore.toFixed(1)}/10 - ${r.chunk.content.slice(0, 50)}...`);
 * });
 * ```
 */
export class LLMReranker extends BaseReranker {
  readonly name: string;
  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly systemPrompt: string;
  private readonly temperature: number;
  private readonly defaultConcurrency: number;

  /**
   * LLM scores are 0-10, we normalize to 0-1.
   */
  protected override readonly shouldNormalize = false;

  constructor(
    config: LLMRerankerConfig & { llmProvider: LLMProvider }
  ) {
    super();

    if (!config.llmProvider) {
      throw RerankerError.configError(
        'LLMReranker',
        'llmProvider is required'
      );
    }

    this.name = config.name ?? 'LLMReranker';
    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.systemPrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.defaultConcurrency = config.defaultConcurrency ?? DEFAULT_CONCURRENCY;
  }

  /**
   * Rerank using LLM scoring.
   */
  protected _rerank = async (
    query: string,
    results: RetrievalResult[],
    options?: LLMRerankerOptions
  ): Promise<InternalRerankerResult[]> => {
    const concurrency = options?.concurrency ?? this.defaultConcurrency;
    const batchMode = options?.batchMode ?? false;

    if (batchMode) {
      return this.scoreBatch(query, results);
    }

    return this.scoreIndividually(query, results, concurrency);
  };

  /**
   * Score each document individually with controlled concurrency.
   */
  private async scoreIndividually(
    query: string,
    results: RetrievalResult[],
    concurrency: number
  ): Promise<InternalRerankerResult[]> {
    const scores: InternalRerankerResult[] = [];

    // Process in batches for concurrency control
    for (let i = 0; i < results.length; i += concurrency) {
      const batch = results.slice(i, i + concurrency);
      const batchScores = await Promise.all(
        batch.map((r) => this.scoreDocument(query, r))
      );
      scores.push(...batchScores);
    }

    return scores;
  }

  /**
   * Score a single document.
   */
  private async scoreDocument(
    query: string,
    result: RetrievalResult
  ): Promise<InternalRerankerResult> {
    const prompt = this.promptTemplate
      .replace('{query}', query)
      .replace('{document}', result.chunk.content);

    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: 10, // Only need a number
      });

      const score = this.parseScore(response.content);

      return {
        id: result.id,
        score: score / 10, // Normalize to 0-1
        original: result,
        scoreComponents: {
          relevanceScore: score, // Raw 0-10 score
        },
      };
    } catch (error) {
      throw RerankerError.llmError(
        this.name,
        `Failed to score document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Score all documents in a single batch prompt.
   * More efficient but may lose accuracy for large batches.
   */
  private async scoreBatch(
    query: string,
    results: RetrievalResult[]
  ): Promise<InternalRerankerResult[]> {
    // Build batch prompt
    const documentsText = results
      .map((r, i) => `Document ${i + 1}:\n${r.chunk.content}`)
      .join('\n\n---\n\n');

    const batchPrompt = `Rate the relevance of each document to the query.
Return ONLY a JSON array of numbers (0-10), one for each document.

Query: ${query}

${documentsText}

Relevance scores as JSON array (e.g., [7, 3, 9, 5]):`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a relevance judge. Rate documents 0-10 based on query relevance. ' +
          'Return ONLY a JSON array of numbers, nothing else.',
      },
      { role: 'user', content: batchPrompt },
    ];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: results.length * 5, // ~5 chars per score
      });

      const scores = this.parseBatchScores(response.content, results.length);

      return results.map((r, i) => ({
        id: r.id,
        score: (scores[i] ?? 5) / 10, // Normalize to 0-1
        original: r,
        scoreComponents: {
          relevanceScore: scores[i] ?? 5,
        },
      }));
    } catch (error) {
      throw RerankerError.llmError(
        this.name,
        `Batch scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse a single score from LLM response.
   */
  private parseScore(text: string): number {
    const trimmed = text.trim();

    // Try to extract a number (including negative numbers)
    const match = trimmed.match(/-?\d+(?:\.\d+)?/);
    if (match?.[0]) {
      const score = parseFloat(match[0]);
      // Clamp to 0-10 range
      return Math.max(0, Math.min(10, score));
    }

    // Default to middle score if parsing fails
    console.warn(`[LLMReranker] Failed to parse score from: "${trimmed}", defaulting to 5`);
    return 5;
  }

  /**
   * Parse batch scores from JSON array response.
   */
  private parseBatchScores(text: string, expectedCount: number): number[] {
    const trimmed = text.trim();

    // Try to parse as JSON array
    try {
      // Find JSON array in the response
      const arrayMatch = trimmed.match(/\[[\d\s,\.]+\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]) as unknown[];
        if (
          Array.isArray(parsed) &&
          parsed.every((x) => typeof x === 'number')
        ) {
          // Clamp and pad if needed
          const scores = parsed
            .slice(0, expectedCount)
            .map((s) => Math.max(0, Math.min(10, s as number)));

          // Pad with 5s if not enough scores
          while (scores.length < expectedCount) {
            scores.push(5);
          }

          return scores;
        }
      }
    } catch {
      // JSON parsing failed
    }

    // Fallback: extract all numbers
    const numbers = trimmed.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= expectedCount) {
      return numbers
        .slice(0, expectedCount)
        .map((n) => Math.max(0, Math.min(10, parseFloat(n))));
    }

    // Default to middle scores if all parsing fails
    console.warn(
      `[LLMReranker] Failed to parse batch scores from: "${trimmed.slice(0, 100)}...", defaulting to 5s`
    );
    return Array(expectedCount).fill(5);
  }
}
