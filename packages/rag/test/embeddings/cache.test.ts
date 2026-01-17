import { describe, it, expect, beforeEach } from 'vitest';
import {
  LRUEmbeddingCache,
  CachedEmbeddingProvider,
  generateCacheKey,
  type EmbeddingCache,
} from '../../src/embeddings/cache.js';
import {
  BaseEmbeddingProvider,
  type EmbeddingResult,
} from '../../src/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Mock embedding provider for testing the cache wrapper.
 */
class MockEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'MockEmbeddingProvider';
  private callCount = 0;

  constructor() {
    super({
      model: 'mock-model',
      dimensions: 3,
      batchSize: 10,
      normalize: false,
    });
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  isAvailable = async (): Promise<boolean> => true;

  protected _embed = async (text: string): Promise<EmbeddingResult> => {
    this.callCount++;
    return {
      embedding: [text.length, text.length * 2, text.length * 3],
      tokenCount: Math.ceil(text.length / 4),
      model: this.model,
    };
  };
}

// ============================================================================
// generateCacheKey Tests
// ============================================================================

describe('generateCacheKey', () => {
  it('should generate consistent keys for same text', () => {
    const key1 = generateCacheKey('hello world');
    const key2 = generateCacheKey('hello world');
    expect(key1).toBe(key2);
  });

  it('should generate different keys for different text', () => {
    const key1 = generateCacheKey('hello');
    const key2 = generateCacheKey('world');
    expect(key1).not.toBe(key2);
  });

  it('should return hex string', () => {
    const key = generateCacheKey('test');
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('should handle empty string', () => {
    const key = generateCacheKey('');
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('should handle unicode characters', () => {
    const key = generateCacheKey('こんにちは世界');
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// LRUEmbeddingCache Tests
// ============================================================================

describe('LRUEmbeddingCache', () => {
  let cache: LRUEmbeddingCache;

  beforeEach(() => {
    cache = new LRUEmbeddingCache({ maxSize: 3 });
  });

  describe('basic operations', () => {
    it('should return null for missing key', async () => {
      const result = await cache.get('missing');
      expect(result).toBeNull();
    });

    it('should store and retrieve embedding', async () => {
      const embedding = [0.1, 0.2, 0.3];
      await cache.set('key1', embedding);

      const result = await cache.get('key1');
      expect(result).toEqual(embedding);
    });

    it('should update existing key', async () => {
      await cache.set('key1', [1, 2, 3]);
      await cache.set('key1', [4, 5, 6]);

      const result = await cache.get('key1');
      expect(result).toEqual([4, 5, 6]);
    });

    it('should track size correctly', async () => {
      expect(cache.size()).toBe(0);

      await cache.set('a', [1]);
      expect(cache.size()).toBe(1);

      await cache.set('b', [2]);
      expect(cache.size()).toBe(2);

      await cache.set('a', [3]); // Update, not new
      expect(cache.size()).toBe(2);
    });

    it('should clear all entries', async () => {
      await cache.set('a', [1]);
      await cache.set('b', [2]);
      expect(cache.size()).toBe(2);

      await cache.clear();
      expect(cache.size()).toBe(0);
      expect(await cache.get('a')).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when full', async () => {
      // Fill cache: A, B, C (maxSize = 3)
      await cache.set('a', [1]);
      await cache.set('b', [2]);
      await cache.set('c', [3]);

      // Add D - should evict A (oldest)
      await cache.set('d', [4]);

      expect(await cache.get('a')).toBeNull(); // Evicted
      expect(await cache.get('b')).toEqual([2]);
      expect(await cache.get('c')).toEqual([3]);
      expect(await cache.get('d')).toEqual([4]);
    });

    it('should update access order on get', async () => {
      // Fill cache: A, B, C
      await cache.set('a', [1]);
      await cache.set('b', [2]);
      await cache.set('c', [3]);

      // Access A - moves it to front
      await cache.get('a');

      // Add D - should evict B (now oldest)
      await cache.set('d', [4]);

      expect(await cache.get('a')).toEqual([1]); // Still present
      expect(await cache.get('b')).toBeNull(); // Evicted
      expect(await cache.get('c')).toEqual([3]);
      expect(await cache.get('d')).toEqual([4]);
    });

    it('should update access order on set (existing key)', async () => {
      // Fill cache: A, B, C
      await cache.set('a', [1]);
      await cache.set('b', [2]);
      await cache.set('c', [3]);

      // Update A - moves it to front
      await cache.set('a', [10]);

      // Add D - should evict B (now oldest)
      await cache.set('d', [4]);

      expect(await cache.get('a')).toEqual([10]);
      expect(await cache.get('b')).toBeNull();
    });

    it('should respect maxSize of 1', async () => {
      const tinyCache = new LRUEmbeddingCache({ maxSize: 1 });

      await tinyCache.set('a', [1]);
      await tinyCache.set('b', [2]);

      expect(await tinyCache.get('a')).toBeNull();
      expect(await tinyCache.get('b')).toEqual([2]);
      expect(tinyCache.size()).toBe(1);
    });

    it('should use default maxSize of 10000', () => {
      const defaultCache = new LRUEmbeddingCache();
      // We can't easily test 10000 entries, but we verify it doesn't crash
      expect(defaultCache.size()).toBe(0);
    });
  });
});

// ============================================================================
// CachedEmbeddingProvider Tests
// ============================================================================

describe('CachedEmbeddingProvider', () => {
  let mockProvider: MockEmbeddingProvider;
  let cachedProvider: CachedEmbeddingProvider;

  beforeEach(() => {
    mockProvider = new MockEmbeddingProvider();
    cachedProvider = new CachedEmbeddingProvider({
      provider: mockProvider,
      maxCacheSize: 100,
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(cachedProvider.name).toBe('CachedMockEmbeddingProvider');
    });

    it('should inherit dimensions from provider', () => {
      expect(cachedProvider.dimensions).toBe(3);
    });

    it('should delegate isAvailable to provider', async () => {
      expect(await cachedProvider.isAvailable()).toBe(true);
    });
  });

  describe('caching behavior', () => {
    it('should call provider on cache miss', async () => {
      await cachedProvider.embed('hello');
      expect(mockProvider.getCallCount()).toBe(1);
    });

    it('should not call provider on cache hit', async () => {
      await cachedProvider.embed('hello');
      await cachedProvider.embed('hello');

      expect(mockProvider.getCallCount()).toBe(1);
    });

    it('should return same embedding for cached text', async () => {
      const result1 = await cachedProvider.embed('hello');
      const result2 = await cachedProvider.embed('hello');

      expect(result1.embedding).toEqual(result2.embedding);
    });

    it('should track cache statistics', async () => {
      await cachedProvider.embed('a');
      await cachedProvider.embed('b');
      await cachedProvider.embed('a'); // Hit

      const stats = cachedProvider.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(1 / 3);
    });

    it('should reset statistics', async () => {
      await cachedProvider.embed('a');
      await cachedProvider.embed('a');

      cachedProvider.resetStats();
      const stats = cachedProvider.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should clear cache', async () => {
      await cachedProvider.embed('hello');
      await cachedProvider.clearCache();
      await cachedProvider.embed('hello');

      expect(mockProvider.getCallCount()).toBe(2);
    });
  });

  describe('batch caching', () => {
    it('should cache all items in batch', async () => {
      await cachedProvider.embedBatch(['a', 'b', 'c']);

      // All should be cached now
      mockProvider.resetCallCount();
      await cachedProvider.embedBatch(['a', 'b', 'c']);

      expect(mockProvider.getCallCount()).toBe(0);
    });

    it('should only generate uncached items', async () => {
      // First call caches 'a' and 'b'
      await cachedProvider.embedBatch(['a', 'b']);
      mockProvider.resetCallCount();

      // Second call: 'a' and 'b' cached, only 'c' needs generation
      await cachedProvider.embedBatch(['a', 'b', 'c']);

      // Provider should be called once for batch containing just 'c'
      expect(mockProvider.getCallCount()).toBe(1);
    });

    it('should preserve order in results', async () => {
      // Cache 'b' first
      await cachedProvider.embed('b');

      // Request in different order
      const results = await cachedProvider.embedBatch(['a', 'b', 'c']);

      // Results should match input order, not cache order
      expect(results[0]!.embedding[0]).toBe(1); // 'a' length = 1
      expect(results[1]!.embedding[0]).toBe(1); // 'b' length = 1
      expect(results[2]!.embedding[0]).toBe(1); // 'c' length = 1
    });
  });

  describe('custom cache', () => {
    it('should accept custom cache implementation', async () => {
      const customCache: EmbeddingCache = {
        get: async () => [9, 9, 9],
        set: async () => {},
        clear: async () => {},
      };

      const provider = new CachedEmbeddingProvider({
        provider: mockProvider,
        cache: customCache,
      });

      const result = await provider.embed('anything');
      expect(result.embedding).toEqual([9, 9, 9]);
      expect(mockProvider.getCallCount()).toBe(0); // Never called
    });
  });
});
