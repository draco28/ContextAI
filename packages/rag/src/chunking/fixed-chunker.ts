/**
 * Fixed-Size Text Chunker
 *
 * Splits documents into chunks of approximately equal size.
 * The simplest chunking strategy - good baseline for comparison.
 */

import type { Chunk, ChunkingOptions, Document } from './types.js';
import { BaseChunker } from './base-chunker.js';
import { CHARS_PER_TOKEN } from './token-counter.js';

/**
 * Fixed-size chunking strategy.
 *
 * Splits text by token or character count with configurable overlap.
 * Does not respect semantic boundaries (sentences, paragraphs).
 *
 * Best for:
 * - Uniform chunk sizes (important for some embedding models)
 * - Simple baseline when semantic chunking isn't needed
 * - Code or structured data where natural boundaries are unclear
 *
 * @example
 * ```typescript
 * const chunker = new FixedSizeChunker();
 *
 * const chunks = await chunker.chunk(document, {
 *   chunkSize: 512,      // 512 tokens per chunk
 *   chunkOverlap: 50,    // 50 token overlap
 *   sizeUnit: 'tokens'
 * });
 * ```
 */
export class FixedSizeChunker extends BaseChunker {
  readonly name = 'FixedSizeChunker';

  /**
   * Split document into fixed-size chunks.
   */
  protected async _chunk(
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    const { chunkSize, chunkOverlap, sizeUnit } = options;
    const text = document.content;

    // Convert to character counts for precise slicing
    const chunkChars =
      sizeUnit === 'tokens' ? chunkSize * CHARS_PER_TOKEN : chunkSize;
    const overlapChars =
      sizeUnit === 'tokens' ? chunkOverlap * CHARS_PER_TOKEN : chunkOverlap;

    const chunks: Chunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      // Calculate end position (don't exceed text length)
      const end = Math.min(start + chunkChars, text.length);

      // Extract chunk content
      const content = text.slice(start, end);

      // Only create chunk if there's content
      if (content.trim().length > 0) {
        chunks.push(
          this.createChunk(content, document, index, start, end, options)
        );
        index++;
      }

      // Move to next chunk position
      const step = chunkChars - overlapChars;
      start += step;

      // Safety: ensure we always make progress
      if (step <= 0) {
        start = end;
      }
    }

    return chunks;
  }
}
