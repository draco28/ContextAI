/**
 * HyDE (Hypothetical Document Embeddings) Enhancer
 *
 * Generates hypothetical documents that answer the query, then
 * returns them for embedding-based retrieval. This bridges the
 * vocabulary gap between questions and relevant documents.
 *
 * How it works:
 * 1. User asks: "How do I reset my password?"
 * 2. LLM generates: "To reset your password, go to Settings > Account > Reset Password..."
 * 3. The hypothetical document is embedded and used for similarity search
 * 4. Documents similar to the hypothetical answer are retrieved
 *
 * This is powerful because:
 * - Questions and answers use different vocabulary
 * - The hypothetical doc uses terminology likely in real docs
 * - Retrieval finds docs similar to what the answer should look like
 *
 * Reference: Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels"
 *
 * @example
 * ```typescript
 * const hyde = new HyDEEnhancer({
 *   llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
 *   embeddingProvider: new HuggingFaceEmbeddingProvider(),
 * });
 *
 * const result = await hyde.enhance('How do I configure SSL certificates?');
 * // result.enhanced: ['To configure SSL certificates, first generate a certificate...']
 * // result.metadata.hypotheticalDocs: ['To configure SSL certificates...']
 * ```
 */

import type { LLMProvider, ChatMessage } from '@contextaisdk/core';
import type {
  HyDEConfig,
  EnhanceOptions,
  EnhancementResult,
  EnhancementStrategy,
} from './types.js';
import { BaseQueryEnhancer } from './base-enhancer.js';
import { QueryEnhancementError } from './errors.js';

/**
 * Default system prompt for HyDE.
 */
const DEFAULT_SYSTEM_PROMPT = `You are a technical documentation expert. Your task is to write a passage that directly answers a given question.

Rules:
1. Write as if you are answering the question in a technical document
2. Use specific technical terminology that would appear in real documentation
3. Be factual and informative - don't hedge or speculate
4. Keep the passage focused and around 100-200 words
5. Do NOT include phrases like "I think" or "You might want to"
6. Write in a documentation style, not conversational`;

/**
 * Default prompt template for HyDE.
 * The {query} placeholder is replaced with the user's query.
 */
const DEFAULT_PROMPT_TEMPLATE = `Write a documentation passage that answers this question:

Question: {query}

Documentation passage:`;

/**
 * Default temperature for HyDE.
 * Higher temperature = more diverse hypothetical docs.
 */
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Default max tokens for hypothetical document.
 */
const DEFAULT_MAX_TOKENS = 256;

/**
 * Default number of hypothetical documents to generate.
 */
const DEFAULT_NUM_HYPOTHETICAL = 1;

/**
 * HyDE (Hypothetical Document Embeddings) Enhancer.
 *
 * Generates hypothetical documents that answer the query,
 * which are then used for similarity-based retrieval.
 *
 * This is more expensive than simple rewriting but can
 * dramatically improve retrieval for complex questions.
 *
 * Cost: ~300-500 tokens per hypothetical doc
 * Latency: ~500-1000ms per doc + embedding time
 *
 * @example
 * ```typescript
 * import { OpenAIProvider } from '@contextaisdk/provider-openai';
 * import { HuggingFaceEmbeddingProvider } from '@contextaisdk/rag';
 *
 * const hyde = new HyDEEnhancer({
 *   llmProvider: new OpenAIProvider({
 *     model: 'gpt-4o-mini',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   }),
 *   embeddingProvider: new HuggingFaceEmbeddingProvider({
 *     modelName: 'Xenova/bge-base-en-v1.5',
 *   }),
 *   numHypothetical: 3,  // Generate 3 different perspectives
 *   temperature: 0.8,    // Higher diversity
 * });
 *
 * const result = await hyde.enhance('How do I handle authentication errors?');
 *
 * // Use the hypothetical docs for retrieval
 * // Instead of embedding the question, embed these docs
 * for (const hypotheticalQuery of result.enhanced) {
 *   const embedding = await embeddingProvider.embed(hypotheticalQuery);
 *   // ... search vector store with this embedding
 * }
 * ```
 */
export class HyDEEnhancer extends BaseQueryEnhancer {
  readonly name: string;
  readonly strategy: EnhancementStrategy = 'hyde';

  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly systemPrompt: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly defaultNumHypothetical: number;

  constructor(config: HyDEConfig) {
    super();

    if (!config.llmProvider) {
      throw QueryEnhancementError.configError(
        'HyDEEnhancer',
        'llmProvider is required'
      );
    }

    // Note: embeddingProvider is in config but not used directly here.
    // The caller embeds the hypothetical docs - this enhancer just generates them.
    // This keeps the enhancer focused on query transformation.

    this.name = config.name ?? 'HyDEEnhancer';
    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.systemPrompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.defaultTemperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.defaultMaxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.defaultNumHypothetical = config.numHypothetical ?? DEFAULT_NUM_HYPOTHETICAL;
  }

  /**
   * Generate hypothetical documents that answer the query.
   */
  protected _enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    const startTime = Date.now();
    const temperature = options?.temperature ?? this.defaultTemperature;
    const numHypothetical = options?.maxVariants ?? this.defaultNumHypothetical;

    // Generate hypothetical documents
    const hypotheticalDocs = await this.generateHypotheticalDocs(
      query,
      numHypothetical,
      temperature
    );

    const llmLatencyMs = Date.now() - startTime;

    return this.createResult(query, hypotheticalDocs, {
      llmLatencyMs,
      hypotheticalDocs, // Also store in metadata for inspection
    });
  };

  /**
   * Generate one or more hypothetical documents.
   */
  private async generateHypotheticalDocs(
    query: string,
    count: number,
    temperature: number
  ): Promise<string[]> {
    // Generate documents in parallel for efficiency
    const promises = Array.from({ length: count }, () =>
      this.generateSingleDoc(query, temperature)
    );

    try {
      const results = await Promise.all(promises);
      // Filter out any empty results
      return results.filter((doc) => doc.length > 0);
    } catch (error) {
      throw QueryEnhancementError.llmError(
        this.name,
        `Failed to generate hypothetical documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate a single hypothetical document.
   */
  private async generateSingleDoc(
    query: string,
    temperature: number
  ): Promise<string> {
    const prompt = this.promptTemplate.replace('{query}', query);

    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ];

    const response = await this.llmProvider.chat(messages, {
      temperature,
      maxTokens: this.defaultMaxTokens,
    });

    return this.parseResponse(response.content);
  }

  /**
   * Parse and clean the LLM response.
   */
  private parseResponse(response: string): string {
    let doc = response.trim();

    // Remove common prefixes the LLM might add
    const prefixes = [
      'Documentation passage:',
      'Passage:',
      'Answer:',
      'Here is a documentation passage:',
    ];

    for (const prefix of prefixes) {
      if (doc.toLowerCase().startsWith(prefix.toLowerCase())) {
        doc = doc.slice(prefix.length).trim();
        break;
      }
    }

    return doc;
  }
}
