import { describe, it, expect, beforeEach } from 'vitest';
import { BM25Retriever, RetrieverError, type BM25Document } from '../../src/index.js';
import type { Chunk } from '../../src/vector-store/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createBM25Document(
  id: string,
  content: string
): BM25Document {
  const chunk: Chunk = {
    id,
    content,
    metadata: {},
  };
  return { id, content, chunk };
}

// ============================================================================
// BM25 Retriever Tests
// ============================================================================

describe('BM25Retriever', () => {
  let retriever: BM25Retriever;

  beforeEach(() => {
    retriever = new BM25Retriever();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const r = new BM25Retriever();
      expect(r.name).toBe('BM25Retriever');
    });

    it('should accept custom k1 and b parameters', () => {
      const r = new BM25Retriever({ k1: 1.5, b: 0.5 });
      expect(r.name).toBe('BM25Retriever');
    });

    it('should throw on invalid k1', () => {
      expect(() => new BM25Retriever({ k1: -1 })).toThrow(RetrieverError);
    });

    it('should throw on invalid b (< 0)', () => {
      expect(() => new BM25Retriever({ b: -0.1 })).toThrow(RetrieverError);
    });

    it('should throw on invalid b (> 1)', () => {
      expect(() => new BM25Retriever({ b: 1.5 })).toThrow(RetrieverError);
    });
  });

  describe('buildIndex', () => {
    it('should build index from documents', () => {
      const docs = [
        createBM25Document('1', 'PostgreSQL is a database'),
        createBM25Document('2', 'MySQL is also a database'),
      ];

      retriever.buildIndex(docs);

      expect(retriever.documentCount).toBe(2);
      expect(retriever.vocabularySize).toBeGreaterThan(0);
    });

    it('should handle empty document list', () => {
      retriever.buildIndex([]);
      expect(retriever.documentCount).toBe(0);
    });

    it('should calculate average document length', () => {
      const docs = [
        createBM25Document('1', 'one two three'), // 3 tokens
        createBM25Document('2', 'four five six seven eight'), // 5 tokens
      ];

      retriever.buildIndex(docs);

      expect(retriever.averageDocumentLength).toBe(4); // (3 + 5) / 2
    });

    it('should rebuild index when called again', () => {
      retriever.buildIndex([createBM25Document('1', 'first')]);
      expect(retriever.documentCount).toBe(1);

      retriever.buildIndex([
        createBM25Document('2', 'second'),
        createBM25Document('3', 'third'),
      ]);
      expect(retriever.documentCount).toBe(2);
    });
  });

  describe('retrieve', () => {
    beforeEach(() => {
      const docs = [
        createBM25Document('1', 'PostgreSQL is a powerful database system'),
        createBM25Document('2', 'MySQL is a popular database'),
        createBM25Document('3', 'Redis is an in-memory data store'),
        createBM25Document('4', 'MongoDB is a NoSQL database'),
      ];
      retriever.buildIndex(docs);
    });

    it('should throw if index not built', async () => {
      const freshRetriever = new BM25Retriever();
      await expect(freshRetriever.retrieve('query')).rejects.toThrow(
        RetrieverError
      );
    });

    it('should throw on empty query', async () => {
      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
      await expect(retriever.retrieve('   ')).rejects.toThrow(RetrieverError);
    });

    it('should return results for matching query', async () => {
      const results = await retriever.retrieve('database', { topK: 10 });

      expect(results.length).toBeGreaterThan(0);
      // All results should contain "database"
      for (const result of results) {
        expect(result.chunk.content.toLowerCase()).toContain('database');
      }
    });

    it('should return results sorted by score descending', async () => {
      const results = await retriever.retrieve('database', { topK: 10 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect topK parameter', async () => {
      const results = await retriever.retrieve('database', { topK: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should respect minScore parameter', async () => {
      const results = await retriever.retrieve('database', {
        topK: 10,
        minScore: 0.5,
      });

      for (const result of results) {
        expect(result.score).toBeGreaterThan(0.5);
      }
    });

    it('should return empty array for query with no matches', async () => {
      const results = await retriever.retrieve('xyz123nonexistent', { topK: 10 });
      expect(results).toEqual([]);
    });

    it('should rank exact matches higher', async () => {
      const results = await retriever.retrieve('PostgreSQL', { topK: 10 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('1'); // PostgreSQL document should be first
    });

    it('should normalize scores to 0-1 range', async () => {
      const results = await retriever.retrieve('database', { topK: 10 });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('IDF calculation', () => {
    beforeEach(() => {
      // Create documents where "common" appears in all, "rare" appears in one
      const docs = [
        createBM25Document('1', 'common word rare'),
        createBM25Document('2', 'common word'),
        createBM25Document('3', 'common word'),
      ];
      retriever.buildIndex(docs);
    });

    it('should give higher IDF to rare terms', () => {
      const commonIdf = retriever.getIDF('common');
      const rareIdf = retriever.getIDF('rare');

      expect(rareIdf).toBeDefined();
      expect(commonIdf).toBeDefined();
      expect(rareIdf!).toBeGreaterThan(commonIdf!);
    });

    it('should return undefined for unknown terms', () => {
      expect(retriever.getIDF('nonexistent')).toBeUndefined();
    });
  });

  describe('hasTerm', () => {
    beforeEach(() => {
      retriever.buildIndex([
        createBM25Document('1', 'hello world'),
      ]);
    });

    it('should return true for indexed terms', () => {
      expect(retriever.hasTerm('hello')).toBe(true);
      expect(retriever.hasTerm('world')).toBe(true);
    });

    it('should return false for non-indexed terms', () => {
      expect(retriever.hasTerm('nonexistent')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(retriever.hasTerm('HELLO')).toBe(true);
      expect(retriever.hasTerm('World')).toBe(true);
    });
  });

  describe('custom tokenizer', () => {
    it('should use custom tokenizer when provided', async () => {
      // Custom tokenizer that splits on hyphens
      const customRetriever = new BM25Retriever({
        tokenizer: (text) => text.toLowerCase().split('-').filter(Boolean),
      });

      customRetriever.buildIndex([
        createBM25Document('1', 'hello-world-test'),
        createBM25Document('2', 'foo-bar'),
      ]);

      expect(customRetriever.hasTerm('hello')).toBe(true);
      expect(customRetriever.hasTerm('world')).toBe(true);

      const results = await customRetriever.retrieve('hello', { topK: 10 });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('1');
    });
  });

  describe('document frequency filtering', () => {
    it('should filter terms by minDocFreq', () => {
      const r = new BM25Retriever({ minDocFreq: 2 });

      r.buildIndex([
        createBM25Document('1', 'common rare1'),
        createBM25Document('2', 'common rare2'),
      ]);

      // "common" appears in 2 docs (passes minDocFreq)
      expect(r.hasTerm('common')).toBe(true);
      // "rare1" and "rare2" appear in 1 doc each (filtered out)
      expect(r.hasTerm('rare1')).toBe(false);
      expect(r.hasTerm('rare2')).toBe(false);
    });

    it('should filter terms by maxDocFreqRatio', () => {
      const r = new BM25Retriever({ maxDocFreqRatio: 0.5 });

      r.buildIndex([
        createBM25Document('1', 'common rare'),
        createBM25Document('2', 'common'),
        createBM25Document('3', 'common'),
        createBM25Document('4', 'common'),
      ]);

      // "common" appears in 100% of docs (filtered out at 50% threshold)
      expect(r.hasTerm('common')).toBe(false);
      // "rare" appears in 25% of docs (passes threshold)
      expect(r.hasTerm('rare')).toBe(true);
    });
  });
});
