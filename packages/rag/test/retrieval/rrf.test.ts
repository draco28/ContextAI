import { describe, it, expect } from 'vitest';
import {
  reciprocalRankFusion,
  rrfScore,
  maxRRFScore,
  normalizeRRFScores,
  DEFAULT_RRF_K,
  type RankingList,
} from '../../src/index.js';
import type { Chunk } from '../../src/vector-store/types.js';
import type { RankedItem, RRFResult } from '../../src/retrieval/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createChunk(id: string): Chunk {
  return {
    id,
    content: `Content for ${id}`,
    metadata: {},
  };
}

function createRankedItem(id: string, rank: number, score: number): RankedItem {
  return {
    id,
    rank,
    score,
    chunk: createChunk(id),
  };
}

// ============================================================================
// RRF Tests
// ============================================================================

describe('Reciprocal Rank Fusion (RRF)', () => {
  describe('rrfScore', () => {
    it('should calculate RRF score correctly', () => {
      // For rank 1 with k=60: 1/(60+1) = 0.01639...
      expect(rrfScore(1, 60)).toBeCloseTo(1 / 61, 5);
      expect(rrfScore(10, 60)).toBeCloseTo(1 / 70, 5);
      expect(rrfScore(100, 60)).toBeCloseTo(1 / 160, 5);
    });

    it('should use default k=60', () => {
      expect(rrfScore(1)).toBeCloseTo(1 / 61, 5);
    });

    it('should show diminishing returns for higher ranks', () => {
      const rank1 = rrfScore(1);
      const rank2 = rrfScore(2);
      const rank10 = rrfScore(10);
      const rank100 = rrfScore(100);

      // Rank 1 should be highest
      expect(rank1).toBeGreaterThan(rank2);
      expect(rank2).toBeGreaterThan(rank10);
      expect(rank10).toBeGreaterThan(rank100);

      // But the differences should decrease
      const diff1_2 = rank1 - rank2;
      const diff10_11 = rrfScore(10) - rrfScore(11);
      expect(diff1_2).toBeGreaterThan(diff10_11);
    });
  });

  describe('maxRRFScore', () => {
    it('should calculate max score for N rankers', () => {
      // Max score = N * 1/(k+1) when ranked #1 in all lists
      expect(maxRRFScore(1, 60)).toBeCloseTo(1 / 61, 5);
      expect(maxRRFScore(2, 60)).toBeCloseTo(2 / 61, 5);
      expect(maxRRFScore(3, 60)).toBeCloseTo(3 / 61, 5);
    });
  });

  describe('DEFAULT_RRF_K', () => {
    it('should be 60 (standard value)', () => {
      expect(DEFAULT_RRF_K).toBe(60);
    });
  });

  describe('reciprocalRankFusion', () => {
    it('should return empty array for no rankings', () => {
      const result = reciprocalRankFusion([]);
      expect(result).toEqual([]);
    });

    it('should handle single ranking list', () => {
      const ranking: RankingList = {
        name: 'dense',
        items: [
          createRankedItem('a', 1, 0.9),
          createRankedItem('b', 2, 0.8),
        ],
      };

      const result = reciprocalRankFusion([ranking]);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
      expect(result[0].score).toBeCloseTo(rrfScore(1), 5);
      expect(result[1].score).toBeCloseTo(rrfScore(2), 5);
    });

    it('should fuse two ranking lists', () => {
      const dense: RankingList = {
        name: 'dense',
        items: [
          createRankedItem('a', 1, 0.9),
          createRankedItem('b', 2, 0.8),
        ],
      };

      const sparse: RankingList = {
        name: 'sparse',
        items: [
          createRankedItem('b', 1, 0.95),
          createRankedItem('c', 2, 0.7),
        ],
      };

      const result = reciprocalRankFusion([dense, sparse]);

      // 'b' appears in both lists, should have highest score
      expect(result[0].id).toBe('b');
      // Score for 'b' = 1/(60+2) + 1/(60+1) = dense rank 2 + sparse rank 1
      const expectedBScore = rrfScore(2) + rrfScore(1);
      expect(result[0].score).toBeCloseTo(expectedBScore, 5);
    });

    it('should include contributions from each ranker', () => {
      const dense: RankingList = {
        name: 'dense',
        items: [createRankedItem('a', 1, 0.9)],
      };

      const sparse: RankingList = {
        name: 'sparse',
        items: [createRankedItem('a', 3, 0.7)],
      };

      const result = reciprocalRankFusion([dense, sparse]);

      expect(result[0].contributions.length).toBe(2);

      const denseContrib = result[0].contributions.find(c => c.name === 'dense');
      const sparseContrib = result[0].contributions.find(c => c.name === 'sparse');

      expect(denseContrib?.rank).toBe(1);
      expect(denseContrib?.score).toBe(0.9);
      expect(sparseContrib?.rank).toBe(3);
      expect(sparseContrib?.score).toBe(0.7);
    });

    it('should add zero-contribution entries for missing rankers', () => {
      const dense: RankingList = {
        name: 'dense',
        items: [createRankedItem('a', 1, 0.9)],
      };

      const sparse: RankingList = {
        name: 'sparse',
        items: [createRankedItem('b', 1, 0.8)],
      };

      const result = reciprocalRankFusion([dense, sparse]);

      // 'a' is only in dense
      const itemA = result.find(r => r.id === 'a')!;
      const sparseContribA = itemA.contributions.find(c => c.name === 'sparse');
      expect(sparseContribA?.rank).toBeUndefined();
      expect(sparseContribA?.score).toBeUndefined();
      expect(sparseContribA?.contribution).toBe(0);

      // 'b' is only in sparse
      const itemB = result.find(r => r.id === 'b')!;
      const denseContribB = itemB.contributions.find(c => c.name === 'dense');
      expect(denseContribB?.rank).toBeUndefined();
      expect(denseContribB?.contribution).toBe(0);
    });

    it('should sort by fused score descending', () => {
      const dense: RankingList = {
        name: 'dense',
        items: [
          createRankedItem('a', 1, 0.9),
          createRankedItem('b', 2, 0.8),
          createRankedItem('c', 3, 0.7),
        ],
      };

      const sparse: RankingList = {
        name: 'sparse',
        items: [
          createRankedItem('c', 1, 0.95), // c is ranked higher in sparse
          createRankedItem('b', 2, 0.85),
          createRankedItem('a', 3, 0.5),  // a is ranked lower in sparse
        ],
      };

      const result = reciprocalRankFusion([dense, sparse]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });

    it('should handle custom k parameter', () => {
      const ranking: RankingList = {
        name: 'test',
        items: [createRankedItem('a', 1, 0.9)],
      };

      const withK60 = reciprocalRankFusion([ranking], 60);
      const withK10 = reciprocalRankFusion([ranking], 10);

      // Smaller k means higher scores (and more weight to top ranks)
      expect(withK10[0].score).toBeGreaterThan(withK60[0].score);
    });
  });

  describe('normalizeRRFScores', () => {
    it('should normalize scores to 0-1 range', () => {
      const results: RRFResult[] = [
        {
          id: 'a',
          score: rrfScore(1) * 2, // Max possible for 2 rankers (rank 1 in both)
          chunk: createChunk('a'),
          contributions: [],
        },
        {
          id: 'b',
          score: rrfScore(1) + rrfScore(10), // Rank 1 + rank 10
          chunk: createChunk('b'),
          contributions: [],
        },
      ];

      const normalized = normalizeRRFScores(results, 2);

      // Item 'a' with max score should be close to 1.0
      expect(normalized[0].score).toBeCloseTo(1.0, 5);
      // Item 'b' should be less than 1.0
      expect(normalized[1].score).toBeLessThan(1.0);
      expect(normalized[1].score).toBeGreaterThan(0);
    });

    it('should preserve relative ordering', () => {
      const results: RRFResult[] = [
        { id: 'a', score: 0.03, chunk: createChunk('a'), contributions: [] },
        { id: 'b', score: 0.02, chunk: createChunk('b'), contributions: [] },
        { id: 'c', score: 0.01, chunk: createChunk('c'), contributions: [] },
      ];

      const normalized = normalizeRRFScores(results, 2);

      expect(normalized[0].score).toBeGreaterThan(normalized[1].score);
      expect(normalized[1].score).toBeGreaterThan(normalized[2].score);
    });
  });
});
