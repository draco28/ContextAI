/**
 * Memory Budget Tests
 *
 * Tests for memory budget enforcement with callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryBudget } from '../../src/memory/index.js';

describe('MemoryBudget', () => {
  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('constructor', () => {
    it('should create budget with valid config', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      expect(budget.getMaxBytes()).toBe(1000);
      expect(budget.getUsage()).toBe(0);
    });

    it('should throw for non-positive maxBytes', () => {
      expect(() => new MemoryBudget({ maxBytes: 0 })).toThrow(
        'maxBytes must be positive'
      );
      expect(() => new MemoryBudget({ maxBytes: -100 })).toThrow(
        'maxBytes must be positive'
      );
    });

    it('should throw for invalid warningThreshold', () => {
      expect(
        () => new MemoryBudget({ maxBytes: 1000, warningThreshold: -0.1 })
      ).toThrow('warningThreshold must be between 0 and 1');
      expect(
        () => new MemoryBudget({ maxBytes: 1000, warningThreshold: 1.5 })
      ).toThrow('warningThreshold must be between 0 and 1');
    });

    it('should use default warningThreshold of 0.8', () => {
      const onWarning = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        onWarning,
      });

      // 79% should not trigger
      budget.track(790);
      expect(onWarning).not.toHaveBeenCalled();

      // 80% should trigger
      budget.track(10);
      expect(onWarning).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // track / release
  // ==========================================================================

  describe('track', () => {
    it('should track memory allocations', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });

      budget.track(100);
      expect(budget.getUsage()).toBe(100);

      budget.track(200);
      expect(budget.getUsage()).toBe(300);
    });

    it('should throw for negative bytes', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      expect(() => budget.track(-100)).toThrow(
        'Cannot track negative bytes. Use release() instead.'
      );
    });
  });

  describe('release', () => {
    it('should release tracked memory', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });

      budget.track(500);
      budget.release(200);
      expect(budget.getUsage()).toBe(300);
    });

    it('should not go below zero', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });

      budget.track(100);
      budget.release(500); // More than tracked
      expect(budget.getUsage()).toBe(0);
    });

    it('should throw for negative bytes', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      expect(() => budget.release(-100)).toThrow(
        'Cannot release negative bytes. Use track() instead.'
      );
    });
  });

  // ==========================================================================
  // check
  // ==========================================================================

  describe('check', () => {
    it('should report ok when under budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(500);

      const status = budget.check();
      expect(status.ok).toBe(true);
      expect(status.used).toBe(500);
      expect(status.available).toBe(500);
      expect(status.percentage).toBe(50);
    });

    it('should report not ok when over budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(1500);

      const status = budget.check();
      expect(status.ok).toBe(false);
      expect(status.used).toBe(1500);
      expect(status.available).toBe(-500);
      expect(status.percentage).toBe(150);
    });

    it('should report ok when exactly at budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(1000);

      const status = budget.check();
      expect(status.ok).toBe(true);
      expect(status.percentage).toBe(100);
    });
  });

  // ==========================================================================
  // wouldExceed / getAvailable
  // ==========================================================================

  describe('wouldExceed', () => {
    it('should predict if allocation would exceed budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(800);

      expect(budget.wouldExceed(100)).toBe(false); // 800 + 100 = 900 <= 1000
      expect(budget.wouldExceed(200)).toBe(false); // 800 + 200 = 1000 <= 1000
      expect(budget.wouldExceed(201)).toBe(true); // 800 + 201 = 1001 > 1000
    });

    it('should not modify tracked usage', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(500);

      budget.wouldExceed(1000);
      expect(budget.getUsage()).toBe(500); // Unchanged
    });
  });

  describe('getAvailable', () => {
    it('should return remaining budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(300);

      expect(budget.getAvailable()).toBe(700);
    });

    it('should return 0 when over budget', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(1500);

      expect(budget.getAvailable()).toBe(0);
    });
  });

  // ==========================================================================
  // Callbacks
  // ==========================================================================

  describe('callbacks', () => {
    it('should fire onWarning at threshold', () => {
      const onWarning = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        warningThreshold: 0.5,
        onWarning,
      });

      budget.track(400);
      expect(onWarning).not.toHaveBeenCalled();

      budget.track(100); // Now at 50%
      expect(onWarning).toHaveBeenCalledWith(500, 1000);
    });

    it('should fire onExceeded when over budget', () => {
      const onExceeded = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        onExceeded,
      });

      budget.track(900);
      expect(onExceeded).not.toHaveBeenCalled();

      budget.track(100); // Now at 100%
      expect(onExceeded).toHaveBeenCalledWith(1000, 1000);
    });

    it('should fire callbacks only once until reset', () => {
      const onWarning = vi.fn();
      const onExceeded = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        warningThreshold: 0.5,
        onWarning,
        onExceeded,
      });

      // Trigger warning
      budget.track(600);
      expect(onWarning).toHaveBeenCalledTimes(1);

      // Track more - should not re-fire warning
      budget.track(100);
      budget.track(100);
      expect(onWarning).toHaveBeenCalledTimes(1);

      // Exceed budget
      budget.track(500);
      expect(onExceeded).toHaveBeenCalledTimes(1);

      // Track more - should not re-fire exceeded
      budget.track(100);
      expect(onExceeded).toHaveBeenCalledTimes(1);
    });

    it('should reset callback flags when usage drops below threshold', () => {
      const onWarning = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        warningThreshold: 0.5,
        onWarning,
      });

      // Trigger warning
      budget.track(600);
      expect(onWarning).toHaveBeenCalledTimes(1);

      // Drop below threshold
      budget.release(200); // Now at 400 (40%)

      // Trigger warning again
      budget.track(200); // Now at 600 (60%)
      expect(onWarning).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // reset
  // ==========================================================================

  describe('reset', () => {
    it('should reset usage to zero', () => {
      const budget = new MemoryBudget({ maxBytes: 1000 });
      budget.track(500);
      budget.reset();

      expect(budget.getUsage()).toBe(0);
      expect(budget.check().ok).toBe(true);
    });

    it('should reset callback flags', () => {
      const onWarning = vi.fn();
      const budget = new MemoryBudget({
        maxBytes: 1000,
        warningThreshold: 0.5,
        onWarning,
      });

      budget.track(600);
      expect(onWarning).toHaveBeenCalledTimes(1);

      budget.reset();

      // Should fire again after reset
      budget.track(600);
      expect(onWarning).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Real-world scenario
  // ==========================================================================

  describe('real-world scenario', () => {
    it('should handle embedding budget enforcement', () => {
      // Simulate 100MB budget for embeddings
      const maxBytes = 100 * 1024 * 1024;
      let warningCount = 0;
      let exceededCount = 0;

      const budget = new MemoryBudget({
        maxBytes,
        warningThreshold: 0.8,
        onWarning: () => warningCount++,
        onExceeded: () => exceededCount++,
      });

      // Each embedding: 1536 dims * 4 bytes = 6144 bytes
      const embeddingSize = 1536 * 4;

      // Add embeddings until we hit warning
      let count = 0;
      while (budget.check().percentage < 80) {
        budget.track(embeddingSize);
        count++;
      }

      expect(warningCount).toBe(1);
      expect(exceededCount).toBe(0);

      // Continue until exceeded
      while (budget.check().ok) {
        budget.track(embeddingSize);
        count++;
      }

      expect(exceededCount).toBe(1);

      // Should have stored ~17K embeddings (100MB / 6144 bytes)
      expect(count).toBeGreaterThan(16000);
      expect(count).toBeLessThan(18000);
    });
  });
});
