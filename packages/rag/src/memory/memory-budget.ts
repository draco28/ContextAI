/**
 * Memory Budget Enforcement
 *
 * Track and enforce memory usage limits with callbacks for
 * warning thresholds and budget exceeded events.
 */

import type {
  MemoryBudgetConfig,
  MemoryBudgetStatus,
  MemoryCallback,
} from './types.js';

// ============================================================================
// Memory Budget
// ============================================================================

/**
 * Memory budget tracker with warning and exceeded callbacks.
 *
 * Tracks "virtual" memory usage (what you tell it), not actual heap.
 * Use this to enforce limits on specific resources (embeddings, caches).
 *
 * @example
 * ```typescript
 * const budget = new MemoryBudget({
 *   maxBytes: 100 * 1024 * 1024, // 100MB
 *   warningThreshold: 0.8,
 *   onWarning: (used, max) => {
 *     console.warn(`Memory at ${(used/max*100).toFixed(0)}%`);
 *   },
 *   onExceeded: (used, max) => {
 *     console.error(`Memory budget exceeded!`);
 *   },
 * });
 *
 * // Track allocations
 * budget.track(1000000); // Track 1MB allocation
 *
 * // Check status
 * const status = budget.check();
 * if (!status.ok) {
 *   // Trigger cleanup
 * }
 *
 * // Release when done
 * budget.release(1000000);
 * ```
 */
export class MemoryBudget {
  private readonly maxBytes: number;
  private readonly warningThreshold: number;
  private readonly onWarning: MemoryCallback | undefined;
  private readonly onExceeded: MemoryCallback | undefined;

  private currentUsage: number = 0;
  private warningFired: boolean = false;
  private exceededFired: boolean = false;

  constructor(config: MemoryBudgetConfig) {
    if (config.maxBytes <= 0) {
      throw new Error('maxBytes must be positive');
    }
    if (
      config.warningThreshold !== undefined &&
      (config.warningThreshold < 0 || config.warningThreshold > 1)
    ) {
      throw new Error('warningThreshold must be between 0 and 1');
    }

    this.maxBytes = config.maxBytes;
    this.warningThreshold = config.warningThreshold ?? 0.8;
    this.onWarning = config.onWarning;
    this.onExceeded = config.onExceeded;
  }

  /**
   * Track a new memory allocation.
   *
   * Fires warning/exceeded callbacks if thresholds are crossed.
   *
   * @param bytes - Number of bytes to track
   */
  track = (bytes: number): void => {
    if (bytes < 0) {
      throw new Error('Cannot track negative bytes. Use release() instead.');
    }

    this.currentUsage += bytes;
    this.checkThresholds();
  };

  /**
   * Release tracked memory.
   *
   * Resets callback flags if usage drops below thresholds.
   *
   * @param bytes - Number of bytes to release
   */
  release = (bytes: number): void => {
    if (bytes < 0) {
      throw new Error('Cannot release negative bytes. Use track() instead.');
    }

    this.currentUsage = Math.max(0, this.currentUsage - bytes);

    // Reset flags if we drop below thresholds
    const percentage = this.currentUsage / this.maxBytes;
    if (percentage < this.warningThreshold) {
      this.warningFired = false;
    }
    if (percentage < 1) {
      this.exceededFired = false;
    }
  };

  /**
   * Check current budget status.
   *
   * @returns Status object with ok flag and usage details
   */
  check = (): MemoryBudgetStatus => {
    const used = this.currentUsage;
    const available = this.maxBytes - used;
    const percentage = (used / this.maxBytes) * 100;

    return {
      ok: used <= this.maxBytes,
      used,
      available,
      percentage,
    };
  };

  /**
   * Get current tracked usage in bytes.
   */
  getUsage = (): number => {
    return this.currentUsage;
  };

  /**
   * Get maximum budget in bytes.
   */
  getMaxBytes = (): number => {
    return this.maxBytes;
  };

  /**
   * Check if budget would be exceeded by a new allocation.
   *
   * Does NOT track the allocation - use this for pre-flight checks.
   *
   * @param bytes - Proposed allocation size
   * @returns true if allocation would exceed budget
   */
  wouldExceed = (bytes: number): boolean => {
    return this.currentUsage + bytes > this.maxBytes;
  };

  /**
   * Get how many bytes can still be allocated.
   *
   * @returns Available bytes (0 if budget exceeded)
   */
  getAvailable = (): number => {
    return Math.max(0, this.maxBytes - this.currentUsage);
  };

  /**
   * Reset tracked usage to zero.
   *
   * Use when clearing all tracked resources.
   */
  reset = (): void => {
    this.currentUsage = 0;
    this.warningFired = false;
    this.exceededFired = false;
  };

  /**
   * Check thresholds and fire callbacks if needed.
   */
  private checkThresholds(): void {
    const percentage = this.currentUsage / this.maxBytes;

    // Check exceeded threshold first (higher priority)
    if (percentage >= 1 && !this.exceededFired) {
      this.exceededFired = true;
      this.onExceeded?.(this.currentUsage, this.maxBytes);
    }
    // Then check warning threshold
    else if (
      percentage >= this.warningThreshold &&
      percentage < 1 &&
      !this.warningFired
    ) {
      this.warningFired = true;
      this.onWarning?.(this.currentUsage, this.maxBytes);
    }
  }
}
