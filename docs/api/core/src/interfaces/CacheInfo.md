[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / CacheInfo

# Interface: CacheInfo

Defined in: [core/src/provider/types.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L77)

Cache information from provider response

## Properties

### hit

> **hit**: `boolean`

Defined in: [core/src/provider/types.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L79)

Whether the response was served from cache

***

### tokensSaved?

> `optional` **tokensSaved**: `number`

Defined in: [core/src/provider/types.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L81)

Number of tokens saved by cache hit

***

### ttlSeconds?

> `optional` **ttlSeconds**: `number`

Defined in: [core/src/provider/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L83)

Cache TTL in seconds
