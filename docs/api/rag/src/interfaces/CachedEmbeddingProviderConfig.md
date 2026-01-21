[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / CachedEmbeddingProviderConfig

# Interface: CachedEmbeddingProviderConfig

Defined in: [rag/src/embeddings/cache.ts:175](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L175)

Configuration for cached embedding provider.

## Properties

### provider

> **provider**: [`EmbeddingProvider`](EmbeddingProvider.md)

Defined in: [rag/src/embeddings/cache.ts:177](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L177)

The underlying embedding provider

***

### cache?

> `optional` **cache**: [`EmbeddingCache`](EmbeddingCache.md)

Defined in: [rag/src/embeddings/cache.ts:179](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L179)

Cache implementation (defaults to LRUEmbeddingCache)

***

### maxCacheSize?

> `optional` **maxCacheSize**: `number`

Defined in: [rag/src/embeddings/cache.ts:181](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L181)

Maximum cache size if using default LRU cache
