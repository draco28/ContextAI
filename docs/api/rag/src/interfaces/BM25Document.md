[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BM25Document

# Interface: BM25Document

Defined in: [rag/src/retrieval/types.ts:190](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L190)

A document prepared for BM25 indexing.
Must have an id and content at minimum.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/retrieval/types.ts:192](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L192)

Unique identifier

***

### content

> **content**: `string`

Defined in: [rag/src/retrieval/types.ts:194](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L194)

Text content to index

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/retrieval/types.ts:196](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L196)

Original chunk (preserved for retrieval results)
