[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingProviderConfig

# Interface: EmbeddingProviderConfig

Defined in: [rag/src/embeddings/types.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L31)

Configuration for embedding providers.

## Properties

### model

> **model**: `string`

Defined in: [rag/src/embeddings/types.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L33)

Model identifier (e.g., "text-embedding-3-small")

***

### dimensions?

> `optional` **dimensions**: `number`

Defined in: [rag/src/embeddings/types.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L35)

Output embedding dimensions (some models support variable)

***

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [rag/src/embeddings/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L37)

Maximum texts per batch request

***

### normalize?

> `optional` **normalize**: `boolean`

Defined in: [rag/src/embeddings/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L39)

Whether to normalize embeddings to unit length (default: true)
