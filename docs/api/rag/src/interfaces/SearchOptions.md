[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SearchOptions

# Interface: SearchOptions

Defined in: [rag/src/vector-store/types.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L97)

Options for similarity search.

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/vector-store/types.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L99)

Maximum number of results to return (default: 10)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/vector-store/types.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L101)

Minimum similarity score threshold (0-1 for cosine)

***

### filter?

> `optional` **filter**: [`MetadataFilter`](../type-aliases/MetadataFilter.md)

Defined in: [rag/src/vector-store/types.ts:103](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L103)

Filter results by metadata

***

### includeMetadata?

> `optional` **includeMetadata**: `boolean`

Defined in: [rag/src/vector-store/types.ts:105](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L105)

Include full metadata in results (default: true)

***

### includeVectors?

> `optional` **includeVectors**: `boolean`

Defined in: [rag/src/vector-store/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L107)

Include embedding vectors in results (default: false)
