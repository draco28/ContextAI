/**
 * Agentic Text Chunker
 *
 * Uses an LLM to determine optimal chunk boundaries based on content
 * understanding and semantic meaning. The most sophisticated chunking
 * strategy, leveraging AI to identify natural topic transitions.
 *
 * Algorithm:
 * 1. Check document size against token budget
 * 2. Send document (or sections) to LLM with chunking instructions
 * 3. Parse LLM response for chunk boundary positions
 * 4. Create chunks based on LLM suggestions
 * 5. Fallback to RecursiveChunker on errors
 */

import type { Chunk, ChunkingOptions, ChunkingStrategy, Document } from './types.js';
import type { LLMProvider, ChatMessage } from '@contextai/core';
import { BaseChunker } from './base-chunker.js';
import { RecursiveChunker } from './recursive-chunker.js';
import { CHARS_PER_TOKEN, estimateTokens } from './token-counter.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the agentic chunker.
 */
export interface AgenticChunkerConfig {
  /**
   * LLM provider for chunk boundary determination.
   * Required - the chunker uses LLM to understand document structure.
   */
  llmProvider: LLMProvider;

  /**
   * Custom prompt template for chunking instructions.
   *
   * Available placeholders:
   * - {chunkSize}: Target chunk size in tokens
   * - {chunkChars}: Target chunk size in characters
   * - {documentText}: The document text to chunk
   *
   * @default Built-in prompt optimized for JSON boundary output
   */
  promptTemplate?: string;

  /**
   * Maximum tokens to send to LLM in a single call.
   *
   * Documents larger than this will be processed in windows.
   * Consider your LLM's context limit when setting this.
   *
   * @default 4000
   */
  maxInputTokens?: number;

  /**
   * Fallback chunking strategy for error scenarios.
   *
   * Used when:
   * - LLM call fails (network, timeout, rate limit)
   * - LLM returns invalid/unparseable response
   * - Response doesn't match expected JSON schema
   *
   * @default RecursiveChunker
   */
  fallbackChunker?: ChunkingStrategy;

  /**
   * LLM temperature for chunking decisions.
   *
   * Lower values produce more deterministic boundaries.
   * Recommended: 0 for reproducibility.
   *
   * @default 0
   */
  temperature?: number;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG = {
  maxInputTokens: 4000,
  temperature: 0,
} as const;

/**
 * Default prompt template for chunking.
 */
const DEFAULT_PROMPT_TEMPLATE = `You are a document chunking assistant. Your task is to identify optimal chunk boundaries in the following text that preserve semantic coherence and topic continuity.

Guidelines:
- Each chunk should focus on a single topic or concept
- Preserve paragraph boundaries when possible
- Target chunk sizes of {chunkSize} tokens (approximately {chunkChars} characters)
- Identify natural topic transitions as split points
- Ensure chunks are self-contained and meaningful

Text to chunk:
---
{documentText}
---

Respond with a JSON object containing an array of chunks. Each chunk should have:
- start: character index where chunk begins (0-indexed)
- end: character index where chunk ends (exclusive)
- topic: brief description of chunk's main topic (optional)

Example format:
{
  "chunks": [
    { "start": 0, "end": 500, "topic": "Introduction to topic A" },
    { "start": 500, "end": 1200, "topic": "Technical details of A" }
  ]
}

Return ONLY valid JSON, no additional text or markdown code blocks.`;

// ============================================================================
// Types
// ============================================================================

/**
 * LLM response schema for chunk boundaries.
 */
interface ChunkBoundary {
  start: number;
  end: number;
  topic?: string;
}

/**
 * Expected LLM response structure.
 */
interface ChunkResponse {
  chunks: ChunkBoundary[];
}

// ============================================================================
// Agentic Chunker Implementation
// ============================================================================

/**
 * Agentic chunking strategy using LLM understanding.
 *
 * This chunker leverages an LLM's ability to understand document content
 * and identify natural topic boundaries. It produces high-quality chunks
 * that preserve semantic coherence, making it ideal for RAG applications
 * where retrieval quality is critical.
 *
 * Benefits:
 * - Deep semantic understanding of content
 * - Identifies topic transitions humans would recognize
 * - Handles complex documents with mixed content types
 * - Can follow custom chunking instructions via prompt
 *
 * Trade-offs:
 * - Requires LLM API calls (slower, more expensive)
 * - Non-deterministic (use temperature=0 for consistency)
 * - Token budget management needed for large documents
 *
 * @example
 * ```typescript
 * const chunker = new AgenticChunker({
 *   llmProvider: new AnthropicProvider({ model: 'claude-sonnet-4-20250514' }),
 *   maxInputTokens: 4000,
 *   temperature: 0
 * });
 *
 * const chunks = await chunker.chunk(document, { chunkSize: 512 });
 * ```
 */
export class AgenticChunker extends BaseChunker {
  readonly name = 'AgenticChunker';

