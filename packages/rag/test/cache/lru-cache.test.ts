import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LRUCacheProvider, type CacheProvider } from '../../src/cache/index.js';

// ============================================================================
// LRUCacheProvider Tests
// ============================================================================

describe('LRUCacheProvider', () => {
  let cache: LRUCacheProvider<string>;

  beforeEach(() => {
    cache = new LRUCacheProvider<string>({ maxSize: 3 });
  });

  // ==========================================================================
  // Basic Operations
  // ==========================================================================

  describe('basic operations', () => {
    it('should return undefined for missing key', async () => {
      const result = await cache.get('missing');
      expect(result).toBeUndefined();
    });

    it('should store and retrieve value', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should update existing key', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');
      const result = await cache.get('key1');
      expect(result).toBe('value2');
    });

    it('should track size correctly', async () => {
      expect(cache.size()).toBe(0);

      await cache.set('a', 'A');
      expect(cache.size()).toBe(1);

      await cache.set('b', 'B');
      expect(cache.size()).toBe(2);

      await cache.set('a', 'A2'); // Update, not new
      expect(cache.size()).toBe(2);
    });

    it('should clear all entries', async () => {
      await cache.set('a', 'A');
      await cache.set('b', 'B');
      expect(cache.size()).toBe(2);

      await cache.clear();
      expect(cache.size()).toBe(0);
      expect(await cache.get('a')).toBeUndefined();
      expect(await cache.get('b')).toBeUndefined();
    });

    it('should delete existing key', async () => {
      await cache.set('key1', 'value1');
      const deleted = await cache.delete('key1');
      expect(deleted).toBe(true);
      expect(await cache.get('key1')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await cache.delete('missing');
      expect(deleted).toBe(false);
    });

    it('should check key existence with has()', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('missing')).toBe(false);
    });
  });

  // ==========================================================================
  // LRU Eviction
  // ==========================================================================

  describe('LRU eviction', () => {
    it('should evict least recently used when full', async () => {
      // Fill cache: A, B, C (maxSize = 3)
      await cache.set('a', 'A');
      await cache.set('b', 'B');
      await cache.set('c', 'C');

      // Add D - should evict A (oldest)
      await cache.set('d', 'D');

      expect(await cache.get('a')).toBeUndefined(); // Evicted
      expect(await cache.get('b')).toBe('B');
      expect(await cache.get('c')).toBe('C');
      expect(await cache.get('d')).toBe('D');
    });

    it('should update access order on get', async () => {
      // Fill cache: A, B, C
      await cache.set('a', 'A');
      await cache.set('b', 'B');
      await cache.set('c', 'C');

      // Access A - moves it to front
      await cache.get('a');

      // Add D - should evict B (now oldest)
      await cache.set('d', 'D');

      expect(await cache.get('a')).toBe('A'); // Still present
      expect(await cache.get('b')).toBeUndefined(); // Evicted
      expect(await cache.get('c')).toBe('C');
      expect(await cache.get('d')).toBe('D');
    });

    it('should update access order on set (existing key)', async () => {
      // Fill cache: A, B, C
      await cache.set('a', 'A');
      await cache.set('b', 'B');
      await cache.set('c', 'C');

      // Update A - moves it to front
      await cache.set('a', 'A2');

      // Add D - should evict B (now oldest)
      await cache.set('d', 'D');

      expect(await cache.get('a')).toBe('A2');
      expect(await cache.get('b')).toBeUndefined(); // Evicted
    });

    it('should respect maxSize of 1', async () => {
      const tinyCache = new LRUCacheProvider<string>({ maxSize: 1 });

      await tinyCache.set('a', 'A');
      await tinyCache.set('b', 'B');

      expect(await tinyCache.get('a')).toBeUndefined();
      expect(await tinyCache.get('b')).toBe('B');
      expect(tinyCache.size()).toBe(1);
    });

    it('should use default maxSize of 10000', () => {
      const defaultCache = new LRUCacheProvider();
      expect(defaultCache.size()).toBe(0);
    });

    it('should evict multiple items when many are added', async () => {
      // Fill cache: A, B, C
      await cache.set('a', 'A');
      await cache.set('b', 'B');
      await cache.set('c', 'C');

      // Add D, E (two more than capacity)
      await cache.set('d', 'D');
      await cache.set('e', 'E');

      // A and B should be evicted (oldest first)
      expect(await cache.get('a')).toBeUndefined();
      expect(await cache.get('b')).toBeUndefined();
      expect(await cache.get('c')).toBe('C');
      expect(await cache.get('d')).toBe('D');
      expect(await cache.get('e')).toBe('E');
      expect(cache.size()).toBe(3);
    });
  });

  // ==========================================================================
  // TTL (Time-to-Live)
  // ==========================================================================

  describe('TTL support', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire entries after TTL', async () => {
      const ttlCache = new LRUCacheProvider<string>({ maxSize: 10 });

      await ttlCache.set('key', 'value', 1000); // 1 second TTL

      // Before expiration
      expect(await ttlCache.get('key')).toBe('value');

      // After expiration
      vi.advanceTimersByTime(1001);
      expect(await ttlCache.get('key')).toBeUndefined();
    });

    it('should use default TTL when set', async () => {
      const ttlCache = new LRUCacheProvider<string>({
        maxSize: 10,
        defaultTtl: 500,
      });

      await ttlCache.set('key', 'value'); // Uses default TTL

      expect(await ttlCache.get('key')).toBe('value');

      vi.advanceTimersByTime(501);
      expect(await ttlCache.get('key')).toBeUndefined();
    });

    it('should allow overriding default TTL per entry', async () => {
      const ttlCache = new LRUCacheProvider<string>({
        maxSize: 10,
        defaultTtl: 1000,
      });

      await ttlCache.set('short', 'value', 100); // Override with shorter TTL
      await ttlCache.set('default', 'value'); // Uses default TTL

      vi.advanceTimersByTime(150);
      expect(await ttlCache.get('short')).toBeUndefined(); // Expired
      expect(await ttlCache.get('default')).toBe('value'); // Still valid

      vi.advanceTimersByTime(900);
      expect(await ttlCache.get('default')).toBeUndefined(); // Now expired
    });

    it('should not expire entries without TTL', async () => {
      const noTtlCache = new LRUCacheProvider<string>({ maxSize: 10 });

      await noTtlCache.set('key', 'value'); // No TTL

      vi.advanceTimersByTime(100000); // Long time
      expect(await noTtlCache.get('key')).toBe('value'); // Still valid
    });

    it('should report false for has() on expired entry', async () => {
      await cache.set('key', 'value', 100);

      expect(await cache.has('key')).toBe(true);

      vi.advanceTimersByTime(101);
      expect(await cache.has('key')).toBe(false);
    });

    it('should remove expired entry on get()', async () => {
      await cache.set('key', 'value', 100);

      vi.advanceTimersByTime(101);
      await cache.get('key'); // This should remove the expired entry

      expect(cache.size()).toBe(0);
    });

    it('should update TTL when updating existing key', async () => {
      await cache.set('key', 'value1', 100);

      vi.advanceTimersByTime(50);

      // Update with new TTL
      await cache.set('key', 'value2', 200);

      vi.advanceTimersByTime(100); // Total: 150ms
      expect(await cache.get('key')).toBe('value2'); // New TTL hasn't expired

      vi.advanceTimersByTime(100); // Total: 250ms
      expect(await cache.get('key')).toBeUndefined(); // Now expired
    });
  });

  // ==========================================================================
  // Statistics
  // ==========================================================================

  describe('statistics', () => {
    it('should track hits and misses', async () => {
      await cache.set('a', 'A');

      await cache.get('a'); // Hit
      await cache.get('b'); // Miss
      await cache.get('a'); // Hit

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate', async () => {
      await cache.set('a', 'A');

      await cache.get('a'); // Hit
      await cache.get('a'); // Hit
      await cache.get('a'); // Hit
      await cache.get('b'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.75);
    });

    it('should return 0 hit rate when no requests', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should include size in stats', async () => {
      await cache.set('a', 'A');
      await cache.set('b', 'B');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should reset statistics', async () => {
      await cache.set('a', 'A');
      await cache.get('a');
      await cache.get('b');

      cache.resetStats();
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      // Size should not be affected
      expect(stats.size).toBe(1);
    });

    it('should reset statistics on clear()', async () => {
      await cache.set('a', 'A');
      await cache.get('a');

      await cache.clear();
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  // ==========================================================================
  // Generic Type Support
  // ==========================================================================

  describe('generic type support', () => {
    it('should work with number arrays (embeddings)', async () => {
      const embeddingCache = new LRUCacheProvider<number[]>({ maxSize: 10 });

      const embedding = [0.1, 0.2, 0.3];
      await embeddingCache.set('doc1', embedding);

      const result = await embeddingCache.get('doc1');
      expect(result).toEqual(embedding);
    });

    it('should work with objects', async () => {
      interface User {
        id: number;
        name: string;
      }

      const userCache = new LRUCacheProvider<User>({ maxSize: 10 });

      const user: User = { id: 1, name: 'Alice' };
      await userCache.set('user:1', user);

      const result = await userCache.get('user:1');
      expect(result).toEqual(user);
    });

    it('should work with unknown type (default)', async () => {
      const genericCache: CacheProvider = new LRUCacheProvider();

      await genericCache.set('string', 'hello');
      await genericCache.set('number', 42);
      await genericCache.set('object', { x: 1 });

      expect(await genericCache.get('string')).toBe('hello');
      expect(await genericCache.get('number')).toBe(42);
      expect(await genericCache.get('object')).toEqual({ x: 1 });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty string key', async () => {
      await cache.set('', 'empty key');
      expect(await cache.get('')).toBe('empty key');
    });

    it('should handle very long keys', async () => {
      const longKey = 'x'.repeat(10000);
      await cache.set(longKey, 'long key value');
      expect(await cache.get(longKey)).toBe('long key value');
    });

    it('should handle special characters in keys', async () => {
      await cache.set('key:with:colons', 'value1');
      await cache.set('key/with/slashes', 'value2');
      await cache.set('key with spaces', 'value3');

      expect(await cache.get('key:with:colons')).toBe('value1');
      expect(await cache.get('key/with/slashes')).toBe('value2');
      expect(await cache.get('key with spaces')).toBe('value3');
    });

    it('should handle null and undefined values', async () => {
      const nullableCache = new LRUCacheProvider<string | null>({ maxSize: 10 });

      await nullableCache.set('null', null);
      const result = await nullableCache.get('null');
      expect(result).toBeNull();
      // null is a valid value, so has() should return true
      expect(await nullableCache.has('null')).toBe(true);
    });

    it('should handle rapid sequential operations', async () => {
      for (let i = 0; i < 100; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      // Only last 3 should remain (maxSize = 3)
      expect(cache.size()).toBe(3);
      expect(await cache.get('key97')).toBe('value97');
      expect(await cache.get('key98')).toBe('value98');
      expect(await cache.get('key99')).toBe('value99');
    });
  });
});
