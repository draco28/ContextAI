/**
 * Chunk Deduplication Tests
 */

import { describe, it, expect } from 'vitest';
import type { RerankerResult } from '../../src/reranker/types.js';
import type { Chunk } from '../../src/vector-store/types.js';
import {
  jaccardSimilarity,
  tokenize,
  deduplicateResults,
  findSimilarPairs,
  analyzeSimilarity,
  DEFAULT_DEDUPLICATION_CONFIG,
} from '../../src/assembly/deduplication.js';

// Helper to create mock chunks
function createChunk(id: string, content: string): Chunk {
  return { id, content, metadata: {} };
}

// Helper to create mock reranker results
function createResult(id: string, score: number, content: string): RerankerResult {
  return {
    id,
    chunk: createChunk(id, content),
    score,
    originalRank: 1,
    newRank: 1,
    scores: { originalScore: score, rerankerScore: score },
  };
}

describe('tokenize', () => {
  it('converts to lowercase and splits on whitespace', () => {
    const tokens = tokenize('Hello World');
    expect(tokens).toContain('hello');
    expect(tokens).toContain('world');
  });

  it('removes punctuation', () => {
    const tokens = tokenize('Hello, World! How are you?');
    expect(tokens).not.toContain('hello,');
    expect(tokens).toContain('hello');
    expect(tokens).not.toContain('you?');
    expect(tokens).toContain('you');
  });

  it('filters short words (< 2 chars)', () => {
    const tokens = tokenize('I am a test');
    expect(tokens).not.toContain('i');
    expect(tokens).not.toContain('a');
    expect(tokens).toContain('am');
    expect(tokens).toContain('test');
  });

  it('returns Set for unique words', () => {
    const tokens = tokenize('the the the');
    expect(tokens.size).toBe(1);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 1 for identical texts', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('returns 0 for completely different texts', () => {
    expect(jaccardSimilarity('hello world', 'goodbye universe')).toBe(0);
  });

  it('returns 1 for both empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
  });

  it('returns 0 when one string is empty', () => {
    expect(jaccardSimilarity('hello', '')).toBe(0);
    expect(jaccardSimilarity('', 'world')).toBe(0);
  });

  it('calculates partial overlap correctly', () => {
    // "hello world" = {hello, world}
    // "hello there" = {hello, there}
    // Intersection = {hello} = 1
    // Union = {hello, world, there} = 3
    // Jaccard = 1/3 = 0.333...
    const similarity = jaccardSimilarity('hello world', 'hello there');
    expect(similarity).toBeCloseTo(1 / 3, 5);
  });

  it('is case insensitive', () => {
    expect(jaccardSimilarity('Hello World', 'HELLO WORLD')).toBe(1);
  });

  it('ignores punctuation', () => {
    expect(jaccardSimilarity('Hello, World!', 'Hello World')).toBe(1);
  });
});

describe('deduplicateResults', () => {
  it('returns all results when deduplication is disabled', () => {
    const results = [
      createResult('1', 0.9, 'same text here'),
      createResult('2', 0.8, 'same text here'),
    ];

    const deduped = deduplicateResults(results, { enabled: false });

    expect(deduped.unique).toHaveLength(2);
    expect(deduped.duplicates).toHaveLength(0);
  });

  it('removes near-duplicates above threshold', () => {
    // These two are ~90% similar (only "dog" vs "dog" difference with 9 shared words)
    const results = [
      createResult('1', 0.9, 'the quick brown fox jumps over the lazy dog'),
      createResult('2', 0.8, 'the quick brown fox jumps over the lazy dog'), // Exact duplicate
      createResult('3', 0.7, 'completely different content here'),
    ];

    const deduped = deduplicateResults(results, { similarityThreshold: 0.8 });

    expect(deduped.unique).toHaveLength(2);
    expect(deduped.unique.map(r => r.id)).toContain('1');
    expect(deduped.unique.map(r => r.id)).toContain('3');
  });

  it('keeps highest-scoring duplicate by default', () => {
    const results = [
      createResult('low', 0.3, 'exact same content'),
      createResult('high', 0.9, 'exact same content'),
    ];

    const deduped = deduplicateResults(results, { keepHighestScore: true });

    expect(deduped.unique).toHaveLength(1);
    expect(deduped.unique[0]!.id).toBe('high');
    expect(deduped.duplicates[0]!.removed.id).toBe('low');
  });

  it('tracks which result caused the duplicate', () => {
    const results = [
      createResult('1', 0.9, 'hello world test'),
      createResult('2', 0.8, 'hello world test'),
    ];

    const deduped = deduplicateResults(results);

    expect(deduped.duplicates).toHaveLength(1);
    expect(deduped.duplicates[0]!.keptId).toBe('1');
    expect(deduped.duplicates[0]!.similarity).toBe(1);
  });

  it('returns empty array for empty input', () => {
    const deduped = deduplicateResults([]);
    expect(deduped.unique).toEqual([]);
    expect(deduped.duplicates).toEqual([]);
  });

  it('uses default config when not provided', () => {
    const results = [
      createResult('1', 0.9, 'test content'),
    ];

    const deduped = deduplicateResults(results);

    expect(deduped.unique).toHaveLength(1);
  });

  it('tracks comparison count', () => {
    const results = [
      createResult('1', 0.9, 'unique text one'),
      createResult('2', 0.8, 'unique text two'),
      createResult('3', 0.7, 'unique text three'),
    ];

    const deduped = deduplicateResults(results);

    // Each result compared against kept results
    // 1 is kept, 2 compared to 1, 3 compared to 1 and 2
    expect(deduped.comparisons).toBeGreaterThan(0);
  });
});

