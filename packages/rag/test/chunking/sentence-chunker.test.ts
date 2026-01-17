/**
 * SentenceChunker Tests
 */

import { describe, it, expect } from 'vitest';
import { SentenceChunker } from '../../src/chunking/sentence-chunker.js';
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

describe('SentenceChunker', () => {
  const chunker = new SentenceChunker();

  describe('properties', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('SentenceChunker');
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

    it('should keep single sentence as one chunk', async () => {
      const doc = createDocument('This is a single sentence.');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('This is a single sentence.');
    });

    it('should group multiple sentences up to chunk size', async () => {
      const doc = createDocument('Sentence one. Sentence two. Sentence three.');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100, // Large enough for all sentences
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      expect(chunks).toHaveLength(1);
    });

    it('should split into multiple chunks when exceeding size', async () => {
      const doc = createDocument(
        'First sentence here. Second sentence here. Third sentence here.'
      );

      const chunks = await chunker.chunk(doc, {
        chunkSize: 25, // Small enough to force splitting
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should never cut mid-sentence', async () => {
      const doc = createDocument('This is sentence one. This is sentence two.');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 25,
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      // Each chunk should end with a complete sentence
      for (const chunk of chunks) {
        const trimmed = chunk.content.trim();
        expect(
          trimmed.endsWith('.') ||
            trimmed.endsWith('!') ||
            trimmed.endsWith('?') ||
            trimmed === chunks[chunks.length - 1].content.trim() // Last chunk may not end with punctuation
        ).toBe(true);
      }
    });

    it('should handle question marks as sentence boundaries', async () => {
      const doc = createDocument('Is this a question? Yes it is. Really?');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain('Is this a question?');
    });

    it('should handle exclamation marks as sentence boundaries', async () => {
      const doc = createDocument('Wow! Amazing! Incredible!');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
    });

    it('should apply sentence-based overlap', async () => {
      const doc = createDocument(
        'Sentence A. Sentence B. Sentence C. Sentence D.'
      );

      const chunks = await chunker.chunk(doc, {
        chunkSize: 30,
        chunkOverlap: 15, // Overlap should include previous sentences
        sizeUnit: 'characters',
      });

      // With overlap, later chunks may include content from earlier chunks
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should include position metadata', async () => {
      const doc = createDocument('Hello world.');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks[0].metadata.startIndex).toBeDefined();
      expect(chunks[0].metadata.endIndex).toBeDefined();
    });

    it('should generate deterministic chunk IDs', async () => {
      const doc = createDocument('Sentence one. Sentence two.');

      const chunks1 = await chunker.chunk(doc);
      const chunks2 = await chunker.chunk(doc);

      expect(chunks1[0].id).toBe(chunks2[0].id);
    });
  });

  describe('edge cases', () => {
    it('should handle text without sentence boundaries', async () => {
      const doc = createDocument('No periods here just text');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('No periods here just text');
    });

    it('should handle single word', async () => {
      const doc = createDocument('Hello');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks).toHaveLength(1);
    });

    it('should handle multiple spaces between sentences', async () => {
      const doc = createDocument('First.   Second.    Third.');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      // Should still parse correctly
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
