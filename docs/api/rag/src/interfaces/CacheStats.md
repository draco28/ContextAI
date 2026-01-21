[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / CacheStats

# Interface: CacheStats

Defined in: [rag/src/cache/types.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L56)

Cache statistics for monitoring and debugging.

## Properties

### hits

> **hits**: `number`

Defined in: [rag/src/cache/types.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L58)

Number of cache hits

***

### misses

> **misses**: `number`

Defined in: [rag/src/cache/types.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L60)

Number of cache misses

***

### size

> **size**: `number`

Defined in: [rag/src/cache/types.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L62)

Current number of entries in the cache

***

### hitRate

> **hitRate**: `number`

Defined in: [rag/src/cache/types.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/types.ts#L64)

Hit rate as a decimal (0-1). Returns 0 if no requests yet.
