import { describe, it, expect, beforeEach } from 'vitest';
import { NoCacheProvider, type CacheProvider } from '../../src/cache/index.js';

// ============================================================================
// NoCacheProvider Tests (Null Object Pattern)
// ============================================================================

describe('NoCacheProvider', () => {
  let cache: NoCacheProvider<string>;

  beforeEach(() => {
    cache = new NoCacheProvider<string>();
  });

  // ==========================================================================
  // Core Behavior (Null Object Pattern)
  // ==========================================================================

  describe('null object behavior', () => {
    it('should always return undefined from get()', async () => {
      // Even after set, get should return undefined
      await cache.set('key', 'value');
      expect(await cache.get('key')).toBeUndefined();
    });

    it('should accept set() without error', async () => {
      // set() should not throw
      await expect(cache.set('key', 'value')).resolves.toBeUndefined();
    });

    it('should accept set() with TTL without error', async () => {
      // TTL is accepted but has no effect
      await expect(cache.set('key', 'value', 1000)).resolves.toBeUndefined();
    });

    it('should always return false from delete()', async () => {
      await cache.set('key', 'value');
      expect(await cache.delete('key')).toBe(false);
    });

    it('should always return false from has()', async () => {
      await cache.set('key', 'value');
      expect(await cache.has('key')).toBe(false);
    });

    it('should always return 0 from size()', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      expect(cache.size()).toBe(0);
    });

    it('should not throw on clear()', async () => {
      await cache.set('key', 'value');
      await expect(cache.clear()).resolves.toBeUndefined();
    });
  });

  // ==========================================================================
  // Statistics
  // ==========================================================================

  describe('statistics', () => {
    it('should track misses (all gets are misses)', async () => {
      await cache.get('a');
      await cache.get('b');
      await cache.get('c');

      const stats = cache.getStats();
      expect(stats.misses).toBe(3);
    });

    it('should never have hits', async () => {
      await cache.set('key', 'value');
      await cache.get('key');
      await cache.get('key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
    });

    it('should always have 0 hit rate', async () => {
      await cache.get('a');
      await cache.get('b');

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should always report size as 0', async () => {
      await cache.set('a', 'A');
      await cache.set('b', 'B');

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should reset statistics', async () => {
      await cache.get('a');
      await cache.get('b');

      cache.resetStats();
      const stats = cache.getStats();

      expect(stats.misses).toBe(0);
    });

    it('should reset access count on clear()', async () => {
      await cache.get('a');
      await cache.get('b');

      await cache.clear();
      const stats = cache.getStats();

      expect(stats.misses).toBe(0);
    });
  });

  // ==========================================================================
  // Interface Compatibility
  // ==========================================================================

  describe('interface compatibility', () => {
    it('should be assignable to CacheProvider<T>', () => {
      // TypeScript compile-time check
      const provider: CacheProvider<string> = new NoCacheProvider<string>();
      expect(provider).toBeInstanceOf(NoCacheProvider);
    });

    it('should be assignable to CacheProvider (unknown)', () => {
      // Can use as generic cache
      const provider: CacheProvider = new NoCacheProvider();
      expect(provider).toBeInstanceOf(NoCacheProvider);
    });

    it('should work with different types', async () => {
      const stringCache = new NoCacheProvider<string>();
      const numberCache = new NoCacheProvider<number[]>();
      const objectCache = new NoCacheProvider<{ id: number }>();

      // All operations work (even if they don't cache)
      await stringCache.set('key', 'hello');
      await numberCache.set('key', [1, 2, 3]);
      await objectCache.set('key', { id: 1 });

      // All return undefined
      expect(await stringCache.get('key')).toBeUndefined();
      expect(await numberCache.get('key')).toBeUndefined();
      expect(await objectCache.get('key')).toBeUndefined();
    });
  });

  // ==========================================================================
  // Use Case: Testing
  // ==========================================================================

  describe('use case: testing without cache side effects', () => {
    interface DataFetcher {
      fetch(id: string): Promise<string>;
    }

    class CachingService {
      constructor(
        private cache: CacheProvider<string>,
        private fetcher: DataFetcher
      ) {}

      async getData(id: string): Promise<string> {
        const cached = await this.cache.get(id);
        if (cached !== undefined) {
          return cached;
        }

        const data = await this.fetcher.fetch(id);
        await this.cache.set(id, data);
        return data;
      }
    }

    it('should allow testing service without caching', async () => {
      const mockFetcher: DataFetcher = {
        fetch: async (id) => `data:${id}`,
      };

      // Use NoCacheProvider to test fetcher is always called
      const service = new CachingService(new NoCacheProvider(), mockFetcher);

      const result1 = await service.getData('1');
      const result2 = await service.getData('1'); // Would be cached with real cache

      expect(result1).toBe('data:1');
      expect(result2).toBe('data:1');

      // In a real test, you'd verify fetcher was called twice
    });
  });

  // ==========================================================================
  // Use Case: Conditional Caching
  // ==========================================================================

  describe('use case: conditional caching', () => {
    it('should allow disabling cache at runtime', async () => {
      const getCache = (enabled: boolean): CacheProvider<string> =>
        enabled
          ? { get: async () => 'cached', set: async () => {}, delete: async () => true, has: async () => true, clear: async () => {} }
          : new NoCacheProvider();

      const enabledCache = getCache(true);
      const disabledCache = getCache(false);

      await enabledCache.set('key', 'value');
      await disabledCache.set('key', 'value');

      expect(await enabledCache.get('key')).toBe('cached');
      expect(await disabledCache.get('key')).toBeUndefined();
    });
  });
});
