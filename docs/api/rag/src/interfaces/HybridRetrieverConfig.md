[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HybridRetrieverConfig

# Interface: HybridRetrieverConfig

Defined in: [rag/src/retrieval/types.ts:218](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L218)

Configuration for hybrid retriever.

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/retrieval/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L220)

Name for this retriever instance

***

### defaultAlpha?

> `optional` **defaultAlpha**: `number`

Defined in: [rag/src/retrieval/types.ts:227](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L227)

Default alpha value for retrieval.
Can be overridden per-query via options.
Default: 0.5 (balanced)

***

### rrfK?

> `optional` **rrfK**: `number`

Defined in: [rag/src/retrieval/types.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L234)

RRF k parameter.
Higher values reduce the impact of rank differences.
Default: 60 (standard value)

***

### bm25Config?

> `optional` **bm25Config**: [`BM25Config`](BM25Config.md)

Defined in: [rag/src/retrieval/types.ts:237](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L237)

BM25 configuration for the sparse component
