/**
 * Sentence-Based Text Chunker
 *
 * Splits documents by sentence boundaries, then groups sentences
 * to reach target chunk size. Never cuts mid-sentence.
 */

import type { Chunk, ChunkingOptions, Document } from './types.js';
import { BaseChunker } from './base-chunker.js';
import { CHARS_PER_TOKEN } from './token-counter.js';

/**
 * Regex pattern for sentence boundaries.
 *
 * Matches:
 * - Period, exclamation, or question mark
 * - Followed by one or more spaces or newlines
 *
 * Does NOT match:
 * - Abbreviations like "Dr." or "U.S." (imperfect, but good enough)
 * - Decimal numbers like "3.14"
 */
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+/;

/**
 * Sentence-based chunking strategy.
 *
 * Splits text into sentences, then groups sentences together until
 * the target chunk size is reached. Guarantees complete sentences
 * in every chunk.
 *
 * Best for:
 * - Natural language text (articles, documentation)
 * - When sentence integrity is critical for meaning
 * - Question-answering systems where complete thoughts matter
 *
 * @example
 * ```typescript
 * const chunker = new SentenceChunker();
 *
 * const chunks = await chunker.chunk(document, {
 *   chunkSize: 512,
 *   chunkOverlap: 50  // Overlap in sentences, not tokens
 * });
 * ```
 */
export class SentenceChunker extends BaseChunker {
  readonly name = 'SentenceChunker';

  /**
   * Split document by sentence boundaries.
   */
  protected async _chunk(
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    const { chunkSize, chunkOverlap, sizeUnit } = options;
    const text = document.content;

    // Convert to character counts
    const maxChars =
      sizeUnit === 'tokens' ? chunkSize * CHARS_PER_TOKEN : chunkSize;
    const overlapChars =
      sizeUnit === 'tokens' ? chunkOverlap * CHARS_PER_TOKEN : chunkOverlap;

    // Split into sentences
    const sentences = this.splitIntoSentences(text);

    if (sentences.length === 0) {
      return [];
    }

    // Group sentences into chunks
    const groupedChunks = this.groupSentences(
      sentences,
      maxChars,
      overlapChars
    );

    // Convert to Chunk objects with metadata
    const chunks: Chunk[] = [];
    let searchStart = 0;

    for (let i = 0; i < groupedChunks.length; i++) {
      const content = groupedChunks[i];
      if (!content || content.trim().length === 0) {
        continue;
      }

      const startIndex = text.indexOf(content, searchStart);
      const endIndex = startIndex + content.length;

      chunks.push(
        this.createChunk(content, document, i, startIndex, endIndex, options)
      );

      // Move search position forward, but account for overlap
      searchStart = Math.max(searchStart, startIndex + 1);
    }

    return chunks;
  }

  /**
   * Split text into sentences.
   */
  private splitIntoSentences(text: string): string[] {
    // Split by sentence boundaries
    const parts = text.split(SENTENCE_BOUNDARY);

    // Filter out empty strings and trim
    return parts.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /**
   * Group sentences into chunks of target size.
   */
  private groupSentences(
    sentences: string[],
    maxChars: number,
    overlapChars: number
  ): string[] {
    const chunks: string[] = [];
    let currentSentences: string[] = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceWithSpace = currentLength > 0 ? ' ' + sentence : sentence;
      const newLength = currentLength + sentenceWithSpace.length;

      if (newLength <= maxChars) {
        // Sentence fits, add to current chunk
        currentSentences.push(sentence);
        currentLength = newLength;
      } else {
        // Would exceed max, finalize current chunk
        if (currentSentences.length > 0) {
          chunks.push(currentSentences.join(' '));
        }

        // Calculate overlap (take sentences from end of previous chunk)
        const overlapSentences = this.getOverlapSentences(
          currentSentences,
          overlapChars
        );

        // Start new chunk with overlap + current sentence
        currentSentences = [...overlapSentences, sentence];
        currentLength = currentSentences.join(' ').length;
      }
    }

    // Don't forget the last chunk
    if (currentSentences.length > 0) {
      chunks.push(currentSentences.join(' '));
    }

    return chunks;
  }

  /**
   * Get sentences from the end that fit within overlap size.
   */
  private getOverlapSentences(
    sentences: string[],
    overlapChars: number
  ): string[] {
    if (overlapChars <= 0 || sentences.length === 0) {
      return [];
    }

    const result: string[] = [];
    let totalLength = 0;

    // Work backwards from end
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      if (!sentence) continue;

      const withSpace = totalLength > 0 ? sentence.length + 1 : sentence.length;

      if (totalLength + withSpace <= overlapChars) {
        result.unshift(sentence);
        totalLength += withSpace;
      } else {
        break;
      }
    }

    return result;
  }
}
