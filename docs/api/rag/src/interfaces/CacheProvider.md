[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / CacheProvider

# Interface: CacheProvider\<T\>

Defined in: [rag/src/cache/types.ts:18](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L18)

Generic cache provider interface.

All methods are async to support both in-memory and external cache backends
(Redis, Memcached, IndexedDB, etc.).

## Example

```typescript
// Type-safe embedding cache
const cache: CacheProvider<number[]> = new LRUCacheProvider({ maxSize: 1000 });

// Generic cache (requires type assertion on get)
const genericCache: CacheProvider = new LRUCacheProvider();
```

## Type Parameters

### T

`T` = `unknown`

The type of values stored in the cache. Defaults to `unknown`.

## Methods

### get()

> **get**(`key`): `Promise`\<`T`\>

Defined in: [rag/src/cache/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L24)

Retrieve a value from the cache.

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`T`\>

The cached value, or `undefined` if not found or expired

***

### set()

> **set**(`key`, `value`, `ttl?`): `Promise`\<`void`\>

Defined in: [rag/src/cache/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L32)

Store a value in the cache.

#### Parameters

##### key

`string`

The cache key

##### value

`T`

The value to cache

##### ttl?

`number`

Optional time-to-live in milliseconds

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L39)

Remove a value from the cache.

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`boolean`\>

`true` if the key existed and was deleted, `false` otherwise

***

### has()

> **has**(`key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/types.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L45)

Check if a key exists in the cache (and is not expired).

#### Parameters

##### key

`string`

The cache key

#### Returns

`Promise`\<`boolean`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/cache/types.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L50)

Remove all entries from the cache.

#### Returns

`Promise`\<`void`\>
