[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingCache

# ~~Interface: EmbeddingCache~~

Defined in: [rag/src/embeddings/cache.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L36)

Interface for embedding caches.

## Deprecated

For new code, prefer using `CacheProvider<number[]>` from the
cache module. This interface is maintained for backward compatibility.

## Example

```typescript
// New approach (recommended):
import { LRUCacheProvider, type CacheProvider } from '@contextaisdk/rag';
const cache: CacheProvider<number[]> = new LRUCacheProvider({ maxSize: 1000 });

// Legacy approach (still supported):
const legacyCache: EmbeddingCache = new LRUEmbeddingCache({ maxSize: 1000 });
```

## Methods

### ~~get()~~

> **get**(`key`): `Promise`\<`number`[]\>

Defined in: [rag/src/embeddings/cache.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L42)

Get cached embedding for a text.

#### Parameters

##### key

`string`

Cache key (usually hash of text)

#### Returns

`Promise`\<`number`[]\>

Cached embedding or null if not found

***

### ~~set()~~

> **set**(`key`, `embedding`): `Promise`\<`void`\>

Defined in: [rag/src/embeddings/cache.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L49)

Store embedding in cache.

#### Parameters

##### key

`string`

Cache key

##### embedding

`number`[]

Embedding vector to cache

#### Returns

`Promise`\<`void`\>

***

### ~~clear()~~

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/embeddings/cache.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L54)

Clear all cached embeddings.

#### Returns

`Promise`\<`void`\>

***

### ~~size()?~~

> `optional` **size**(): `number`

Defined in: [rag/src/embeddings/cache.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L59)

Get current cache size (optional).

#### Returns

`number`
