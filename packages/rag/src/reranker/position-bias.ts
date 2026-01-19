/**
 * Position Bias Mitigation
 *
 * Utilities to reorder documents to counteract the "lost in the middle"
 * phenomenon observed in Large Language Models.
 *
 * Research shows LLMs pay more attention to content at the beginning
 * and end of context, while middle content gets less attention.
 *
 * Reference: "Lost in the Middle: How Language Models Use Long Contexts"
 * (Liu et al., 2023)
 *
 * @example
 * ```typescript
 * // Reorder for optimal LLM attention
 * const reordered = applySandwichOrdering(rerankedResults, {
 *   startCount: 3,  // Top 3 at start, next top at end
 * });
 * ```
 */

import type { PositionBiasConfig, RerankerResult } from './types.js';

/**
 * Apply position bias mitigation to reranked results.
 *
 * Takes results sorted by relevance and reorders them to optimize
 * for LLM attention patterns based on the chosen strategy.
 *
 * @param results - Results sorted by relevance (descending)
 * @param config - Position bias configuration
 * @returns Reordered results
 *
 * @example
 * ```typescript
 * // Default sandwich: alternating top items at edges
 * const reordered = applyPositionBias(results, { strategy: 'sandwich' });
 *
 * // Custom split: top 2 at start, remaining top at end
 * const reordered = applyPositionBias(results, {
 *   strategy: 'sandwich',
 *   startCount: 2,
 * });
 * ```
 */
export function applyPositionBias<T extends { score: number }>(
  results: T[],
  config: PositionBiasConfig
): T[] {
  if (results.length === 0 || config.strategy === 'none') {
    return results;
  }

  switch (config.strategy) {
    case 'sandwich':
      return applySandwichOrdering(results, config.startCount);
    case 'reverse-sandwich':
      return applyReverseSandwichOrdering(results);
    case 'interleave':
      return applyInterleaveOrdering(results);
    default:
      return results;
  }
}

/**
 * Sandwich ordering: Place most relevant documents at start and end.
 *
 * Pattern (for 7 docs, startCount=3):
 * Original:  [1, 2, 3, 4, 5, 6, 7] (ranked by relevance)
 * Sandwich:  [1, 2, 3, 6, 7, 5, 4] (top 3 at start, remaining reversed at end)
 *
 * This ensures the most important content is at positions where
 * LLMs pay the most attention (beginning and end).
 *
 * @param results - Results sorted by relevance (descending)
 * @param startCount - Number of top items to place at start (default: half)
 * @returns Reordered results with top items at edges
 */
export function applySandwichOrdering<T extends { score: number }>(
  results: T[],
  startCount?: number
): T[] {
  if (results.length <= 2) {
    return results;
  }

  // Default: roughly half at start
  const numStart = startCount ?? Math.ceil(results.length / 2);

  // Clamp to valid range
  const actualStart = Math.max(1, Math.min(numStart, results.length - 1));

  // Split into start and end portions
  const startPortion = results.slice(0, actualStart);
  const endPortion = results.slice(actualStart);

  // Reverse end portion so highest-ranked of remaining are at the very end
  // This places second-best items right at the end (high attention)
  // and worst items in the middle (low attention)
  const reversedEnd = [...endPortion].reverse();

  return [...startPortion, ...reversedEnd];
}

/**
 * Reverse sandwich: Place less relevant at edges, most relevant in middle.
 *
 * Pattern (for 7 docs):
 * Original:        [1, 2, 3, 4, 5, 6, 7]
 * Reverse-sandwich: [7, 5, 3, 1, 2, 4, 6]
 *
 * Useful when you want to "bury" less important context while
 * keeping most important in a focused middle section.
 *
 * Note: This is counterintuitive for most use cases. Only use when
 * you specifically want LLMs to focus on the middle of context.
 */
