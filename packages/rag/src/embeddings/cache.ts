/**
 * Embedding Cache
 *
 * Caching layer for embedding providers to avoid redundant computations.
 * Includes LRU in-memory cache and interface for custom implementations.
 */

import type { EmbeddingProvider, EmbeddingResult } from './types.js';
import { BaseEmbeddingProvider } from './base-provider.js';

// ============================================================================
// Cache Interface
// ============================================================================

/**
 * Interface for embedding caches.
 *
 * Implement this to create custom cache backends (Redis, Memcached, etc.)
 *
 * @example
 * ```typescript
 * class RedisEmbeddingCache implements EmbeddingCache {
 *   async get(key: string) {
 *     const data = await redis.get(`embed:${key}`);
 *     return data ? JSON.parse(data) : null;
 *   }
 *   async set(key: string, embedding: number[]) {
 *     await redis.setex(`embed:${key}`, 3600, JSON.stringify(embedding));
 *   }
 *   async clear() {
 *     await redis.del(await redis.keys('embed:*'));
 *   }
 * }
 * ```
 */
export interface EmbeddingCache {
  /**
   * Get cached embedding for a text.
   * @param key - Cache key (usually hash of text)
   * @returns Cached embedding or null if not found
   */
  get(key: string): Promise<number[] | null>;

  /**
   * Store embedding in cache.
   * @param key - Cache key
   * @param embedding - Embedding vector to cache
   */
  set(key: string, embedding: number[]): Promise<void>;

  /**
   * Clear all cached embeddings.
   */
  clear(): Promise<void>;

  /**
   * Get current cache size (optional).
   */
  size?(): number;
}

// ============================================================================
// LRU Cache Implementation
// ============================================================================

/**
 * Configuration for LRU embedding cache.
 */
export interface LRUEmbeddingCacheConfig {
  /** Maximum number of embeddings to cache (default: 10000) */
  maxSize?: number;
}

/**
 * Node in the doubly-linked list for LRU tracking.
 */
interface LRUNode {
  key: string;
  value: number[];
  prev: LRUNode | null;
  next: LRUNode | null;
}

/**
 * In-memory LRU (Least Recently Used) cache for embeddings.
 *
 * Automatically evicts least recently accessed items when full.
 * O(1) get and set operations using a hash map + doubly-linked list.
 *
 * @example
 * ```typescript
 * const cache = new LRUEmbeddingCache({ maxSize: 1000 });
 *
 * // Cache miss
 * await cache.get('hello'); // null
 *
 * // Store embedding
 * await cache.set('hello', [0.1, 0.2, 0.3]);
 *
 * // Cache hit
 * await cache.get('hello'); // [0.1, 0.2, 0.3]
 * ```
 */
export class LRUEmbeddingCache implements EmbeddingCache {
  private readonly maxSize: number;
  private readonly cache: Map<string, LRUNode>;
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;

  constructor(config: LRUEmbeddingCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 10000;
    this.cache = new Map();
  }

