/**
 * Memory Monitor Tests
 *
 * Tests for memory statistics and size estimation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  getMemoryStats,
  formatMemoryStats,
  estimateSize,
  estimateEmbeddingMemory,
  formatBytes,
  toFloat32Array,
  toNumberArray,
  BYTES_PER_FLOAT32,
  BYTES_PER_FLOAT64,
  COMMON_DIMENSIONS,
} from '../../src/memory/index.js';

describe('Memory Monitor', () => {
  // ==========================================================================
  // getMemoryStats
  // ==========================================================================

  describe('getMemoryStats', () => {
    it('should return valid memory stats', () => {
      const stats = getMemoryStats();

      expect(stats).toHaveProperty('rss');
      expect(stats).toHaveProperty('heapTotal');
      expect(stats).toHaveProperty('heapUsed');
      expect(stats).toHaveProperty('external');
      expect(stats).toHaveProperty('arrayBuffers');

      // All values should be positive numbers
      expect(stats.rss).toBeGreaterThan(0);
      expect(stats.heapTotal).toBeGreaterThan(0);
      expect(stats.heapUsed).toBeGreaterThan(0);
      expect(stats.external).toBeGreaterThanOrEqual(0);
      expect(stats.arrayBuffers).toBeGreaterThanOrEqual(0);
    });

    it('should have heapUsed <= heapTotal', () => {
      const stats = getMemoryStats();
      expect(stats.heapUsed).toBeLessThanOrEqual(stats.heapTotal);
    });
  });

  // ==========================================================================
  // formatMemoryStats
  // ==========================================================================

  describe('formatMemoryStats', () => {
    it('should format stats as human-readable string', () => {
      const stats = getMemoryStats();
      const formatted = formatMemoryStats(stats);

      expect(formatted).toContain('Heap:');
      expect(formatted).toContain('MB');
      expect(formatted).toContain('External:');
      expect(formatted).toContain('ArrayBuffers:');
      expect(formatted).toContain('RSS:');
    });
  });

  // ==========================================================================
  // estimateSize
  // ==========================================================================

  describe('estimateSize', () => {
    it('should estimate primitive sizes', () => {
      expect(estimateSize(null)).toBe(0);
      expect(estimateSize(undefined)).toBe(0);
      expect(estimateSize(true)).toBe(4);
      expect(estimateSize(42)).toBe(8);
      expect(estimateSize('hi')).toBe(12 + 2 * 2); // 12 overhead + 2 chars * 2 bytes
    });

    it('should estimate array sizes', () => {
      const arr = [1, 2, 3];
      const size = estimateSize(arr);
      // Array overhead (~32) + 3 numbers (3 * 8)
      expect(size).toBeGreaterThanOrEqual(32 + 3 * 8);
    });

    it('should estimate Float32Array sizes exactly', () => {
      const f32 = new Float32Array(100);
      expect(estimateSize(f32)).toBe(400); // 100 * 4 bytes
    });

    it('should estimate Float64Array sizes exactly', () => {
      const f64 = new Float64Array(100);
      expect(estimateSize(f64)).toBe(800); // 100 * 8 bytes
    });

    it('should estimate object sizes', () => {
      const obj = { name: 'test', count: 42 };
      const size = estimateSize(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle nested objects', () => {
      const nested = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      };
      const size = estimateSize(nested);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle Map', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const size = estimateSize(map);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle Set', () => {
      const set = new Set([1, 2, 3]);
      const size = estimateSize(set);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      // Should not throw or infinite loop
      const size = estimateSize(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should respect maxDepth option', () => {
      const deep = {
        l1: { l2: { l3: { l4: { l5: 'value' } } } },
      };

      const fullSize = estimateSize(deep, { maxDepth: 10 });
      const shallowSize = estimateSize(deep, { maxDepth: 2 });

      // Shallow estimate should be smaller (stops early)
      expect(shallowSize).toBeLessThan(fullSize);
    });
  });

  // ==========================================================================
  // estimateEmbeddingMemory
  // ==========================================================================

  describe('estimateEmbeddingMemory', () => {
    it('should calculate Float32 memory correctly', () => {
      // 1000 embeddings * 1536 dims * 4 bytes = 6,144,000 bytes
      const bytes = estimateEmbeddingMemory(1536, 1000, true);
      expect(bytes).toBe(1536 * 1000 * BYTES_PER_FLOAT32);
      expect(bytes).toBe(6_144_000);
    });

    it('should calculate Float64 memory correctly', () => {
      // 1000 embeddings * 1536 dims * 8 bytes = 12,288,000 bytes
      const bytes = estimateEmbeddingMemory(1536, 1000, false);
      expect(bytes).toBe(1536 * 1000 * BYTES_PER_FLOAT64);
      expect(bytes).toBe(12_288_000);
    });

    it('should default to Float32', () => {
      const bytes = estimateEmbeddingMemory(1536, 1000);
      expect(bytes).toBe(6_144_000); // Float32 default
    });

    it('should calculate for common dimension sizes', () => {
      // Test with known dimension constants
      const adaBytes = estimateEmbeddingMemory(COMMON_DIMENSIONS.OPENAI_ADA, 1);
      expect(adaBytes).toBe(1536 * BYTES_PER_FLOAT32);

      const bgeSmallBytes = estimateEmbeddingMemory(
        COMMON_DIMENSIONS.BGE_SMALL,
        1
      );
      expect(bgeSmallBytes).toBe(384 * BYTES_PER_FLOAT32);
    });
  });

  // ==========================================================================
  // formatBytes
  // ==========================================================================

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(100)).toBe('100.00 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(6_144_000)).toBe('5.86 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should respect precision option', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.500 KB');
    });
  });

  // ==========================================================================
  // toFloat32Array / toNumberArray
  // ==========================================================================

  describe('Float32Array conversion', () => {
    it('should convert number[] to Float32Array', () => {
      const numbers = [0.1, 0.2, 0.3, 0.4, 0.5];
      const float32 = toFloat32Array(numbers);

      expect(float32).toBeInstanceOf(Float32Array);
      expect(float32.length).toBe(5);
      // Float32 has less precision, so values may slightly differ
      expect(float32[0]).toBeCloseTo(0.1, 5);
    });

    it('should convert Float32Array back to number[]', () => {
      const float32 = new Float32Array([0.1, 0.2, 0.3]);
      const numbers = toNumberArray(float32);

      expect(Array.isArray(numbers)).toBe(true);
      expect(numbers.length).toBe(3);
      expect(numbers[0]).toBeCloseTo(0.1, 5);
    });

    it('should preserve embedding values through round-trip', () => {
      // Typical embedding values are in [-1, 1] range
      const original = [0.123456, -0.654321, 0.0, 1.0, -1.0];
      const float32 = toFloat32Array(original);
      const restored = toNumberArray(float32);

      for (let i = 0; i < original.length; i++) {
        expect(restored[i]).toBeCloseTo(original[i], 5);
      }
    });
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('Constants', () => {
    it('should export correct byte sizes', () => {
      expect(BYTES_PER_FLOAT32).toBe(4);
      expect(BYTES_PER_FLOAT64).toBe(8);
    });

    it('should export common dimension constants', () => {
      expect(COMMON_DIMENSIONS.OPENAI_ADA).toBe(1536);
      expect(COMMON_DIMENSIONS.OPENAI_SMALL).toBe(1536);
      expect(COMMON_DIMENSIONS.OPENAI_LARGE).toBe(3072);
      expect(COMMON_DIMENSIONS.BGE_SMALL).toBe(384);
      expect(COMMON_DIMENSIONS.BGE_BASE).toBe(768);
    });
  });
});