export function applyReverseSandwichOrdering<T extends { score: number }>(
  results: T[]
): T[] {
  if (results.length <= 2) {
    return results;
  }

  const reordered: T[] = [];
  const len = results.length;

  // Interleave from ends toward middle, but start with lowest-ranked
  let left = 0;
  let right = len - 1;
  let insertAtStart = true;

  while (left <= right) {
    if (insertAtStart) {
      // Add lowest-ranked to start
      if (results[right]) {
        reordered.unshift(results[right]!);
      }
      right--;
    } else {
      // Add highest-ranked to middle
      if (results[left]) {
        reordered.splice(Math.floor(reordered.length / 2), 0, results[left]!);
      }
      left++;
    }
    insertAtStart = !insertAtStart;
  }

  return reordered;
}

/**
 * Interleave ordering: Alternate between high and low relevance.
 *
 * Pattern (for 6 docs):
 * Original:    [1, 2, 3, 4, 5, 6] (by relevance)
 * Interleaved: [1, 6, 2, 5, 3, 4] (high-low-high-low...)
 *
 * This spreads important content throughout, ensuring no section
 * of the context is entirely low-value.
 */
export function applyInterleaveOrdering<T extends { score: number }>(
  results: T[]
): T[] {
  if (results.length <= 2) {
    return results;
  }

  const reordered: T[] = [];
  let left = 0;
  let right = results.length - 1;

  while (left <= right) {
    if (results[left]) {
      reordered.push(results[left]!);
    }
    left++;

    if (left <= right && results[right]) {
      reordered.push(results[right]!);
      right--;
    }
  }

  return reordered;
}

/**
 * Analyze the position distribution of top-k results.
 *
 * Useful for understanding how reordering affects the placement
 * of the most important documents.
 *
 * @param results - Results with original and new ranks
 * @param topK - Number of top results to analyze
 * @returns Analysis of position distribution
 */
export function analyzePositionDistribution(
  results: RerankerResult[],
  topK: number = 5
): {
  /** Indices where top-k items are placed (0-indexed) */
  topKPositions: number[];
  /** Whether top items are at start (first quartile) */
  topAtStart: boolean;
  /** Whether top items are at end (last quartile) */
  topAtEnd: boolean;
  /** Fraction of top items in middle half */
  middleConcentration: number;
} {
  const len = results.length;
  const quarterLen = Math.floor(len / 4);

  // Find positions of top-k items (by newRank)
  const topKPositions: number[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.newRank <= topK) {
      topKPositions.push(i);
    }
  }

  // Analyze distribution
  const startCount = topKPositions.filter((p) => p < quarterLen).length;
  const endCount = topKPositions.filter((p) => p >= len - quarterLen).length;
  const middleCount = topKPositions.filter(
    (p) => p >= quarterLen && p < len - quarterLen
  ).length;

  return {
    topKPositions,
    topAtStart: startCount > 0,
    topAtEnd: endCount > 0,
    middleConcentration: middleCount / Math.max(1, topKPositions.length),
  };
}

/**
 * Create a position bias configuration based on context size.
 *
 * Larger contexts benefit more from aggressive position bias mitigation.
 *
 * @param contextSize - Number of documents in context
 * @returns Recommended configuration
 */
export function recommendPositionBiasConfig(
  contextSize: number
): PositionBiasConfig {
  if (contextSize <= 3) {
    // Too few docs for position bias to matter
    return { strategy: 'none' };
  }

  if (contextSize <= 7) {
    // Small context: simple sandwich with default split
    return { strategy: 'sandwich' };
  }

  if (contextSize <= 15) {
    // Medium context: sandwich with more at start
    return {
      strategy: 'sandwich',
      startCount: Math.ceil(contextSize * 0.4), // 40% at start
    };
  }

  // Large context: aggressive sandwich
  return {
    strategy: 'sandwich',
    startCount: Math.ceil(contextSize * 0.3), // 30% at start
  };
}
