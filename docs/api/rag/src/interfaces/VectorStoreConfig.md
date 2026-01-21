[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / VectorStoreConfig

# Interface: VectorStoreConfig

Defined in: [rag/src/vector-store/types.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L140)

Configuration for vector stores.

## Properties

### dimensions

> **dimensions**: `number`

Defined in: [rag/src/vector-store/types.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L142)

Dimension of embedding vectors

***

### distanceMetric?

> `optional` **distanceMetric**: [`DistanceMetric`](../type-aliases/DistanceMetric.md)

Defined in: [rag/src/vector-store/types.ts:144](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L144)

Distance metric for similarity (default: 'cosine')
