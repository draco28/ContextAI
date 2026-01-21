[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LRUCacheProvider

# Class: LRUCacheProvider\<T\>

Defined in: [rag/src/cache/lru-cache.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L58)

In-memory LRU (Least Recently Used) cache with optional TTL support.

Uses a doubly-linked list + HashMap combination for O(1) operations:
- get: O(1) - hash lookup + pointer updates
- set: O(1) - hash insert + pointer updates
- delete: O(1) - hash delete + pointer updates

Eviction Policy:
- When cache reaches maxSize, the least recently accessed item is evicted
- Items are also evicted when their TTL expires (checked on access)

## Example

```typescript
// Basic usage
const cache = new LRUCacheProvider<string>({ maxSize: 100 });
await cache.set('user:1', 'Alice');
const user = await cache.get('user:1'); // 'Alice'

// With TTL (expires after 5 minutes)
const sessionCache = new LRUCacheProvider<Session>({
  maxSize: 1000,
  defaultTtl: 5 * 60 * 1000,
});
```

## Type Parameters

### T

`T` = `unknown`

The type of values stored in the cache

## Implements

- [`CacheProvider`](../interfaces/CacheProvider.md)\<`T`\>

## Constructors

### Constructor

> **new LRUCacheProvider**\<`T`\>(`config`): `LRUCacheProvider`\<`T`\>

Defined in: [rag/src/cache/lru-cache.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L71)

#### Parameters

##### config

[`LRUCacheConfig`](../interfaces/LRUCacheConfig.md) = `{}`

#### Returns

`LRUCacheProvider`\<`T`\>

## Methods

### get()

> **get**(`key`): `Promise`\<`T`\>

Defined in: [rag/src/cache/lru-cache.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L86)

Retrieve a value from the cache.

If found and not expired, moves the entry to the front (most recently used).
Expired entries are automatically removed.

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`T`\>

The cached value, or `undefined` if not found or expired

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`get`](../interfaces/CacheProvider.md#get)

***

### set()

> **set**(`key`, `value`, `ttl?`): `Promise`\<`void`\>

Defined in: [rag/src/cache/lru-cache.ts:118](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L118)

Store a value in the cache.

If the key already exists, updates the value and moves to front.
If at capacity, evicts the least recently used entry first.

#### Parameters

##### key

`string`

The cache key

##### value

`T`

The value to cache

##### ttl?

`number`

Optional TTL in milliseconds (overrides defaultTtl)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`set`](../interfaces/CacheProvider.md#set)

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/lru-cache.ts:163](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L163)

Remove a value from the cache.

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`boolean`\>

`true` if the key existed and was deleted, `false` otherwise

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`delete`](../interfaces/CacheProvider.md#delete)

***

### has()

> **has**(`key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/lru-cache.ts:184](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L184)

Check if a key exists in the cache (and is not expired).

Note: This does NOT update the access order (non-destructive check).

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`has`](../interfaces/CacheProvider.md#has)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/cache/lru-cache.ts:201](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L201)

Remove all entries from the cache and reset statistics.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`clear`](../interfaces/CacheProvider.md#clear)

***

### size()

> **size**(): `number`

Defined in: [rag/src/cache/lru-cache.ts:212](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L212)

Get current cache size (number of entries).

#### Returns

`number`

***

### getStats()

> **getStats**(): [`CacheStats`](../interfaces/CacheStats.md)

Defined in: [rag/src/cache/lru-cache.ts:221](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L221)

Get cache statistics for monitoring.

#### Returns

[`CacheStats`](../interfaces/CacheStats.md)

Stats including hits, misses, size, and hit rate

***

### resetStats()

> **resetStats**(): `void`

Defined in: [rag/src/cache/lru-cache.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/lru-cache.ts#L234)

Reset cache statistics without clearing entries.

#### Returns

`void`
