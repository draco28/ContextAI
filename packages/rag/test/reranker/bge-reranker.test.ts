/**
 * BGE Reranker Tests
 *
 * Unit tests for the BGE cross-encoder reranker.
 * Note: These tests mock Transformers.js to avoid downloading models.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RetrievalResult } from '../../src/retrieval/types.js';
import { BGEReranker } from '../../src/reranker/bge-reranker.js';
import { RerankerError } from '../../src/reranker/errors.js';

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
}));

// Helper to create mock retrieval results
function createMockResults(count: number): RetrievalResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    chunk: {
      id: `chunk-${i}`,
      content: `Content for document ${i}. This discusses topic ${i}.`,
      metadata: { source: `source-${i}` },
    },
    score: (count - i) / count,
  }));
}

describe('BGEReranker', () => {
  let mockPipeline: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Setup mock pipeline
    mockPipeline = vi.fn();

    const { pipeline } = await import('@xenova/transformers');
    (pipeline as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      // Return a function that simulates the pipeline behavior
      return async (text: string, options?: { text_pair?: string }) => {
        // Generate deterministic scores based on content similarity
        const query = text.toLowerCase();
        const doc = options?.text_pair?.toLowerCase() ?? '';

        // Simple mock scoring: count word overlap
        const queryWords = new Set(query.split(/\s+/));
        const docWords = new Set(doc.split(/\s+/));
        const overlap = [...queryWords].filter((w) => docWords.has(w)).length;
        const score = overlap / Math.max(queryWords.size, 1) - 0.5; // Raw score ~-0.5 to 0.5

        return [{ label: 'LABEL_0', score }];
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const reranker = new BGEReranker();

      expect(reranker.name).toBe('BGEReranker');
      expect(reranker.isLoaded()).toBe(false);
    });

    it('should accept custom name', () => {
      const reranker = new BGEReranker({ name: 'CustomBGE' });
      expect(reranker.name).toBe('CustomBGE');
    });

    it('should accept custom model name', async () => {
      const { pipeline } = await import('@xenova/transformers');

      const reranker = new BGEReranker({
        modelName: 'Xenova/bge-reranker-large',
      });

      const results = createMockResults(1);
      await reranker.rerank('query', results);

      expect(pipeline).toHaveBeenCalledWith(
        'text-classification',
        'Xenova/bge-reranker-large',
        expect.any(Object)
      );
    });
  });

  describe('lazy loading', () => {
    it('should not load model until first rerank', async () => {
      const { pipeline } = await import('@xenova/transformers');

      const reranker = new BGEReranker();

      expect(pipeline).not.toHaveBeenCalled();
      expect(reranker.isLoaded()).toBe(false);

      const results = createMockResults(1);
      await reranker.rerank('test query', results);

      expect(pipeline).toHaveBeenCalled();
    });

    it('should cache pipeline after first load', async () => {
      const { pipeline } = await import('@xenova/transformers');

      const reranker = new BGEReranker();
      const results = createMockResults(1);

      await reranker.rerank('query 1', results);
      await reranker.rerank('query 2', results);
      await reranker.rerank('query 3', results);

      // Pipeline should only be created once
      expect(pipeline).toHaveBeenCalledTimes(1);
    });

    it('should allow pre-warming', async () => {
      const { pipeline } = await import('@xenova/transformers');

      const reranker = new BGEReranker();

      expect(reranker.isLoaded()).toBe(false);

      await reranker.warmup();

      expect(reranker.isLoaded()).toBe(true);
      expect(pipeline).toHaveBeenCalled();
    });
  });

  describe('reranking', () => {
    it('should rerank results', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(3);

      const reranked = await reranker.rerank('document topic', results);

      expect(reranked).toHaveLength(3);
      expect(reranked[0]!.id).toBeDefined();
      expect(reranked[0]!.score).toBeGreaterThanOrEqual(0);
      expect(reranked[0]!.score).toBeLessThanOrEqual(1);
    });

    it('should sort by cross-encoder score', async () => {
      const reranker = new BGEReranker();

      const results: RetrievalResult[] = [
        {
          id: 'low',
          chunk: { id: 'low', content: 'Completely unrelated content', metadata: {} },
          score: 0.9,
        },
        {
          id: 'high',
          chunk: { id: 'high', content: 'This discusses the query topic directly', metadata: {} },
          score: 0.5,
        },
      ];

      const reranked = await reranker.rerank('query topic', results);

      // Despite lower original score, 'high' should rank first
      // because it has more word overlap with query
      expect(reranked[0]!.id).toBe('high');
    });

    it('should include score breakdown', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(2);

      const reranked = await reranker.rerank('test query', results);

      reranked.forEach((r) => {
        expect(r.scores).toBeDefined();
        expect(r.scores.originalScore).toBeDefined();
        expect(r.scores.rerankerScore).toBeDefined();
      });
    });

    it('should track rank changes', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(5);

      const reranked = await reranker.rerank('document 4 topic', results);

      reranked.forEach((r) => {
        expect(r.originalRank).toBeGreaterThan(0);
        expect(r.newRank).toBeGreaterThan(0);
      });
    });
  });

  describe('score normalization', () => {
    it('should normalize scores using sigmoid', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(3);

      const reranked = await reranker.rerank('test', results);

      // All scores should be in 0-1 range (sigmoid output)
      reranked.forEach((r) => {
        expect(r.score).toBeGreaterThan(0);
        expect(r.score).toBeLessThan(1);
      });
    });

    it('should preserve relative ordering after normalization', async () => {
      const reranker = new BGEReranker();

      const results: RetrievalResult[] = [
        {
          id: 'best',
          chunk: { id: 'best', content: 'query query query', metadata: {} },
          score: 0.5,
        },
        {
          id: 'mid',
          chunk: { id: 'mid', content: 'query other', metadata: {} },
          score: 0.5,
        },
        {
          id: 'low',
          chunk: { id: 'low', content: 'unrelated', metadata: {} },
          score: 0.5,
        },
      ];

      const reranked = await reranker.rerank('query', results);

      // Best should have highest score
      expect(reranked[0]!.id).toBe('best');
    });
  });

  describe('options', () => {
    it('should respect topK option', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(10);

      const reranked = await reranker.rerank('query', results, { topK: 3 });

      expect(reranked).toHaveLength(3);
    });

    it('should respect minScore option', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(5);

      const reranked = await reranker.rerank('query', results, { minScore: 0.6 });

      // Only results with sigmoid score >= 0.6 should pass
      reranked.forEach((r) => {
        expect(r.score).toBeGreaterThanOrEqual(0.6);
      });
    });
  });

  describe('error handling', () => {
    it('should throw RerankerError on model load failure', async () => {
      const { pipeline } = await import('@xenova/transformers');
      (pipeline as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Model not found')
      );

      const reranker = new BGEReranker();
      const results = createMockResults(1);

      await expect(reranker.rerank('query', results)).rejects.toThrow(RerankerError);
      await expect(reranker.rerank('query', results)).rejects.toThrow('Model not found');
    });

    it('should throw RerankerError on scoring failure', async () => {
      const { pipeline } = await import('@xenova/transformers');
      (pipeline as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        return async () => {
          throw new Error('Inference failed');
        };
      });

      const reranker = new BGEReranker();
      const results = createMockResults(1);

      await expect(reranker.rerank('query', results)).rejects.toThrow(RerankerError);
    });

    it('should handle empty results', async () => {
      const reranker = new BGEReranker();
      const reranked = await reranker.rerank('query', []);

      expect(reranked).toEqual([]);
    });

    it('should throw on invalid query', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(1);

      await expect(reranker.rerank('', results)).rejects.toThrow(RerankerError);
    });
  });

  describe('concurrent loading prevention', () => {
    it('should not load model multiple times on concurrent calls', async () => {
      const { pipeline } = await import('@xenova/transformers');

      let loadCount = 0;
      (pipeline as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        loadCount++;
        // Simulate slow model loading
        await new Promise((resolve) => setTimeout(resolve, 10));
        return async () => [{ label: 'LABEL_0', score: 0.5 }];
      });

      const reranker = new BGEReranker();
      const results = createMockResults(1);

      // Fire multiple concurrent rerank calls
      await Promise.all([
        reranker.rerank('query 1', results),
        reranker.rerank('query 2', results),
        reranker.rerank('query 3', results),
      ]);

      // Model should only be loaded once despite concurrent calls
      expect(loadCount).toBe(1);
    });
  });

  describe('this binding', () => {
    it('should preserve this binding when rerank is passed as callback', async () => {
      const reranker = new BGEReranker();
      const results = createMockResults(2);

      // Simulate passing method as callback
      const rerankFn = reranker.rerank;
      const reranked = await rerankFn('query', results);

      expect(reranked).toHaveLength(2);
    });

    it('should preserve this binding when warmup is passed as callback', async () => {
      const reranker = new BGEReranker();

      const warmupFn = reranker.warmup;
      await warmupFn();

      expect(reranker.isLoaded()).toBe(true);
    });
  });
});