  /**
   * Get cached embedding, moving it to front (most recently used).
   */
  get = async (key: string): Promise<number[] | null> => {
    const node = this.cache.get(key);
    if (!node) {
      return null;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  };

  /**
   * Store embedding, evicting least recently used if at capacity.
   */
  set = async (key: string, embedding: number[]): Promise<void> => {
    // Update existing
    const existing = this.cache.get(key);
    if (existing) {
      existing.value = embedding;
      this.moveToFront(existing);
      return;
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new node at front
    const node: LRUNode = {
      key,
      value: embedding,
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
   * Clear all cached embeddings.
   */
  clear = async (): Promise<void> => {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  };

  /**
   * Get current cache size.
   */
  size = (): number => {
    return this.cache.size;
  };

  /**
   * Move a node to the front of the list (most recently used).
   */
  private moveToFront(node: LRUNode): void {
    if (node === this.head) {
      return; // Already at front
    }

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }

    // Move to front
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
  }

  /**
   * Evict the least recently used item (tail of list).
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const key = this.tail.key;
    this.cache.delete(key);

    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      // Only one item
      this.head = null;
      this.tail = null;
    }
  }
}

// ============================================================================
// Cache Key Generation
// ============================================================================

/**
 * Generate a cache key from text.
 *
 * Uses a simple hash function for fast key generation.
 * For production with high collision sensitivity, consider using SHA-256.
 */
export function generateCacheKey(text: string): string {
  // Simple djb2 hash - fast and good distribution
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer, then to hex string
  return (hash >>> 0).toString(16);
}

// ============================================================================
// Cached Embedding Provider
// ============================================================================

/**
 * Configuration for cached embedding provider.
 */
export interface CachedEmbeddingProviderConfig {
  /** The underlying embedding provider */
  provider: EmbeddingProvider;
  /** Cache implementation (defaults to LRUEmbeddingCache) */
  cache?: EmbeddingCache;
  /** Maximum cache size if using default LRU cache */
  maxCacheSize?: number;
}

/**
 * Wrapper that adds caching to any embedding provider.
 *
 * Uses the Decorator Pattern to transparently cache embeddings.
 *
 * @example
 * ```typescript
 * const baseProvider = new OllamaEmbeddingProvider();
 * const cachedProvider = new CachedEmbeddingProvider({
 *   provider: baseProvider,
 *   maxCacheSize: 5000,
 * });
 *
 * // First call: generates embedding, stores in cache
 * await cachedProvider.embed('Hello'); // ~100ms
 *
 * // Second call: returns cached embedding
 * await cachedProvider.embed('Hello'); // ~0ms
 * ```
 */
export class CachedEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name: string;

  /** The underlying provider */
  private readonly provider: EmbeddingProvider;

  /** The cache implementation */
  private readonly cache: EmbeddingCache;

  /** Cache statistics */
  private hits = 0;
  private misses = 0;

  constructor(config: CachedEmbeddingProviderConfig) {
    super({
      model: `cached:${config.provider.name}`,
      dimensions: config.provider.dimensions,
      batchSize: config.provider.maxBatchSize,
      normalize: false, // Provider already normalizes
    });

    this.name = `Cached${config.provider.name}`;
    this.provider = config.provider;
    this.cache =
      config.cache ?? new LRUEmbeddingCache({ maxSize: config.maxCacheSize });
  }

  /**
   * Check if the underlying provider is available.
   */
  isAvailable = async (): Promise<boolean> => {
    return this.provider.isAvailable();
  };

  /**
   * Generate embedding with caching.
   */
  protected _embed = async (text: string): Promise<EmbeddingResult> => {
    const cacheKey = generateCacheKey(text);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.hits++;
      return {
        embedding: cached,
        tokenCount: Math.ceil(text.length / 4),
        model: this.model,
      };
    }

    // Cache miss - generate embedding
    this.misses++;
    const result = await this.provider.embed(text);

    // Store in cache
    await this.cache.set(cacheKey, result.embedding);

    return result;
  };

  /**
   * Generate embeddings for batch with caching.
   *
   * Checks cache for each text, only generates missing ones.
   */
  protected override _embedBatch = async (
    texts: string[]
  ): Promise<EmbeddingResult[]> => {
    const results: (EmbeddingResult | null)[] = new Array(texts.length).fill(
      null
    );
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]!;
      const cacheKey = generateCacheKey(text);
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        this.hits++;
        results[i] = {
          embedding: cached,
          tokenCount: Math.ceil(text.length / 4),
          model: this.model,
        };
      } else {
        this.misses++;
        uncachedTexts.push(text);
        uncachedIndices.push(i);
      }
    }

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      const generated = await this.provider.embedBatch(uncachedTexts);

      // Store in cache and fill results
      for (let i = 0; i < generated.length; i++) {
        const result = generated[i]!;
        const text = uncachedTexts[i]!;
        const originalIndex = uncachedIndices[i]!;

        await this.cache.set(generateCacheKey(text), result.embedding);
        results[originalIndex] = result;
      }
    }

    return results as EmbeddingResult[];
  };

  /**
   * Get cache statistics.
   */
  getStats = (): { hits: number; misses: number; hitRate: number } => {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  };

  /**
   * Clear the cache.
   */
  clearCache = async (): Promise<void> => {
    await this.cache.clear();
  };

  /**
   * Reset statistics.
   */
  resetStats = (): void => {
    this.hits = 0;
    this.misses = 0;
  };
}
