import { describe, it, expect, beforeEach } from 'vitest';
import { HNSWIndex } from '../../src/vector-store/hnsw-index.js';
import { euclideanDistance } from '../../src/embeddings/utils.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a random vector of given dimension.
 */
function randomVector(dimensions: number): number[] {
  return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}

/**
 * Generate a vector at a specific angle (for 2D testing).
 */
function vectorAtAngle(angle: number, magnitude: number = 1): number[] {
  return [Math.cos(angle) * magnitude, Math.sin(angle) * magnitude];
}

/**
 * Brute-force k-nearest neighbors for recall testing.
 */
function bruteForceKNN(
  query: number[],
  vectors: Map<string, number[]>,
  k: number
): string[] {
  const distances = Array.from(vectors.entries())
    .map(([id, vector]) => ({
      id,
      distance: euclideanDistance(query, vector),
    }))
    .sort((a, b) => a.distance - b.distance);

  return distances.slice(0, k).map((d) => d.id);
}

/**
 * Calculate recall@k: what percentage of true neighbors were found.
 */
function calculateRecall(found: string[], expected: string[]): number {
  const foundSet = new Set(found);
  let correct = 0;
  for (const id of expected) {
    if (foundSet.has(id)) {
      correct++;
    }
  }
  return correct / expected.length;
}

// ============================================================================
// HNSWIndex Tests
// ============================================================================

