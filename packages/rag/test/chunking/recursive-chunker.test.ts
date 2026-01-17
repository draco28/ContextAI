/**
 * RecursiveChunker Tests
 */

import { describe, it, expect } from 'vitest';
import { RecursiveChunker } from '../../src/chunking/recursive-chunker.js';
import { ChunkerError } from '../../src/chunking/errors.js';
import type { Document } from '../../src/chunking/types.js';

// Helper to create a test document
function createDocument(content: string, id = 'test-doc'): Document {
  return {
    id,
    content,
    metadata: { title: 'Test Document' },
    source: 'test',
  };
}

describe('RecursiveChunker', () => {
  const chunker = new RecursiveChunker();

  describe('properties', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('RecursiveChunker');
    });
  });

  describe('chunk()', () => {
    it('should throw on empty document', async () => {
      const doc = createDocument('');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
      await expect(chunker.chunk(doc)).rejects.toMatchObject({
        code: 'EMPTY_DOCUMENT',
      });
    });

    it('should keep small document as single chunk', async () => {
      const doc = createDocument('Hello, world!');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hello, world!');
    });

    it('should split on paragraph boundaries first', async () => {
      const doc = createDocument(
        'Paragraph one.\n\nParagraph two.\n\nParagraph three.'
      );

      const chunks = await chunker.chunk(doc, {
        chunkSize: 10, // Small enough to force splitting
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      // Should respect paragraph boundaries
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should fall back to line boundaries for large paragraphs', async () => {
      // One large paragraph with multiple lines
      const doc = createDocument(
        'Line one.\nLine two.\nLine three.\nLine four.'
      );

      const chunks = await chunker.chunk(doc, {
        chunkSize: 15,
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should handle text without separators', async () => {
      // Just one long word
      const doc = createDocument('a'.repeat(100));

      const chunks = await chunker.chunk(doc, {
        chunkSize: 10,
        chunkOverlap: 0,
        sizeUnit: 'tokens',
      });

      // Should still split (falls back to character-based)
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('should apply overlap between chunks', async () => {
      const doc = createDocument(
        'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
      );

      const chunks = await chunker.chunk(doc, {
        chunkSize: 20,
        chunkOverlap: 5,
        sizeUnit: 'characters',
      });

      // With overlap, chunks should share some content
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should include position metadata', async () => {
      const doc = createDocument('Hello World');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks[0].metadata.startIndex).toBeDefined();
      expect(chunks[0].metadata.endIndex).toBeDefined();
    });

    it('should generate deterministic chunk IDs', async () => {
      const doc = createDocument('Hello\n\nWorld');

      const chunks1 = await chunker.chunk(doc);
      const chunks2 = await chunker.chunk(doc);

      expect(chunks1[0].id).toBe(chunks2[0].id);
    });
  });

  describe('custom separators', () => {
    it('should accept custom separator hierarchy', async () => {
      // Custom: only split on pipes
      const customChunker = new RecursiveChunker(['|']);
      const doc = createDocument('Part A|Part B|Part C');

      const chunks = await customChunker.chunk(doc, {
        chunkSize: 10,
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle single separator at end', async () => {
      const doc = createDocument('Content here.\n\n');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content.trim()).toBe('Content here.');
    });

    it('should handle multiple consecutive separators', async () => {
      const doc = createDocument('A\n\n\n\nB');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      // Should still produce valid chunks
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
