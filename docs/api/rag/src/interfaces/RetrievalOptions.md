[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RetrievalOptions

# Interface: RetrievalOptions

Defined in: [rag/src/retrieval/types.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L62)

Options for retrieval queries.

## Extended by

- [`HybridRetrievalOptions`](HybridRetrievalOptions.md)

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/retrieval/types.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L64)

Maximum number of results to return (default: 10)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/retrieval/types.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L66)

Minimum score threshold (0-1)

***

### filter?

> `optional` **filter**: [`MetadataFilter`](../type-aliases/MetadataFilter.md)

Defined in: [rag/src/retrieval/types.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L68)

Filter results by metadata

***

### includeMetadata?

> `optional` **includeMetadata**: `boolean`

Defined in: [rag/src/retrieval/types.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L70)

Include full metadata in results (default: true)