describe('findSimilarPairs', () => {
  it('finds pairs above threshold', () => {
    const results = [
      createResult('1', 0.9, 'hello world'),
      createResult('2', 0.8, 'hello there'),
      createResult('3', 0.7, 'goodbye universe'),
    ];

    const pairs = findSimilarPairs(results, 0.3);

    // "hello world" and "hello there" share "hello"
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.some(p =>
      (p.idA === '1' && p.idB === '2') || (p.idA === '2' && p.idB === '1')
    )).toBe(true);
  });

  it('returns empty for no similar pairs', () => {
    const results = [
      createResult('1', 0.9, 'aaa bbb ccc'),
      createResult('2', 0.8, 'xxx yyy zzz'),
    ];

    const pairs = findSimilarPairs(results, 0.5);

    expect(pairs).toHaveLength(0);
  });

  it('sorts by similarity descending', () => {
    const results = [
      createResult('1', 0.9, 'hello world test'),
      createResult('2', 0.8, 'hello world'),
      createResult('3', 0.7, 'hello'),
    ];

    const pairs = findSimilarPairs(results, 0.2);

    // Should be sorted by similarity
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i]!.similarity).toBeLessThanOrEqual(pairs[i - 1]!.similarity);
    }
  });

  it('includes content previews', () => {
    const results = [
      createResult('1', 0.9, 'same content here'),
      createResult('2', 0.8, 'same content here'),
    ];

    const pairs = findSimilarPairs(results, 0.5);

    expect(pairs[0]!.contentPreviewA).toBe('same content here');
    expect(pairs[0]!.contentPreviewB).toBe('same content here');
  });
});

describe('analyzeSimilarity', () => {
  it('returns zeros for single result', () => {
    const results = [createResult('1', 0.9, 'single')];
    const analysis = analyzeSimilarity(results);

    expect(analysis.totalPairs).toBe(0);
    expect(analysis.averageSimilarity).toBe(0);
  });

  it('calculates statistics correctly', () => {
    const results = [
      createResult('1', 0.9, 'hello world test'),
      createResult('2', 0.8, 'hello world test'), // Identical
      createResult('3', 0.7, 'completely different'),
    ];

    const analysis = analyzeSimilarity(results);

    // 3 results = 3 pairs (1-2, 1-3, 2-3)
    expect(analysis.totalPairs).toBe(3);
    expect(analysis.maxSimilarity).toBe(1); // Identical pair
    expect(analysis.pairsAbove90).toBeGreaterThanOrEqual(1);
  });

  it('counts pairs above thresholds', () => {
    const results = [
      createResult('1', 0.9, 'hello world test example'),
      createResult('2', 0.8, 'hello world test example'), // 100% similar
    ];

    const analysis = analyzeSimilarity(results);

    expect(analysis.pairsAbove50).toBe(1);
    expect(analysis.pairsAbove70).toBe(1);
    expect(analysis.pairsAbove90).toBe(1);
  });
});

describe('DEFAULT_DEDUPLICATION_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_DEDUPLICATION_CONFIG.enabled).toBe(true);
    expect(DEFAULT_DEDUPLICATION_CONFIG.similarityThreshold).toBe(0.8);
    expect(DEFAULT_DEDUPLICATION_CONFIG.keepHighestScore).toBe(true);
  });
});
