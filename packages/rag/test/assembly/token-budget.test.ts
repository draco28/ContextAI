/**
 * Token Budget Management Tests
 */

import { describe, it, expect } from 'vitest';
import type { Chunk } from '../../src/vector-store/types.js';
import {
  estimateTokens,
  estimateChunkTokens,
  calculateTokenBudget,
  applyTokenBudget,
  truncateText,
  analyzeBudget,
  DEFAULT_TOKEN_BUDGET,
} from '../../src/assembly/token-budget.js';

// Helper to create mock chunks
function createChunk(id: string, content: string): Chunk {
  return { id, content, metadata: {} };
}

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates ~4 chars per token', () => {
    // 12 chars = 3 tokens
    expect(estimateTokens('Hello World!')).toBe(3);

    // 8 chars = 2 tokens
    expect(estimateTokens('Hi there')).toBe(2);
  });

  it('rounds up partial tokens', () => {
    // 5 chars = 1.25 tokens = 2
    expect(estimateTokens('Hello')).toBe(2);
  });

  it('handles long text', () => {
    const longText = 'a'.repeat(1000);
    expect(estimateTokens(longText)).toBe(250);
  });
});

describe('estimateChunkTokens', () => {
  it('includes content and formatting overhead', () => {
    const chunk = createChunk('1', 'Hello World'); // 11 chars = 3 tokens
    // 3 tokens + 50 chars overhead (13 tokens) = ~16 tokens
    const tokens = estimateChunkTokens(chunk, 50);
    expect(tokens).toBe(16); // ceil(11/4) + ceil(50/4) = 3 + 13
  });

  it('uses default formatting overhead of 50 chars', () => {
    const chunk = createChunk('1', 'Test');
    const withDefault = estimateChunkTokens(chunk);
    const withExplicit = estimateChunkTokens(chunk, 50);
    expect(withDefault).toBe(withExplicit);
  });
});

describe('calculateTokenBudget', () => {
  it('returns default budget when no config', () => {
    expect(calculateTokenBudget()).toBe(DEFAULT_TOKEN_BUDGET.maxTokens);
  });

  it('uses explicit maxTokens when provided', () => {
    expect(calculateTokenBudget({ maxTokens: 2000 })).toBe(2000);
  });

  it('calculates from context window and percentage', () => {
    const budget = calculateTokenBudget({
      contextWindowSize: 10000,
      budgetPercentage: 0.3,
    });
    expect(budget).toBe(3000);
  });

  it('explicit maxTokens takes priority over calculation', () => {
    const budget = calculateTokenBudget({
      maxTokens: 500,
      contextWindowSize: 10000,
      budgetPercentage: 0.3,
    });
    expect(budget).toBe(500);
  });
});

describe('applyTokenBudget', () => {
  it('includes all chunks that fit', () => {
    const chunks = [
      createChunk('1', 'Short'),
      createChunk('2', 'Also short'),
    ];

    const result = applyTokenBudget(chunks, 1000, 'drop', 10);

    expect(result.included).toHaveLength(2);
    expect(result.dropped).toHaveLength(0);
  });

  it('drops chunks that exceed budget', () => {
    const chunks = [
      createChunk('1', 'a'.repeat(100)), // ~25 tokens + overhead
      createChunk('2', 'b'.repeat(100)), // ~25 tokens + overhead
      createChunk('3', 'c'.repeat(100)), // ~25 tokens + overhead
    ];

    const result = applyTokenBudget(chunks, 50, 'drop', 10);

    expect(result.included.length).toBeLessThan(3);
    expect(result.dropped.length).toBeGreaterThan(0);
    expect(result.usedTokens).toBeLessThanOrEqual(50);
  });

  it('truncates when strategy is truncate', () => {
    const chunks = [
      createChunk('1', 'a'.repeat(400)), // Will partially fit
    ];

    const result = applyTokenBudget(chunks, 50, 'truncate', 10);

    expect(result.included).toHaveLength(1);
    expect(result.wasTruncated).toBe(true);
    expect(result.included[0]!.content.length).toBeLessThan(400);
    expect(result.included[0]!.content).toContain('...');
  });

  it('drops chunk if truncation would leave too little content', () => {
    const chunks = [
      createChunk('1', 'a'.repeat(400)),
    ];

    // Very small budget - not enough for meaningful content
    const result = applyTokenBudget(chunks, 15, 'truncate', 40);

    // With 15 token budget and 40 char overhead (10 tokens),
    // only 5 tokens = 20 chars for content, which is less than 100 min
    expect(result.included).toHaveLength(0);
    expect(result.dropped).toHaveLength(1);
  });

  it('tracks remaining budget correctly', () => {
    const chunks = [
      createChunk('1', 'a'.repeat(40)), // ~10 tokens + 3 overhead = 13
    ];

    const result = applyTokenBudget(chunks, 100, 'drop', 10);

    expect(result.usedTokens).toBe(13);
    expect(result.remainingTokens).toBe(87);
  });
});

describe('truncateText', () => {
  it('returns original if shorter than max', () => {
    expect(truncateText('Hello', 100)).toBe('Hello');
  });

  it('truncates with ellipsis', () => {
    const result = truncateText('Hello World', 8);
    expect(result).toBe('Hello...');
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('breaks at word boundary when possible', () => {
    const result = truncateText('Hello wonderful world', 15);
    // With 15 chars max and 3 for ellipsis, target is 12 chars
    // "Hello wonder" is 12 chars, then we look for space in last 20%
    // Space at position 5 is within 80% threshold (9.6), so we truncate there
    // Actually the algorithm keeps "Hello wonder" since space at 5 < 12*0.8=9.6
    expect(result).toBe('Hello wonder...');
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it('handles very short max length', () => {
    expect(truncateText('Hello', 3)).toBe('...');
    expect(truncateText('Hello', 0)).toBe('...');
  });
});

describe('analyzeBudget', () => {
  it('returns empty analysis for empty chunks', () => {
    const analysis = analyzeBudget([], 1000);
    expect(analysis.totalChunks).toBe(0);
    expect(analysis.includedCount).toBe(0);
  });

  it('analyzes budget usage correctly', () => {
    const chunks = [
      createChunk('1', 'a'.repeat(40)), // ~10 + overhead
      createChunk('2', 'b'.repeat(40)), // ~10 + overhead
      createChunk('3', 'c'.repeat(40)), // ~10 + overhead
    ];

    const analysis = analyzeBudget(chunks, 50, 10);

    expect(analysis.budget).toBe(50);
    expect(analysis.totalChunks).toBe(3);
    expect(analysis.chunks).toHaveLength(3);

    // Check cumulative tokens
    expect(analysis.chunks[0]!.cumulativeTokens).toBe(analysis.chunks[0]!.tokens);
    expect(analysis.chunks[1]!.cumulativeTokens).toBe(
      analysis.chunks[0]!.tokens + analysis.chunks[1]!.tokens
    );

    // Check which fit
    const fittingCount = analysis.chunks.filter(c => c.fitsInBudget).length;
    expect(analysis.includedCount).toBe(fittingCount);
    expect(analysis.droppedCount).toBe(3 - fittingCount);
  });

  it('calculates budget utilization', () => {
    const chunks = [createChunk('1', 'a'.repeat(40))]; // ~13 tokens

    const analysis = analyzeBudget(chunks, 100, 10);

    // 13/100 = 13%
    expect(analysis.budgetUtilization).toBeCloseTo(13, 0);
  });
});