  private readonly llmProvider: LLMProvider;
  private readonly promptTemplate: string;
  private readonly maxInputTokens: number;
  private readonly fallbackChunker: ChunkingStrategy;
  private readonly temperature: number;

  constructor(config: AgenticChunkerConfig) {
    super();

    if (!config.llmProvider) {
      throw new Error('AgenticChunker requires an llmProvider');
    }

    this.llmProvider = config.llmProvider;
    this.promptTemplate = config.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    this.maxInputTokens = config.maxInputTokens ?? DEFAULT_CONFIG.maxInputTokens;
    this.fallbackChunker = config.fallbackChunker ?? new RecursiveChunker();
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature;

    // Validate configuration
    if (this.maxInputTokens < 100) {
      throw new Error('maxInputTokens must be at least 100');
    }
  }

  /**
   * Chunk document using LLM-driven boundary detection.
   */
  protected async _chunk(
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    const text = document.content;
    const textTokens = estimateTokens(text);

    // Check if document fits in single LLM call
    if (textTokens <= this.maxInputTokens) {
      return this.chunkWithLLM(text, document, options);
    }

    // Document too large - process in windows
    return this.chunkInWindows(text, document, options);
  }

  /**
   * Chunk a single text segment using LLM.
   */
  private async chunkWithLLM(
    text: string,
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    try {
      // Build the prompt
      const prompt = this.buildPrompt(text, options);

      // Call LLM
      const messages: ChatMessage[] = [
        { role: 'user', content: prompt }
      ];

      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: 2000, // Enough for boundary JSON
      });

      // Parse response
      const boundaries = this.parseResponse(response.content, text.length);

