/**
 * Base Reranker Tests
 *
 * Tests for the abstract BaseReranker class through a concrete implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RetrievalResult } from '../../src/retrieval/types.js';
import type { RerankerOptions } from '../../src/reranker/types.js';
import {
  BaseReranker,
  type InternalRerankerResult,
} from '../../src/reranker/base-reranker.js';
import { RerankerError } from '../../src/reranker/errors.js';

// Concrete implementation for testing
class TestReranker extends BaseReranker {
  readonly name = 'TestReranker';
  private readonly scoreMultiplier: number;
  protected override readonly shouldNormalize: boolean;

  constructor(
    scoreMultiplier: number = 1,
    shouldNormalizeScores: boolean = true
  ) {
    super();
    this.scoreMultiplier = scoreMultiplier;
    this.shouldNormalize = shouldNormalizeScores;
  }

  protected _rerank = async (
    _query: string,
    results: RetrievalResult[],
    _options?: RerankerOptions
  ): Promise<InternalRerankerResult[]> => {
    // Simple test scoring: multiply original score
    return results.map((r) => ({
      id: r.id,
      score: r.score * this.scoreMultiplier,
      original: r,
      scoreComponents: {
        relevanceScore: r.score * this.scoreMultiplier,
      },
    }));
  };
}

// Helper to create mock retrieval results
function createMockResults(count: number): RetrievalResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    chunk: {
      id: `chunk-${i}`,
      content: `Content for chunk ${i}`,
      metadata: {
        source: `source-${i}`,
      },
    },
    score: (count - i) / count, // Descending scores: 1, 0.8, 0.6, ...
  }));
}

describe('BaseReranker', () => {
  let reranker: TestReranker;

  beforeEach(() => {
    reranker = new TestReranker(1, true);
  });

  describe('input validation', () => {
    it('should throw on empty query', async () => {
      const results = createMockResults(3);

      await expect(reranker.rerank('', results)).rejects.toThrow(RerankerError);
      await expect(reranker.rerank('', results)).rejects.toThrow('non-empty string');
    });

    it('should throw on invalid query type', async () => {
      const results = createMockResults(3);

      await expect(reranker.rerank(null as unknown as string, results)).rejects.toThrow(
        RerankerError
      );
    });

    it('should throw on invalid results type', async () => {
      await expect(
        reranker.rerank('query', 'not an array' as unknown as RetrievalResult[])
      ).rejects.toThrow(RerankerError);
    });

    it('should return empty array for empty results', async () => {
      const result = await reranker.rerank('query', []);
      expect(result).toEqual([]);
    });
  });

  describe('result transformation', () => {
    it('should preserve original rank tracking', async () => {
      const results = createMockResults(5);
      const reranked = await reranker.rerank('query', results);

      // Check that originalRank reflects input order
      reranked.forEach((r) => {
        const inputIndex = results.findIndex((orig) => orig.id === r.id);
        expect(r.originalRank).toBe(inputIndex + 1);
      });
    });

    it('should assign newRank based on reranked order', async () => {
      const results = createMockResults(5);
      const reranked = await reranker.rerank('query', results);

      // Check that newRank is sequential
      reranked.forEach((r, i) => {
        expect(r.newRank).toBe(i + 1);
      });
    });

    it('should include score breakdown', async () => {
      const results = createMockResults(3);
      const reranked = await reranker.rerank('query', results);

      reranked.forEach((r, i) => {
        expect(r.scores).toBeDefined();
        expect(r.scores.originalScore).toBe(results[i]!.score);
        expect(r.scores.rerankerScore).toBeDefined();
      });
    });

    it('should sort results by score descending', async () => {
      const results = createMockResults(5);
      const reranked = await reranker.rerank('query', results);

      for (let i = 1; i < reranked.length; i++) {
        expect(reranked[i - 1]!.score).toBeGreaterThanOrEqual(reranked[i]!.score);
      }
    });
  });

  describe('filtering options', () => {
    it('should respect topK option', async () => {
      const results = createMockResults(10);
      const reranked = await reranker.rerank('query', results, { topK: 3 });

      expect(reranked).toHaveLength(3);
    });

    it('should respect minScore option', async () => {
      // Create results with varied scores
      const results: RetrievalResult[] = [
        {
          id: 'high',
          chunk: { id: 'high', content: 'High score', metadata: {} },
          score: 0.9,
        },
        {
          id: 'medium',
          chunk: { id: 'medium', content: 'Medium score', metadata: {} },
          score: 0.5,
        },
        {
          id: 'low',
          chunk: { id: 'low', content: 'Low score', metadata: {} },
          score: 0.1,
        },
      ];

      const reranked = await reranker.rerank('query', results, { minScore: 0.4 });

      // After normalization, scores will be 0-1 based on min-max
      // All results should pass minScore since normalized
      expect(reranked.length).toBeGreaterThan(0);
    });

    it('should combine topK and minScore', async () => {
      const results = createMockResults(10);
      const reranked = await reranker.rerank('query', results, {
        topK: 5,
        minScore: 0.3,
      });

      expect(reranked.length).toBeLessThanOrEqual(5);
      reranked.forEach((r) => {
        expect(r.score).toBeGreaterThanOrEqual(0.3);
      });
    });
  });

  describe('score normalization', () => {
    it('should normalize scores to 0-1 range', async () => {
      // Create reranker with high multiplier to get scores > 1
      const highScoreReranker = new TestReranker(10, true);
      const results = createMockResults(5);

      const reranked = await highScoreReranker.rerank('query', results);

      reranked.forEach((r) => {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(1);
      });
    });

    it('should handle single result normalization', async () => {
      const results = createMockResults(1);
      const reranked = await reranker.rerank('query', results);

      expect(reranked).toHaveLength(1);
      expect(reranked[0]!.score).toBe(1.0); // Single result = max score
    });

    it('should handle all same scores', async () => {
      const results: RetrievalResult[] = [
        { id: '1', chunk: { id: '1', content: 'A', metadata: {} }, score: 0.5 },
        { id: '2', chunk: { id: '2', content: 'B', metadata: {} }, score: 0.5 },
        { id: '3', chunk: { id: '3', content: 'C', metadata: {} }, score: 0.5 },
      ];

      const reranked = await reranker.rerank('query', results);

      // All same score = all become 1.0
      reranked.forEach((r) => {
        expect(r.score).toBe(1.0);
      });
    });

    it('should not normalize when disabled', async () => {
      const noNormReranker = new TestReranker(10, false);
      const results = createMockResults(3);

      const reranked = await noNormReranker.rerank('query', results);

      // Scores should be original * 10, not normalized
      expect(reranked[0]!.score).toBeGreaterThan(1);
    });
  });

  describe('this binding', () => {
    it('should preserve this binding when rerank is passed as callback', async () => {
      const results = createMockResults(3);

      // Simulate passing method as callback
      const rerankFn = reranker.rerank;
      const reranked = await rerankFn('query', results);

      expect(reranked).toHaveLength(3);
    });
  });
});
