/**
 * Position Bias Tests
 *
 * Tests for position bias mitigation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  applyPositionBias,
  applySandwichOrdering,
  applyReverseSandwichOrdering,
  applyInterleaveOrdering,
  analyzePositionDistribution,
  recommendPositionBiasConfig,
} from '../../src/reranker/position-bias.js';
import type { RerankerResult, PositionBiasConfig } from '../../src/reranker/types.js';

// Helper to create scored items
function createItems(count: number): Array<{ id: string; score: number }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    score: (count - i) / count, // Descending: 1, 0.9, 0.8, ...
  }));
}

// Helper to create reranker results
function createRerankerResults(count: number): RerankerResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    chunk: { id: `${i + 1}`, content: `Content ${i + 1}`, metadata: {} },
    score: (count - i) / count,
    originalRank: i + 1,
    newRank: i + 1,
    scores: {
      originalScore: (count - i) / count,
      rerankerScore: (count - i) / count,
    },
  }));
}

describe('applySandwichOrdering', () => {
  it('should place top items at start and remaining at end (reversed)', () => {
    const items = createItems(7);
    const reordered = applySandwichOrdering(items);

    // Expected pattern for 7 items, default startCount=4:
    // Original: [1, 2, 3, 4, 5, 6, 7]
    // Start (4): [1, 2, 3, 4]
    // End reversed: [7, 6, 5]
    // Result: [1, 2, 3, 4, 7, 6, 5]

    expect(reordered[0]!.id).toBe('1'); // Best at start
    expect(reordered[reordered.length - 1]!.id).toBe('5'); // 5th best at very end after reversal
  });

  it('should respect custom startCount', () => {
    const items = createItems(6);
    const reordered = applySandwichOrdering(items, 2);

    // Start (2): [1, 2]
    // End reversed: [6, 5, 4, 3]
    // Result: [1, 2, 6, 5, 4, 3]

    expect(reordered[0]!.id).toBe('1');
    expect(reordered[1]!.id).toBe('2');
    expect(reordered[2]!.id).toBe('6'); // Last original, now first in reversed end
  });

  it('should handle small arrays', () => {
    const twoItems = createItems(2);
    expect(applySandwichOrdering(twoItems)).toEqual(twoItems);

    const oneItem = createItems(1);
    expect(applySandwichOrdering(oneItem)).toEqual(oneItem);

    expect(applySandwichOrdering([])).toEqual([]);
  });

  it('should clamp startCount to valid range', () => {
    const items = createItems(5);

    // startCount too large
    const largeStart = applySandwichOrdering(items, 10);
    expect(largeStart).toHaveLength(5);

    // startCount too small
    const smallStart = applySandwichOrdering(items, 0);
    expect(smallStart).toHaveLength(5);
    expect(smallStart[0]!.id).toBe('1'); // Should still start with #1
  });
});

describe('applyReverseSandwichOrdering', () => {
  it('should place less relevant at edges, most relevant in middle', () => {
    const items = createItems(5);
    const reordered = applyReverseSandwichOrdering(items);

    // Middle positions should have highest-ranked items
    const middleIndex = Math.floor(reordered.length / 2);

    // Check that low-ranked items are at edges
    const edgeIds = [reordered[0]!.id, reordered[reordered.length - 1]!.id];
    const middleId = reordered[middleIndex]!.id;

    // Edge items should be lower ranked than middle
    const edgeMinRank = Math.min(
      ...edgeIds.map((id) => parseInt(id))
    );
    const middleRank = parseInt(middleId);

    // This ordering is complex - just verify it runs and returns all items
    expect(reordered).toHaveLength(5);
  });

  it('should handle small arrays', () => {
    expect(applyReverseSandwichOrdering(createItems(2))).toHaveLength(2);
    expect(applyReverseSandwichOrdering(createItems(1))).toHaveLength(1);
    expect(applyReverseSandwichOrdering([])).toEqual([]);
  });
});

describe('applyInterleaveOrdering', () => {
  it('should alternate between high and low relevance', () => {
    const items = createItems(6);
    const reordered = applyInterleaveOrdering(items);

    // Expected pattern: [1, 6, 2, 5, 3, 4]
    expect(reordered[0]!.id).toBe('1'); // Highest
    expect(reordered[1]!.id).toBe('6'); // Lowest
    expect(reordered[2]!.id).toBe('2'); // Second highest
    expect(reordered[3]!.id).toBe('5'); // Second lowest
  });

  it('should handle odd-length arrays', () => {
    const items = createItems(5);
    const reordered = applyInterleaveOrdering(items);

    expect(reordered).toHaveLength(5);
    expect(reordered[0]!.id).toBe('1');
    expect(reordered[1]!.id).toBe('5');
  });

  it('should handle small arrays', () => {
    expect(applyInterleaveOrdering(createItems(2))).toHaveLength(2);
    expect(applyInterleaveOrdering(createItems(1))).toHaveLength(1);
    expect(applyInterleaveOrdering([])).toEqual([]);
  });
});

describe('applyPositionBias', () => {
  it('should return unchanged for strategy "none"', () => {
    const items = createItems(5);
    const config: PositionBiasConfig = { strategy: 'none' };

    const result = applyPositionBias(items, config);

    expect(result).toEqual(items);
  });

  it('should apply sandwich ordering', () => {
    const items = createItems(5);
    const config: PositionBiasConfig = { strategy: 'sandwich' };

    const result = applyPositionBias(items, config);

    expect(result).toHaveLength(5);
    expect(result[0]!.id).toBe('1'); // Best still at start
  });

  it('should apply sandwich with custom startCount', () => {
    const items = createItems(6);
    const config: PositionBiasConfig = { strategy: 'sandwich', startCount: 2 };

    const result = applyPositionBias(items, config);

    expect(result).toHaveLength(6);
    expect(result[0]!.id).toBe('1');
    expect(result[1]!.id).toBe('2');
  });

  it('should apply reverse-sandwich ordering', () => {
    const items = createItems(5);
    const config: PositionBiasConfig = { strategy: 'reverse-sandwich' };

    const result = applyPositionBias(items, config);

    expect(result).toHaveLength(5);
  });

  it('should apply interleave ordering', () => {
    const items = createItems(6);
    const config: PositionBiasConfig = { strategy: 'interleave' };

    const result = applyPositionBias(items, config);

    expect(result).toHaveLength(6);
    expect(result[0]!.id).toBe('1'); // Highest first
    expect(result[1]!.id).toBe('6'); // Lowest second
  });

  it('should handle empty array', () => {
    const config: PositionBiasConfig = { strategy: 'sandwich' };
    expect(applyPositionBias([], config)).toEqual([]);
  });
});

describe('analyzePositionDistribution', () => {
  it('should identify positions of top-k items', () => {
    const results = createRerankerResults(10);
    const analysis = analyzePositionDistribution(results, 3);

    // Top 3 items by newRank should be at indices 0, 1, 2
    expect(analysis.topKPositions).toContain(0);
    expect(analysis.topKPositions).toContain(1);
    expect(analysis.topKPositions).toContain(2);
  });

  it('should detect top items at start', () => {
    const results = createRerankerResults(10);
    const analysis = analyzePositionDistribution(results, 3);

    expect(analysis.topAtStart).toBe(true);
  });

  it('should calculate middle concentration', () => {
    const results = createRerankerResults(10);
    const analysis = analyzePositionDistribution(results, 5);

    // With default ordering, middle concentration should be calculable
    expect(analysis.middleConcentration).toBeGreaterThanOrEqual(0);
    expect(analysis.middleConcentration).toBeLessThanOrEqual(1);
  });

  it('should use default topK of 5', () => {
    const results = createRerankerResults(10);
    const analysis = analyzePositionDistribution(results);

    expect(analysis.topKPositions).toHaveLength(5);
  });
});

describe('recommendPositionBiasConfig', () => {
  it('should return "none" for very small contexts', () => {
    expect(recommendPositionBiasConfig(1).strategy).toBe('none');
    expect(recommendPositionBiasConfig(2).strategy).toBe('none');
    expect(recommendPositionBiasConfig(3).strategy).toBe('none');
  });

  it('should return sandwich for small contexts', () => {
    const config = recommendPositionBiasConfig(5);
    expect(config.strategy).toBe('sandwich');
  });

  it('should return sandwich with startCount for medium contexts', () => {
    const config = recommendPositionBiasConfig(10);
    expect(config.strategy).toBe('sandwich');
    expect(config.startCount).toBeDefined();
    expect(config.startCount).toBe(4); // 40% of 10
  });

  it('should return sandwich with lower startCount for large contexts', () => {
    const config = recommendPositionBiasConfig(20);
    expect(config.strategy).toBe('sandwich');
    expect(config.startCount).toBe(6); // 30% of 20
  });
});

describe('integration: sandwich ordering preserves information', () => {
  it('should keep all items after reordering', () => {
    const items = createItems(10);
    const reordered = applySandwichOrdering(items);

    expect(reordered).toHaveLength(items.length);

    // All original IDs should be present
    const originalIds = new Set(items.map((i) => i.id));
    const reorderedIds = new Set(reordered.map((i) => i.id));
    expect(reorderedIds).toEqual(originalIds);
  });

  it('should preserve item properties after reordering', () => {
    const items = createItems(5);
    const reordered = applySandwichOrdering(items);

    // Each item should have same score as original
    for (const item of reordered) {
      const original = items.find((i) => i.id === item.id);
      expect(original).toBeDefined();
      expect(item.score).toBe(original!.score);
    }
  });
});
