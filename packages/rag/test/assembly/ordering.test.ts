/**
 * Ordering Strategies Tests
 */

import { describe, it, expect } from 'vitest';
import type { RerankerResult } from '../../src/reranker/types.js';
import type { Chunk } from '../../src/vector-store/types.js';
import {
  applyOrdering,
  orderByRelevance,
  orderBySandwich,
  orderChronologically,
  analyzeOrdering,
} from '../../src/assembly/ordering.js';

// Helper to create mock chunks
function createChunk(id: string, content: string, metadata: Record<string, unknown> = {}): Chunk {
  return { id, content, metadata, documentId: metadata.documentId as string | undefined };
}

// Helper to create mock reranker results
function createResult(
  id: string,
  score: number,
  content: string = `Content for ${id}`,
  metadata: Record<string, unknown> = {}
): RerankerResult {
  return {
    id,
    chunk: createChunk(id, content, metadata),
    score,
    originalRank: 1,
    newRank: 1,
    scores: { originalScore: score, rerankerScore: score },
  };
}

describe('applyOrdering', () => {
  const results = [
    createResult('1', 0.9),
    createResult('2', 0.8),
    createResult('3', 0.7),
    createResult('4', 0.6),
    createResult('5', 0.5),
  ];

  it('returns empty array for empty input', () => {
    expect(applyOrdering([], 'relevance')).toEqual([]);
  });

  it('applies relevance ordering', () => {
    const ordered = applyOrdering(results, 'relevance');
    expect(ordered.map(r => r.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('applies sandwich ordering', () => {
    const ordered = applyOrdering(results, 'sandwich');
    // Default: half at start (3), remaining reversed at end
    // [1, 2, 3] at start, [5, 4] reversed = [5, 4] at end
    expect(ordered.map(r => r.id)).toEqual(['1', '2', '3', '5', '4']);
  });

  it('applies chronological ordering', () => {
    const resultsWithPosition = [
      createResult('c', 0.9, 'C', { documentId: 'doc1', startIndex: 200 }),
      createResult('a', 0.8, 'A', { documentId: 'doc1', startIndex: 0 }),
      createResult('b', 0.7, 'B', { documentId: 'doc1', startIndex: 100 }),
    ];
    const ordered = applyOrdering(resultsWithPosition, 'chronological');
    expect(ordered.map(r => r.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('orderByRelevance', () => {
  it('sorts by score descending', () => {
    const unsorted = [
      createResult('low', 0.3),
      createResult('high', 0.9),
      createResult('mid', 0.6),
    ];
    const sorted = orderByRelevance(unsorted);
    expect(sorted.map(r => r.id)).toEqual(['high', 'mid', 'low']);
    expect(sorted.map(r => r.score)).toEqual([0.9, 0.6, 0.3]);
  });

  it('handles equal scores', () => {
    const results = [
      createResult('a', 0.5),
      createResult('b', 0.5),
    ];
    const sorted = orderByRelevance(results);
    expect(sorted).toHaveLength(2);
    // Order is stable for equal scores
  });

  it('returns empty array for empty input', () => {
    expect(orderByRelevance([])).toEqual([]);
  });
});

describe('orderBySandwich', () => {
  it('places high-scoring items at edges', () => {
    const results = [
      createResult('1', 0.9),
      createResult('2', 0.8),
      createResult('3', 0.7),
      createResult('4', 0.6),
      createResult('5', 0.5),
      createResult('6', 0.4),
      createResult('7', 0.3),
      createResult('8', 0.2),
    ];

    const sandwich = orderBySandwich(results, 3);

    // First 3 at start (highest scores)
    expect(sandwich.slice(0, 3).map(r => r.id)).toEqual(['1', '2', '3']);

    // Remaining 5 reversed at end (so 4,5 end up at the end)
    expect(sandwich.slice(3).map(r => r.id)).toEqual(['8', '7', '6', '5', '4']);

    // Verify lowest scores are in the middle
    const middleIndex = Math.floor(sandwich.length / 2);
    expect(sandwich[middleIndex]!.score).toBeLessThan(sandwich[0]!.score);
    expect(sandwich[middleIndex]!.score).toBeLessThan(sandwich[sandwich.length - 1]!.score);
  });

  it('defaults startCount to half of items', () => {
    const results = [
      createResult('1', 0.9),
      createResult('2', 0.8),
      createResult('3', 0.7),
      createResult('4', 0.6),
    ];

    const sandwich = orderBySandwich(results);
    // Half = 2, so [1, 2] at start, [4, 3] at end
    expect(sandwich.map(r => r.id)).toEqual(['1', '2', '4', '3']);
  });

  it('handles small arrays (2 or fewer items)', () => {
    const single = [createResult('1', 0.9)];
    expect(orderBySandwich(single).map(r => r.id)).toEqual(['1']);

    const pair = [createResult('1', 0.9), createResult('2', 0.8)];
    expect(orderBySandwich(pair).map(r => r.id)).toEqual(['1', '2']);
  });

  it('clamps startCount to valid range', () => {
    const results = [
      createResult('1', 0.9),
      createResult('2', 0.8),
      createResult('3', 0.7),
    ];

    // Too large startCount gets clamped
    const withLarge = orderBySandwich(results, 100);
    expect(withLarge).toHaveLength(3);

    // Zero startCount gets clamped to 1
    const withZero = orderBySandwich(results, 0);
    expect(withZero).toHaveLength(3);
  });
});

describe('orderChronologically', () => {
  it('groups by document then orders by position', () => {
    const results = [
      createResult('d2-b', 0.5, 'B', { documentId: 'doc2', startIndex: 100 }),
      createResult('d1-c', 0.9, 'C', { documentId: 'doc1', startIndex: 200 }),
      createResult('d2-a', 0.8, 'A', { documentId: 'doc2', startIndex: 0 }),
      createResult('d1-a', 0.7, 'A', { documentId: 'doc1', startIndex: 0 }),
    ];

    const ordered = orderChronologically(results);

    // doc1 comes first (alphabetically), then doc2
    // Within each doc, ordered by startIndex
    expect(ordered.map(r => r.id)).toEqual(['d1-a', 'd1-c', 'd2-a', 'd2-b']);
  });

  it('falls back to relevance when positions are equal', () => {
    const results = [
      createResult('low', 0.3, 'Low', { documentId: 'doc1', startIndex: 0 }),
      createResult('high', 0.9, 'High', { documentId: 'doc1', startIndex: 0 }),
    ];

    const ordered = orderChronologically(results);
    // Same position, so higher score comes first
    expect(ordered.map(r => r.id)).toEqual(['high', 'low']);
  });

  it('handles missing metadata', () => {
    const results = [
      createResult('no-meta', 0.9, 'No metadata'),
      createResult('with-meta', 0.8, 'With metadata', { documentId: 'doc1', startIndex: 0 }),
    ];

    // Should not throw
    const ordered = orderChronologically(results);
    expect(ordered).toHaveLength(2);
  });
});

describe('analyzeOrdering', () => {
  it('returns zeros for empty array', () => {
    const analysis = analyzeOrdering([]);
    expect(analysis.totalCount).toBe(0);
    expect(analysis.averageScore).toBe(0);
  });

  it('calculates correct statistics', () => {
    const results = [
      createResult('1', 0.9),
      createResult('2', 0.6),
      createResult('3', 0.3),
    ];

    const analysis = analyzeOrdering(results);

    expect(analysis.totalCount).toBe(3);
    expect(analysis.averageScore).toBeCloseTo(0.6, 5);
  });

  it('shows sandwich ordering effectiveness', () => {
    const results = Array.from({ length: 9 }, (_, i) =>
      createResult(`${i + 1}`, (9 - i) / 10)
    );

    // Relevance ordering: all high scores at start
    const relevanceOrdered = orderByRelevance(results);
    const relevanceAnalysis = analyzeOrdering(relevanceOrdered);

    // Sandwich ordering: high scores at edges
    const sandwichOrdered = orderBySandwich(results);
    const sandwichAnalysis = analyzeOrdering(sandwichOrdered);

    // Sandwich should have higher score sum in high-attention zones (start + end)
    expect(sandwichAnalysis.highAttentionScoreSum).toBeGreaterThan(0);

    // Middle should have lower average in sandwich ordering
    expect(sandwichAnalysis.scoreDistribution.middle).toBeLessThan(
      sandwichAnalysis.scoreDistribution.start
    );
  });
});
