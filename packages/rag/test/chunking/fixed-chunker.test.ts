/**
 * FixedSizeChunker Tests
 */

import { describe, it, expect } from 'vitest';
import { FixedSizeChunker } from '../../src/chunking/fixed-chunker.js';
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

describe('FixedSizeChunker', () => {
  const chunker = new FixedSizeChunker();

  describe('properties', () => {
    it('should have correct name', () => {
      expect(chunker.name).toBe('FixedSizeChunker');
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

    it('should throw on whitespace-only document', async () => {
      const doc = createDocument('   \n\t  ');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
    });

    it('should chunk small document into single chunk', async () => {
      const doc = createDocument('Hello, world!');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
        sizeUnit: 'tokens',
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hello, world!');
      expect(chunks[0].documentId).toBe('test-doc');
    });

    it('should split large document into multiple chunks', async () => {
      // Create text that's about 20 tokens (80 chars)
      const doc = createDocument('a'.repeat(80));

      const chunks = await chunker.chunk(doc, {
        chunkSize: 10, // 10 tokens = 40 chars
        chunkOverlap: 0,
        sizeUnit: 'tokens',
      });

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toHaveLength(40);
      expect(chunks[1].content).toHaveLength(40);
    });

    it('should apply overlap correctly', async () => {
      // 100 chars, 10 token chunks (40 chars), 2 token overlap (8 chars)
      // Step = 40 - 8 = 32
      const doc = createDocument('a'.repeat(100));

      const chunks = await chunker.chunk(doc, {
        chunkSize: 10,
        chunkOverlap: 2,
        sizeUnit: 'tokens',
      });

      // With overlap, we get more chunks
      expect(chunks.length).toBeGreaterThan(2);
    });

    it('should work with character-based sizing', async () => {
      const doc = createDocument('a'.repeat(100));

      const chunks = await chunker.chunk(doc, {
        chunkSize: 50,
        chunkOverlap: 0,
        sizeUnit: 'characters',
      });

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toHaveLength(50);
      expect(chunks[1].content).toHaveLength(50);
    });

    it('should include position metadata', async () => {
      const doc = createDocument('Hello World');

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        chunkOverlap: 0,
      });

      expect(chunks[0].metadata.startIndex).toBe(0);
      expect(chunks[0].metadata.endIndex).toBe(11);
    });

    it('should generate deterministic chunk IDs', async () => {
      const doc = createDocument('Hello World');

      const chunks1 = await chunker.chunk(doc);
      const chunks2 = await chunker.chunk(doc);

      expect(chunks1[0].id).toBe(chunks2[0].id);
    });

    it('should validate chunk size minimum', async () => {
      const doc = createDocument('Hello World');

      await expect(chunker.chunk(doc, { chunkSize: 5 })).rejects.toMatchObject({
        code: 'CHUNK_TOO_SMALL',
      });
    });

    it('should validate overlap < chunkSize', async () => {
      const doc = createDocument('Hello World');

      await expect(
        chunker.chunk(doc, { chunkSize: 100, chunkOverlap: 100 })
      ).rejects.toMatchObject({
        code: 'INVALID_OPTIONS',
      });
    });
  });

  describe('context headers', () => {
    it('should add context headers when enabled', async () => {
      const doc = createDocument('Hello World');
      doc.metadata.title = 'My Document';

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        addContextHeaders: true,
      });

      expect(chunks[0].content).toContain('Document: My Document');
      expect(chunks[0].content).toContain('Hello World');
    });

    it('should not add headers when disabled', async () => {
      const doc = createDocument('Hello World');
      doc.metadata.title = 'My Document';

      const chunks = await chunker.chunk(doc, {
        chunkSize: 100,
        addContextHeaders: false,
      });

      expect(chunks[0].content).toBe('Hello World');
    });
  });
});
