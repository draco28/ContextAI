[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LRUEmbeddingCache

# ~~Class: LRUEmbeddingCache~~

Defined in: [rag/src/embeddings/cache.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L95)

In-memory LRU (Least Recently Used) cache for embeddings.

This class wraps the generic `LRUCacheProvider<number[]>` and adapts it to
the legacy `EmbeddingCache` interface for backward compatibility.

## Deprecated

For new code, use `LRUCacheProvider<number[]>` directly from
the cache module. This class is maintained for backward compatibility.

## Example

```typescript
// Legacy usage (still works):
const cache = new LRUEmbeddingCache({ maxSize: 1000 });
await cache.get('hello'); // returns null on miss

// New approach (recommended):
import { LRUCacheProvider } from '@contextai/rag';
const cache = new LRUCacheProvider<number[]>({ maxSize: 1000 });
await cache.get('hello'); // returns undefined on miss
```

## Implements

- [`EmbeddingCache`](../interfaces/EmbeddingCache.md)

## Constructors

### Constructor

> **new LRUEmbeddingCache**(`config`): `LRUEmbeddingCache`

Defined in: [rag/src/embeddings/cache.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L99)

#### Parameters

##### config

[`LRUEmbeddingCacheConfig`](../interfaces/LRUEmbeddingCacheConfig.md) = `{}`

#### Returns

`LRUEmbeddingCache`

## Methods

### ~~get()~~

> **get**(`key`): `Promise`\<`number`[]\>

Defined in: [rag/src/embeddings/cache.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L110)

Get cached embedding, moving it to front (most recently used).

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`number`[]\>

Cached embedding or `null` if not found (legacy behavior)

#### Implementation of

[`EmbeddingCache`](../interfaces/EmbeddingCache.md).[`get`](../interfaces/EmbeddingCache.md#get)

***

### ~~set()~~

> **set**(`key`, `embedding`): `Promise`\<`void`\>

Defined in: [rag/src/embeddings/cache.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L119)

Store embedding, evicting least recently used if at capacity.

#### Parameters

##### key

`string`

##### embedding

`number`[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`EmbeddingCache`](../interfaces/EmbeddingCache.md).[`set`](../interfaces/EmbeddingCache.md#set)

***

### ~~clear()~~

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/embeddings/cache.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L126)

Clear all cached embeddings.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`EmbeddingCache`](../interfaces/EmbeddingCache.md).[`clear`](../interfaces/EmbeddingCache.md#clear)

***

### ~~size()~~

> **size**(): `number`

Defined in: [rag/src/embeddings/cache.ts:133](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L133)

Get current cache size.

#### Returns

`number`

#### Implementation of

[`EmbeddingCache`](../interfaces/EmbeddingCache.md).[`size`](../interfaces/EmbeddingCache.md#size)

***

### ~~getProvider()~~

> **getProvider**(): [`CacheProvider`](../interfaces/CacheProvider.md)\<`number`[]\>

Defined in: [rag/src/embeddings/cache.ts:143](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L143)

Access the underlying generic cache provider.

Useful for accessing additional features like stats or TTL that aren't
part of the legacy EmbeddingCache interface.

#### Returns

[`CacheProvider`](../interfaces/CacheProvider.md)\<`number`[]\>
