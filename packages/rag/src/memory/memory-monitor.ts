/**
 * Memory Monitor Utilities
 *
 * Functions for monitoring memory usage and estimating object sizes.
 * Used for memory budgeting and efficient storage decisions.
 */

import type { MemoryStats, SizeEstimationOptions } from './types.js';
import { BYTES_PER_FLOAT64, BYTES_PER_FLOAT32 } from './types.js';

// ============================================================================
// Memory Statistics
// ============================================================================

/**
 * Get current memory usage statistics from Node.js process.
 *
 * @returns Current memory stats (all values in bytes)
 *
 * @example
 * ```typescript
 * const stats = getMemoryStats();
 * const heapMB = stats.heapUsed / 1024 / 1024;
 * console.log(`Heap: ${heapMB.toFixed(2)}MB`);
 * ```
 */
export function getMemoryStats(): MemoryStats {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
  };
}

/**
 * Format memory stats as a human-readable string.
 *
 * @param stats - Memory stats to format
 * @returns Formatted string with all values in MB
 *
 * @example
 * ```typescript
 * console.log(formatMemoryStats(getMemoryStats()));
 * // => "Heap: 25.3/50.1MB | External: 2.1MB | ArrayBuffers: 6.1MB | RSS: 78.4MB"
 * ```
 */
export function formatMemoryStats(stats: MemoryStats): string {
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  return [
    `Heap: ${toMB(stats.heapUsed)}/${toMB(stats.heapTotal)}MB`,
    `External: ${toMB(stats.external)}MB`,
    `ArrayBuffers: ${toMB(stats.arrayBuffers)}MB`,
    `RSS: ${toMB(stats.rss)}MB`,
  ].join(' | ');
}

// ============================================================================
// Size Estimation
// ============================================================================

/**
 * Estimate the memory size of a JavaScript value.
 *
 * This is an approximation based on V8's internal representations.
 * Actual memory may vary due to V8 optimizations.
 *
 * @param value - The value to estimate size for
 * @param options - Estimation options
 * @returns Estimated size in bytes
 *
 * @example
 * ```typescript
 * // String (2 bytes per char in V8)
 * estimateSize("hello"); // ~10 bytes + overhead
 *
 * // Array of numbers
 * estimateSize([1, 2, 3]); // ~24 bytes (3 × 8) + overhead
 *
 * // TypedArray
 * estimateSize(new Float32Array(1536)); // ~6144 bytes
 * ```
 */
export function estimateSize(
  value: unknown,
  options: SizeEstimationOptions = {}
): number {
  const { maxDepth = 10 } = options;
  const seen = new WeakSet();

  function estimate(val: unknown, depth: number): number {
    // Prevent infinite recursion
    if (depth > maxDepth) return 0;

    // Handle null/undefined
    if (val === null || val === undefined) {
      return 0;
    }

    // Primitives
    switch (typeof val) {
      case 'boolean':
        return 4; // V8 uses 4 bytes for booleans
      case 'number':
        return 8; // All numbers are 64-bit floats
      case 'string':
        // V8 uses 2 bytes per char for strings (UTF-16)
        // Plus ~12 bytes overhead for string object
        return 12 + (val as string).length * 2;
      case 'bigint':
        // BigInt overhead + 8 bytes per 64-bit word
        return 16 + Math.ceil(val.toString(16).length / 16) * 8;
      case 'symbol':
        return 8; // Symbol reference
      case 'function':
        return 32; // Function reference (rough estimate)
    }

    // Objects (including arrays, typed arrays, etc.)
    if (typeof val === 'object') {
      // Prevent double-counting circular references
      if (seen.has(val)) return 0;
      seen.add(val);

      // TypedArrays have known exact sizes
      if (ArrayBuffer.isView(val)) {
        return (val as ArrayBufferView).byteLength;
      }

      // ArrayBuffer
      if (val instanceof ArrayBuffer) {
        return val.byteLength;
      }

      // Regular arrays
      if (Array.isArray(val)) {
        // Array overhead (~32 bytes) + elements
        let size = 32;
        for (const item of val) {
          size += estimate(item, depth + 1);
        }
        return size;
      }

      // Map
      if (val instanceof Map) {
        let size = 32; // Map overhead
        for (const [k, v] of val) {
          size += estimate(k, depth + 1) + estimate(v, depth + 1);
        }
        return size;
      }

      // Set
      if (val instanceof Set) {
        let size = 32; // Set overhead
        for (const item of val) {
          size += estimate(item, depth + 1);
        }
        return size;
      }

      // Date
      if (val instanceof Date) {
        return 32; // Date object overhead
      }

      // Regular object
      let size = 24; // Object header overhead
      for (const key of Object.keys(val)) {
        // Key storage + value
        size += 12 + key.length * 2; // Key as string
        size += estimate((val as Record<string, unknown>)[key], depth + 1);
      }
      return size;
    }

    return 0;
  }

  return estimate(value, 0);
}

// ============================================================================
// Embedding-Specific Utilities
// ============================================================================

/**
 * Calculate exact memory usage for embedding storage.
 *
 * @param dimensions - Number of dimensions per embedding
 * @param count - Number of embeddings
 * @param useFloat32 - Use Float32Array (4 bytes) vs number[] (8 bytes)
 * @returns Memory usage in bytes
 *
 * @example
 * ```typescript
 * // 1000 OpenAI embeddings (1536 dims) as float64
 * estimateEmbeddingMemory(1536, 1000, false);
 * // => 12,288,000 bytes (~12.3MB)
 *
 * // Same with Float32Array (50% savings)
 * estimateEmbeddingMemory(1536, 1000, true);
 * // => 6,144,000 bytes (~6.1MB)
 * ```
 */
export function estimateEmbeddingMemory(
  dimensions: number,
  count: number,
  useFloat32: boolean = true
): number {
  const bytesPerFloat = useFloat32 ? BYTES_PER_FLOAT32 : BYTES_PER_FLOAT64;
  return dimensions * count * bytesPerFloat;
}

/**
 * Format bytes as a human-readable string.
 *
 * @param bytes - Number of bytes
 * @param precision - Decimal places (default: 2)
 * @returns Formatted string (e.g., "12.34 MB")
 */
export function formatBytes(bytes: number, precision: number = 2): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

/**
 * Convert a number[] embedding to Float32Array for memory efficiency.
 *
 * @param embedding - Embedding as number array
 * @returns Float32Array representation
 *
 * @example
 * ```typescript
 * const embedding = [0.1, 0.2, 0.3, ...]; // 1536 floats
 * const efficient = toFloat32Array(embedding);
 * // Memory: 1536 * 4 = 6144 bytes (vs 12288 for number[])
 * ```
 */
export function toFloat32Array(embedding: number[]): Float32Array {
  return new Float32Array(embedding);
}

/**
 * Convert a Float32Array embedding back to number[] for API compatibility.
 *
 * @param embedding - Float32Array embedding
 * @returns Regular number array
 */
export function toNumberArray(embedding: Float32Array): number[] {
  return Array.from(embedding);
}
