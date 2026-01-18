/**
 * LRU Cache Provider
 *
 * Generic in-memory cache with Least Recently Used eviction policy.
 * Uses a doubly-linked list + HashMap for O(1) operations.
 */

import type { CacheProvider, CacheStats, LRUCacheConfig } from './types.js';

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Node in the doubly-linked list for LRU tracking.
 * Each node stores the value plus optional expiration time.
 */
interface LRUNode<T> {
  key: string;
  value: T;
  expiresAt: number | null; // null = never expires
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

// ============================================================================
// LRU Cache Provider
// ============================================================================

/**
 * In-memory LRU (Least Recently Used) cache with optional TTL support.
 *
 * Uses a doubly-linked list + HashMap combination for O(1) operations:
 * - get: O(1) - hash lookup + pointer updates
 * - set: O(1) - hash insert + pointer updates
 * - delete: O(1) - hash delete + pointer updates
 *
 * Eviction Policy:
 * - When cache reaches maxSize, the least recently accessed item is evicted
 * - Items are also evicted when their TTL expires (checked on access)
 *
 * @typeParam T - The type of values stored in the cache
 *
 * @example
 * ```typescript
 * // Basic usage
 * const cache = new LRUCacheProvider<string>({ maxSize: 100 });
 * await cache.set('user:1', 'Alice');
 * const user = await cache.get('user:1'); // 'Alice'
 *
 * // With TTL (expires after 5 minutes)
 * const sessionCache = new LRUCacheProvider<Session>({
 *   maxSize: 1000,
 *   defaultTtl: 5 * 60 * 1000,
 * });
 * ```
 */
export class LRUCacheProvider<T = unknown> implements CacheProvider<T> {
  private readonly maxSize: number;
  private readonly defaultTtl: number | null;
  private readonly cache: Map<string, LRUNode<T>>;

  // Doubly-linked list pointers
  private head: LRUNode<T> | null = null;
  private tail: LRUNode<T> | null = null;

  // Statistics
  private hits = 0;
  private misses = 0;

  constructor(config: LRUCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 10000;
    this.defaultTtl = config.defaultTtl ?? null;
    this.cache = new Map();
  }

  /**
   * Retrieve a value from the cache.
   *
   * If found and not expired, moves the entry to the front (most recently used).
   * Expired entries are automatically removed.
   *
   * @param key - The cache key
   * @returns The cached value, or `undefined` if not found or expired
   */
  get = async (key: string): Promise<T | undefined> => {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    // Check if expired (>= means entry expires AT the TTL time, not after)
    if (node.expiresAt !== null && Date.now() >= node.expiresAt) {
      // Remove expired entry
      await this.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    this.hits++;
    return node.value;
  };

  /**
   * Store a value in the cache.
   *
   * If the key already exists, updates the value and moves to front.
   * If at capacity, evicts the least recently used entry first.
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Optional TTL in milliseconds (overrides defaultTtl)
   */
  set = async (key: string, value: T, ttl?: number): Promise<void> => {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const expiresAt = effectiveTtl !== null ? Date.now() + effectiveTtl : null;

    // Update existing entry
    const existing = this.cache.get(key);
    if (existing) {
      existing.value = value;
      existing.expiresAt = expiresAt;
      this.moveToFront(existing);
      return;
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Create new node at front
    const node: LRUNode<T> = {
      key,
      value,
      expiresAt,
      prev: null,
      next: this.head,
    };

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }

    this.cache.set(key, node);
  };

  /**
   * Remove a value from the cache.
   *
   * @param key - The cache key
   * @returns `true` if the key existed and was deleted, `false` otherwise
   */
  delete = async (key: string): Promise<boolean> => {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Remove from linked list
    this.removeNode(node);

    // Remove from hash map
    this.cache.delete(key);
    return true;
  };

  /**
   * Check if a key exists in the cache (and is not expired).
   *
   * Note: This does NOT update the access order (non-destructive check).
   *
   * @param key - The cache key
   */
  has = async (key: string): Promise<boolean> => {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Check expiration without removing (>= for consistency with get())
    if (node.expiresAt !== null && Date.now() >= node.expiresAt) {
      return false;
    }

    return true;
  };

  /**
   * Remove all entries from the cache and reset statistics.
   */
  clear = async (): Promise<void> => {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  };

  /**
   * Get current cache size (number of entries).
   */
  size = (): number => {
    return this.cache.size;
  };

  /**
   * Get cache statistics for monitoring.
   *
   * @returns Stats including hits, misses, size, and hit rate
   */
  getStats = (): CacheStats => {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  };

  /**
   * Reset cache statistics without clearing entries.
   */
  resetStats = (): void => {
    this.hits = 0;
    this.misses = 0;
  };

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Move a node to the front of the list (most recently used).
   */
  private moveToFront(node: LRUNode<T>): void {
    if (node === this.head) {
      return; // Already at front
    }

    // Remove from current position
    this.removeNode(node);

    // Add to front
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    // Update tail if this was the only node
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove a node from the doubly-linked list (but not from hash map).
   */
  private removeNode(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // Node was head
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // Node was tail
      this.tail = node.prev;
    }
  }

  /**
   * Evict the least recently used item (tail of list).
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const key = this.tail.key;

    // Remove from linked list
    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      // Only one item
      this.head = null;
      this.tail = null;
    }

    // Remove from hash map
    this.cache.delete(key);
  }
}
