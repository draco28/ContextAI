/**
 * LLM-based Verifier
 *
 * Uses a Large Language Model to verify document relevance to a query.
 * Acts as a quality gate before context assembly, filtering irrelevant retrievals.
 *
 * Key features:
 * - Confidence-based skip logic: Optimizes LLM costs using retrieval confidence
 * - Individual or batch mode: Trade accuracy vs efficiency
 * - Robust parsing: Handles malformed LLM responses gracefully
 *
 * @example
 * ```typescript
 * const verifier = new LLMVerifier({
 *   llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
 *   verificationThreshold: 6,  // Score >= 6 = verified
 * });
 *
 * const verified = await verifier.verify(query, results, {
 *   skipThreshold: 0.8,      // Skip LLM for high-confidence results
 *   filterThreshold: 0.3,   // Reject low-confidence results
 * });
 *
 * // Use only verified documents
 * const relevant = verified.filter(r => r.verification?.verified);
 * ```
 */

import type { LLMProvider, ChatMessage } from '@contextaisdk/core';
import type { RetrievalResult } from '../retrieval/types.js';
import type {
  Verifier,
  VerifierOptions,
  VerifiedRetrievalResult,
  VerificationResult,
  LLMVerifierConfig,
} from './types.js';
import { VerifierError } from './errors.js';

// ============================================================================
// Default Prompts
// ============================================================================

/**
 * Default prompt template for relevance verification.
 * Asks for structured JSON with verified status, score, and reasoning.
 */
const DEFAULT_PROMPT_TEMPLATE = `Determine if the following document is relevant to the query.
Return a JSON object with:
- "verified": true/false (is this document relevant to the query?)
- "score": 0-10 (relevance score, where 10 = perfectly relevant)
- "reasoning": brief explanation (1 sentence)

Query: {query}

Document:
{document}

JSON response:`;

/**
 * Default system prompt for verification.
 * Instructs strict relevance judgment.
 */
const DEFAULT_SYSTEM_PROMPT =
  'You are a relevance verification judge. ' +
  'Analyze if documents directly address the query. ' +
  'Be strict: only mark as verified if the document contains information that helps answer the query. ' +
  'Return ONLY valid JSON, no other text.';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_VERIFICATION_THRESHOLD = 6;
const DEFAULT_SKIP_THRESHOLD = 0.8;
const DEFAULT_FILTER_THRESHOLD = 0.3;

// ============================================================================
// LLMVerifier Implementation
// ============================================================================

/**
 * LLM-based document relevance verifier.
 *
 * Uses confidence-based logic to optimize LLM calls:
 * - High confidence (>= skipThreshold): Auto-verified without LLM
 * - Mid confidence: Verified with LLM
 * - Low confidence (< filterThreshold): Auto-rejected without LLM
 *
 * This approach balances accuracy with cost by only calling the LLM
 * for documents where the retrieval confidence is inconclusive.
 */
export class LLMVerifier implements Verifier {
  readonly name: string;
  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly systemPrompt: string;
  private readonly temperature: number;
  private readonly defaultConcurrency: number;
  private readonly verificationThreshold: number;

  constructor(config: LLMVerifierConfig & { llmProvider: LLMProvider }) {
    if (!config.llmProvider) {
      throw VerifierError.configError('LLMVerifier', 'llmProvider is required');
    }

    this.name = config.name ?? 'LLMVerifier';
    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.systemPrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.defaultConcurrency = config.defaultConcurrency ?? DEFAULT_CONCURRENCY;
    this.verificationThreshold =
      config.verificationThreshold ?? DEFAULT_VERIFICATION_THRESHOLD;
  }