      // Convert boundaries to chunks
      return this.boundariesToChunks(boundaries, text, document, options);
    } catch (error) {
      // Graceful fallback
      console.warn(
        `[AgenticChunker] LLM chunking failed, falling back to ${this.fallbackChunker.name}: ${error instanceof Error ? error.message : String(error)}`
      );
      return this.fallbackChunker.chunk(document, options);
    }
  }

  /**
   * Process large documents in windows.
   *
   * Splits document into overlapping windows, chunks each with LLM,
   * then merges results to avoid duplicate chunks at boundaries.
   */
  private async chunkInWindows(
    text: string,
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    // Calculate window size in characters
    const windowChars = this.maxInputTokens * CHARS_PER_TOKEN;
    const overlapChars = Math.floor(windowChars * 0.1); // 10% overlap

    const allChunks: Chunk[] = [];
    let windowStart = 0;
    let chunkIndex = 0;

    while (windowStart < text.length) {
      const windowEnd = Math.min(windowStart + windowChars, text.length);
      const windowText = text.slice(windowStart, windowEnd);

      try {
        // Chunk this window
        const prompt = this.buildPrompt(windowText, options);
        const messages: ChatMessage[] = [
          { role: 'user', content: prompt }
        ];

        const response = await this.llmProvider.chat(messages, {
          temperature: this.temperature,
          maxTokens: 2000,
        });

        const boundaries = this.parseResponse(response.content, windowText.length);

        // Adjust boundaries to global positions and create chunks
        for (const boundary of boundaries) {
          const globalStart = windowStart + boundary.start;
          const globalEnd = windowStart + boundary.end;
          const content = text.slice(globalStart, globalEnd);

          // Skip empty chunks
          if (content.trim().length === 0) continue;

          // Skip if this chunk significantly overlaps with previous
          const lastChunk = allChunks[allChunks.length - 1];
          if (lastChunk && lastChunk.metadata.endIndex) {
            const overlapStart = Math.max(globalStart, lastChunk.metadata.startIndex ?? 0);
            const overlapEnd = Math.min(globalEnd, lastChunk.metadata.endIndex);
            const overlapSize = Math.max(0, overlapEnd - overlapStart);
            const chunkSize = globalEnd - globalStart;

            // Skip if >50% overlap with previous chunk
            if (overlapSize > chunkSize * 0.5) {
              continue;
            }
          }

          allChunks.push(
            this.createChunk(
              content,
              document,
              chunkIndex++,
              globalStart,
              globalEnd,
              options
            )
          );
        }
      } catch (error) {
        // Fallback for this window
        console.warn(
          `[AgenticChunker] Window chunking failed at position ${windowStart}, using fallback`
        );
        const windowDoc: Document = {
          ...document,
          id: `${document.id}:window:${windowStart}`,
          content: windowText,
        };
        const fallbackChunks = await this.fallbackChunker.chunk(windowDoc, options);

        // Adjust positions to global
        for (const chunk of fallbackChunks) {
          allChunks.push({
            ...chunk,
            id: this.generateChunkId(document.id, chunkIndex++),
            documentId: document.id,
            metadata: {
              ...chunk.metadata,
              startIndex: (chunk.metadata.startIndex ?? 0) + windowStart,
              endIndex: (chunk.metadata.endIndex ?? 0) + windowStart,
            },
          });
        }
      }

      // Move to next window
      windowStart = windowEnd - overlapChars;

      // Prevent infinite loop on very small documents
      if (windowStart >= text.length - overlapChars) {
        break;
      }
    }

    return allChunks;
  }

  /**
   * Build the LLM prompt with document text and options.
   */
  private buildPrompt(text: string, options: Required<ChunkingOptions>): string {
    const { chunkSize, sizeUnit } = options;

    // Calculate target size
    const targetTokens = sizeUnit === 'tokens' ? chunkSize : Math.ceil(chunkSize / CHARS_PER_TOKEN);
    const targetChars = targetTokens * CHARS_PER_TOKEN;

    return this.promptTemplate
      .replace('{chunkSize}', String(targetTokens))
      .replace('{chunkChars}', String(targetChars))
      .replace('{documentText}', text);
  }

  /**
   * Parse LLM response into chunk boundaries.
   *
   * Handles various response formats and validates boundaries.
   */
  private parseResponse(content: string, textLength: number): ChunkBoundary[] {
    // Try to extract JSON from response
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      const lines = jsonStr.split('\n');
      // Remove first line (```json or ```) and last line (```)
      jsonStr = lines.slice(1, -1).join('\n').trim();
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Invalid JSON response from LLM: ${content.slice(0, 100)}...`);
    }

    // Validate structure
    if (!this.isChunkResponse(parsed)) {
      throw new Error('LLM response missing required "chunks" array');
    }

    // Validate and sanitize boundaries
    const validBoundaries: ChunkBoundary[] = [];
    let lastEnd = 0;

    for (const boundary of parsed.chunks) {
      // Clamp to valid range
      const start = Math.max(0, Math.min(boundary.start, textLength));
      const end = Math.max(start, Math.min(boundary.end, textLength));

      // Skip invalid boundaries
      if (start >= end) continue;

      // Ensure no gaps - if there's a gap from lastEnd to start, extend previous
      if (validBoundaries.length > 0 && start > lastEnd) {
        const prev = validBoundaries[validBoundaries.length - 1];
        if (prev) {
          prev.end = start;
        }
      }

      validBoundaries.push({ start, end, topic: boundary.topic });
      lastEnd = end;
    }

    // Ensure we cover the entire document
    if (validBoundaries.length === 0) {
      // LLM returned empty - create single chunk
      validBoundaries.push({ start: 0, end: textLength });
    } else {
      // Extend last chunk to end if needed
      const last = validBoundaries[validBoundaries.length - 1];
      if (last && last.end < textLength) {
        last.end = textLength;
      }

      // Ensure first chunk starts at 0
      const first = validBoundaries[0];
      if (first && first.start > 0) {
        first.start = 0;
      }
    }

    return validBoundaries;
  }

  /**
   * Type guard for ChunkResponse.
   */
  private isChunkResponse(value: unknown): value is ChunkResponse {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    if (!Array.isArray(obj.chunks)) return false;

    return obj.chunks.every(
      (chunk: unknown) =>
        typeof chunk === 'object' &&
        chunk !== null &&
        typeof (chunk as Record<string, unknown>).start === 'number' &&
        typeof (chunk as Record<string, unknown>).end === 'number'
    );
  }

  /**
   * Convert chunk boundaries to Chunk objects.
   */
  private boundariesToChunks(
    boundaries: ChunkBoundary[],
    text: string,
    document: Document,
    options: Required<ChunkingOptions>
  ): Chunk[] {
    const chunks: Chunk[] = [];

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (!boundary) continue;

      const content = text.slice(boundary.start, boundary.end);

      // Skip empty chunks
      if (content.trim().length === 0) continue;

      const chunk = this.createChunk(
        content,
        document,
        i,
        boundary.start,
        boundary.end,
        options
      );

      // Add topic to metadata if provided
      if (boundary.topic) {
        chunk.metadata.section = boundary.topic;
      }

      chunks.push(chunk);
    }

    return chunks;
  }
}
