/**
 * Memory Management Exports
 *
 * Utilities for monitoring memory, enforcing budgets,
 * and efficient embedding storage.
 */

// Types
export type {
  MemoryStats,
  MemoryCallback,
  MemoryBudgetConfig,
  MemoryBudgetStatus,
  SizeEstimationOptions,
  EmbeddingStorageFormat,
} from './types.js';

// Constants
export {
  BYTES_PER_FLOAT64,
  BYTES_PER_FLOAT32,
  COMMON_DIMENSIONS,
} from './types.js';

// Memory monitoring
export {
  getMemoryStats,
  formatMemoryStats,
  estimateSize,
  estimateEmbeddingMemory,
  formatBytes,
  toFloat32Array,
  toNumberArray,
} from './memory-monitor.js';

// Memory budget
export { MemoryBudget } from './memory-budget.js';