  /**
   * Verify documents with confidence-based skip logic.
   *
   * Categorizes results by retrieval confidence and handles each category:
   * - High: Skip verification, mark as verified
   * - Mid: Verify with LLM
   * - Low: Skip verification, mark as unverified
   *
   * Returns all results in original order with verification info attached.
   */
  verify = async (
    query: string,
    results: RetrievalResult[],
    options?: VerifierOptions
  ): Promise<VerifiedRetrievalResult[]> => {
    if (!query?.trim()) {
      throw VerifierError.invalidInput(this.name, 'Query cannot be empty');
    }

    if (!results || results.length === 0) {
      return [];
    }

    const {
      skipThreshold = DEFAULT_SKIP_THRESHOLD,
      filterThreshold = DEFAULT_FILTER_THRESHOLD,
      includeReasoning = false,
      concurrency = this.defaultConcurrency,
      batchMode = false,
    } = options ?? {};

    // Categorize by confidence
    const { highConfidence, midConfidence, lowConfidence } =
      this.categorizeByConfidence(results, skipThreshold, filterThreshold);

    // Process each category
    const highResults = this.handleHighConfidence(highConfidence, includeReasoning);
    const lowResults = this.handleLowConfidence(lowConfidence, includeReasoning);

    // Mid-confidence: verify with LLM
    const midResults = midConfidence.length > 0
      ? batchMode
        ? await this.verifyBatch(query, midConfidence, includeReasoning)
        : await this.verifyIndividually(query, midConfidence, concurrency, includeReasoning)
      : [];

    // Merge back in original order
    return this.mergeResults(results, highResults, midResults, lowResults);
  };

  // ============================================================================
  // Confidence Categorization
  // ============================================================================

  /**
   * Categorize results by confidence level.
   *
   * Results without confidence scores default to mid-confidence
   * (0.5) to ensure they get verified.
   */
  private categorizeByConfidence(
    results: RetrievalResult[],
    skipThreshold: number,
    filterThreshold: number
  ): {
    highConfidence: RetrievalResult[];
    midConfidence: RetrievalResult[];
    lowConfidence: RetrievalResult[];
  } {
    const highConfidence: RetrievalResult[] = [];
    const midConfidence: RetrievalResult[] = [];
    const lowConfidence: RetrievalResult[] = [];

    for (const result of results) {
      // Default to mid-confidence if no confidence score
      const confidence = result.confidence?.overall ?? 0.5;

      if (confidence >= skipThreshold) {
        highConfidence.push(result);
      } else if (confidence < filterThreshold) {
        lowConfidence.push(result);
      } else {
        midConfidence.push(result);
      }
    }

    return { highConfidence, midConfidence, lowConfidence };
  }

  // ============================================================================
  // High/Low Confidence Handlers
  // ============================================================================

  /**
   * Handle high-confidence results: auto-verify without LLM call.
   */
  private handleHighConfidence(
    results: RetrievalResult[],
    includeReasoning: boolean
  ): VerifiedRetrievalResult[] {
    return results.map((result) => ({
      ...result,
      verification: {
        verified: true,
        confidence: result.confidence?.overall ?? 1,
        verificationScore: 10,
        reasoning: includeReasoning
          ? 'Auto-verified: high retrieval confidence'
          : undefined,
      },
    }));
  }

  /**
   * Handle low-confidence results: auto-reject without LLM call.
   */
  private handleLowConfidence(
    results: RetrievalResult[],
    includeReasoning: boolean
  ): VerifiedRetrievalResult[] {
    return results.map((result) => ({
      ...result,
      verification: {
        verified: false,
        confidence: result.confidence?.overall ?? 0,
        verificationScore: 0,
        reasoning: includeReasoning
          ? 'Auto-rejected: low retrieval confidence'
          : undefined,
      },
    }));
  }

  // ============================================================================
  // Individual Verification
  // ============================================================================

  /**
   * Verify documents individually with controlled concurrency.
   *
   * Processes documents in batches to respect rate limits while
   * maximizing throughput.
   */
  private async verifyIndividually(
    query: string,
    results: RetrievalResult[],
    concurrency: number,
    includeReasoning: boolean
  ): Promise<VerifiedRetrievalResult[]> {
    const verified: VerifiedRetrievalResult[] = [];

    // Process in batches for concurrency control
    for (let i = 0; i < results.length; i += concurrency) {
      const batch = results.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((r) => this.verifyDocument(query, r, includeReasoning))
      );
      verified.push(...batchResults);
    }

