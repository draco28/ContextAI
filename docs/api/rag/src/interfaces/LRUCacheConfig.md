[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LRUCacheConfig

# Interface: LRUCacheConfig

Defined in: [rag/src/cache/types.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L70)

Configuration for LRU cache provider.

## Properties

### maxSize?

> `optional` **maxSize**: `number`

Defined in: [rag/src/cache/types.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L76)

Maximum number of entries in the cache.
When exceeded, least-recently-used entries are evicted.

#### Default

```ts
10000
```

***

### defaultTtl?

> `optional` **defaultTtl**: `number`

Defined in: [rag/src/cache/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L83)

Default time-to-live in milliseconds.
Individual `set()` calls can override this.
If not set, entries never expire (only evicted by LRU).