describe('HNSWIndex', () => {
  describe('construction', () => {
    it('should create index with default config', () => {
      const index = new HNSWIndex(128);
      expect(index.dimensions).toBe(128);
      expect(index.size()).toBe(0);

      const config = index.getConfig();
      expect(config.M).toBe(16);
      expect(config.efConstruction).toBe(200);
      expect(config.efSearch).toBe(100);
    });

    it('should create index with custom config', () => {
      const index = new HNSWIndex(64, {
        M: 32,
        efConstruction: 400,
        efSearch: 200,
      });

      const config = index.getConfig();
      expect(config.M).toBe(32);
      expect(config.efConstruction).toBe(400);
      expect(config.efSearch).toBe(200);
    });

    it('should throw for invalid dimensions', () => {
      expect(() => new HNSWIndex(0)).toThrow();
      expect(() => new HNSWIndex(-1)).toThrow();
    });
  });

  describe('insert', () => {
    let index: HNSWIndex;

    beforeEach(() => {
      index = new HNSWIndex(3);
    });

    it('should insert a single vector', () => {
      index.insert('vec-1', [1, 0, 0]);
      expect(index.size()).toBe(1);
      expect(index.has('vec-1')).toBe(true);
    });

    it('should insert multiple vectors', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);
      index.insert('vec-3', [0, 0, 1]);

      expect(index.size()).toBe(3);
      expect(index.has('vec-1')).toBe(true);
      expect(index.has('vec-2')).toBe(true);
      expect(index.has('vec-3')).toBe(true);
    });

    it('should update existing vector on re-insert', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-1', [0, 1, 0]); // Update

      expect(index.size()).toBe(1);

      // Search should find the updated vector
      const results = index.search([0, 1, 0], 1);
      expect(results[0]?.id).toBe('vec-1');
      expect(results[0]?.distance).toBeCloseTo(0, 5);
    });

    it('should throw for dimension mismatch', () => {
      expect(() => index.insert('vec-1', [1, 0])).toThrow('dimension mismatch');
      expect(() => index.insert('vec-1', [1, 0, 0, 0])).toThrow(
        'dimension mismatch'
      );
    });
  });

  describe('search', () => {
    let index: HNSWIndex;

    beforeEach(() => {
      index = new HNSWIndex(3);
    });

    it('should return empty for empty index', () => {
      const results = index.search([1, 0, 0], 5);
      expect(results).toEqual([]);
    });

    it('should find exact match', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);

      const results = index.search([1, 0, 0], 1);
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('vec-1');
      expect(results[0]?.distance).toBeCloseTo(0, 5);
    });

    it('should return results sorted by distance', () => {
      index.insert('far', [10, 0, 0]);
      index.insert('close', [1, 0, 0]);
      index.insert('medium', [5, 0, 0]);

      const results = index.search([0, 0, 0], 3);

      expect(results).toHaveLength(3);
      expect(results[0]?.id).toBe('close');
      expect(results[1]?.id).toBe('medium');
      expect(results[2]?.id).toBe('far');
    });

    it('should limit results to k', () => {
      for (let i = 0; i < 10; i++) {
        index.insert(`vec-${i}`, [i, 0, 0]);
      }

      const results = index.search([0, 0, 0], 3);
      expect(results).toHaveLength(3);
    });

    it('should return all when k > size', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);

      const results = index.search([0, 0, 0], 10);
      expect(results).toHaveLength(2);
    });

    it('should throw for dimension mismatch', () => {
      index.insert('vec-1', [1, 0, 0]);
      expect(() => index.search([1, 0], 1)).toThrow('dimension mismatch');
    });
  });

  describe('delete', () => {
    let index: HNSWIndex;

    beforeEach(() => {
      index = new HNSWIndex(3);
    });

    it('should delete existing vector', () => {
      index.insert('vec-1', [1, 0, 0]);
      expect(index.has('vec-1')).toBe(true);

      const deleted = index.delete('vec-1');
      expect(deleted).toBe(true);
      expect(index.has('vec-1')).toBe(false);
      expect(index.size()).toBe(0);
    });

    it('should return false for non-existent vector', () => {
      const deleted = index.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should not affect other vectors', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);
      index.insert('vec-3', [0, 0, 1]);

      index.delete('vec-2');

      expect(index.size()).toBe(2);
      expect(index.has('vec-1')).toBe(true);
      expect(index.has('vec-3')).toBe(true);
    });

    it('should still find neighbors after deletion', () => {
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);
      index.insert('vec-3', [0, 0, 1]);

      index.delete('vec-2');

      const results = index.search([0.5, 0.5, 0], 2);
      expect(results).toHaveLength(2);
      const ids = results.map((r) => r.id);
      expect(ids).toContain('vec-1');
      expect(ids).not.toContain('vec-2');
    });
  });

  describe('clear', () => {
    it('should remove all vectors', () => {
      const index = new HNSWIndex(3);

      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);
      index.insert('vec-3', [0, 0, 1]);

      expect(index.size()).toBe(3);

      index.clear();

      expect(index.size()).toBe(0);
      expect(index.has('vec-1')).toBe(false);
    });

    it('should allow inserts after clear', () => {
      const index = new HNSWIndex(3);

      index.insert('vec-1', [1, 0, 0]);
      index.clear();
      index.insert('vec-2', [0, 1, 0]);

      expect(index.size()).toBe(1);
      expect(index.has('vec-2')).toBe(true);
    });
  });

  describe('setEfSearch', () => {
    it('should update efSearch parameter', () => {
      const index = new HNSWIndex(3, { efSearch: 50 });
      expect(index.getConfig().efSearch).toBe(50);

      index.setEfSearch(200);
      expect(index.getConfig().efSearch).toBe(200);
    });
  });

  describe('recall accuracy', () => {
    it('should achieve >80% recall on random dataset (small)', () => {
      const dimensions = 32;
      const numVectors = 100;
      const k = 10;

      const index = new HNSWIndex(dimensions, {
        M: 16,
        efConstruction: 200,
        efSearch: 50,
      });

      // Insert random vectors
      const vectors = new Map<string, number[]>();
      for (let i = 0; i < numVectors; i++) {
        const vec = randomVector(dimensions);
        vectors.set(`vec-${i}`, vec);
        index.insert(`vec-${i}`, vec);
      }

      // Test recall on multiple queries
      const numQueries = 10;
      let totalRecall = 0;

      for (let q = 0; q < numQueries; q++) {
        const query = randomVector(dimensions);
        const expected = bruteForceKNN(query, vectors, k);
        const results = index.search(query, k);
        const found = results.map((r) => r.id);

        totalRecall += calculateRecall(found, expected);
      }

      const avgRecall = totalRecall / numQueries;
      // 80% recall is good for approximate search with speed benefits
      expect(avgRecall).toBeGreaterThanOrEqual(0.8);
    });

    it('should achieve >75% recall on random dataset (medium)', () => {
      const dimensions = 64;
      const numVectors = 1000;
      const k = 10;

      const index = new HNSWIndex(dimensions, {
        M: 16,
        efConstruction: 200,
        efSearch: 100,
      });

      // Insert random vectors
      const vectors = new Map<string, number[]>();
      for (let i = 0; i < numVectors; i++) {
        const vec = randomVector(dimensions);
        vectors.set(`vec-${i}`, vec);
        index.insert(`vec-${i}`, vec);
      }

      // Test recall on multiple queries
      const numQueries = 10;
      let totalRecall = 0;

      for (let q = 0; q < numQueries; q++) {
        const query = randomVector(dimensions);
        const expected = bruteForceKNN(query, vectors, k);
        const results = index.search(query, k);
        const found = results.map((r) => r.id);

        totalRecall += calculateRecall(found, expected);
      }

      const avgRecall = totalRecall / numQueries;
      // Recall varies with random data; 75%+ is good for ANN
      expect(avgRecall).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('edge cases', () => {
    it('should handle single element', () => {
      const index = new HNSWIndex(3);
      index.insert('only', [1, 2, 3]);

      const results = index.search([1, 2, 3], 5);
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('only');
    });

    it('should handle identical vectors', () => {
      const index = new HNSWIndex(3);
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [1, 0, 0]); // Same vector, different ID

      const results = index.search([1, 0, 0], 2);
      expect(results).toHaveLength(2);

      // Both should have ~0 distance
      expect(results[0]?.distance).toBeCloseTo(0, 5);
      expect(results[1]?.distance).toBeCloseTo(0, 5);
    });

    it('should handle high dimensional vectors', () => {
      const dimensions = 1536; // OpenAI ada-002 dimension
      const index = new HNSWIndex(dimensions);

      for (let i = 0; i < 50; i++) {
        index.insert(`vec-${i}`, randomVector(dimensions));
      }

      const results = index.search(randomVector(dimensions), 5);
      expect(results).toHaveLength(5);
    });

    it('should handle delete of entry point', () => {
      const index = new HNSWIndex(3);

      // Insert several vectors
      index.insert('vec-1', [1, 0, 0]);
      index.insert('vec-2', [0, 1, 0]);
      index.insert('vec-3', [0, 0, 1]);

      // Delete all and verify search still works
      index.delete('vec-1');
      index.delete('vec-2');

      const results = index.search([0, 0, 1], 1);
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('vec-3');
    });
  });
});