    return verified;
  }

  /**
   * Verify a single document using LLM.
   */
  private async verifyDocument(
    query: string,
    result: RetrievalResult,
    includeReasoning: boolean
  ): Promise<VerifiedRetrievalResult> {
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
        maxTokens: 200,
      });

      const verification = this.parseVerificationResponse(
        response.content,
        includeReasoning
      );

      return { ...result, verification };
    } catch (error) {
      throw VerifierError.llmError(
        this.name,
        `Failed to verify document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================================================
  // Batch Verification
  // ============================================================================

  /**
   * Verify all documents in a single batch prompt.
   *
   * More efficient for many documents but may reduce accuracy.
   * Best for simple yes/no relevance judgments.
   */
  private async verifyBatch(
    query: string,
    results: RetrievalResult[],
    includeReasoning: boolean
  ): Promise<VerifiedRetrievalResult[]> {
    if (results.length === 0) return [];

    // Build batch prompt
    const documentsText = results
      .map((r, i) => `Document ${i + 1}:\n${r.chunk.content}`)
      .join('\n\n---\n\n');

    const batchPrompt = `Verify relevance of each document to the query.
Return a JSON array with one object per document:
[{"verified": true/false, "score": 0-10}, ...]

Query: ${query}

${documentsText}

JSON array response:`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a relevance judge. Verify each document (true/false) with a score (0-10). ' +
          'Return ONLY a JSON array, no other text.',
      },
      { role: 'user', content: batchPrompt },
    ];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: results.length * 50,
      });

      return this.parseBatchResponse(response.content, results, includeReasoning);
    } catch (error) {
      throw VerifierError.llmError(
        this.name,
        `Batch verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================================================
  // Response Parsing
  // ============================================================================

  /**
   * Parse LLM verification response.
   *
   * Handles both JSON responses and plain text with fallback extraction.
   */
  private parseVerificationResponse(
    text: string,
    includeReasoning: boolean
  ): VerificationResult {
    const trimmed = text.trim();

    // Try to parse JSON from response
    try {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        const score = Math.max(
          0,
          Math.min(10, Number(parsed.score) || 5)
        );

        return {
          verified:
            parsed.verified === true || score >= this.verificationThreshold,
          confidence: score / 10,
          verificationScore: score,
          reasoning: includeReasoning
            ? typeof parsed.reasoning === 'string'
              ? parsed.reasoning
              : undefined
            : undefined,
        };
      }
    } catch {
      // JSON parsing failed, continue to fallback
    }

    // Fallback: extract number and use threshold
    const scoreMatch = trimmed.match(/\d+(?:\.\d+)?/);
    const score = scoreMatch
      ? Math.max(0, Math.min(10, parseFloat(scoreMatch[0])))
      : 5;

    return {
      verified: score >= this.verificationThreshold,
      confidence: score / 10,
      verificationScore: score,
      reasoning: includeReasoning ? 'Parsed from text response' : undefined,
    };
  }

  /**
   * Parse batch verification response.
   *
   * Extracts JSON array and maps to results, with robust fallback handling.
   */
  private parseBatchResponse(
    text: string,
    results: RetrievalResult[],
    includeReasoning: boolean
  ): VerifiedRetrievalResult[] {
    const trimmed = text.trim();

    // Try to parse JSON array
    try {
      const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]) as unknown[];

        return results.map((result, i) => {
          const item = parsed[i] as
            | { verified?: boolean; score?: number }
            | undefined;
          const score = Math.max(0, Math.min(10, Number(item?.score) || 5));

          return {
            ...result,
            verification: {
              verified:
                item?.verified === true || score >= this.verificationThreshold,
              confidence: score / 10,
              verificationScore: score,
              reasoning: includeReasoning ? 'Batch verified' : undefined,
            },
          };
        });
      }
    } catch {
      // JSON parsing failed
    }

    // Fallback: default to mid-range scores
    console.warn(
      `[LLMVerifier] Failed to parse batch response: "${trimmed.slice(0, 100)}...", using defaults`
    );

    return results.map((result) => ({
      ...result,
      verification: {
        verified: true, // Default to verified when parsing fails
        confidence: 0.5,
        verificationScore: 5,
        reasoning: includeReasoning
          ? 'Fallback: could not parse batch response'
          : undefined,
      },
    }));
  }

  // ============================================================================
  // Result Merging
  // ============================================================================

  /**
   * Merge verified results back in original order.
   *
   * Uses a map for O(1) lookup to preserve original ordering efficiently.
   */
  private mergeResults(
    original: RetrievalResult[],
    high: VerifiedRetrievalResult[],
    mid: VerifiedRetrievalResult[],
    low: VerifiedRetrievalResult[]
  ): VerifiedRetrievalResult[] {
    const resultMap = new Map<string, VerifiedRetrievalResult>();

    // Add all processed results to map
    for (const r of [...high, ...mid, ...low]) {
      resultMap.set(r.id, r);
    }

    // Return in original order
    return original.map((r) => resultMap.get(r.id)!);
  }
}
