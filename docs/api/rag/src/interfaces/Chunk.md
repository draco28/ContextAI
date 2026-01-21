[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / Chunk

# Interface: Chunk

Defined in: [rag/src/vector-store/types.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L36)

A text chunk ready for embedding or already embedded.

Chunks are the output of chunkers and input to embedding providers.

## Extended by

- [`ChunkWithEmbedding`](ChunkWithEmbedding.md)

## Properties

### id

> **id**: `string`

Defined in: [rag/src/vector-store/types.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L38)

Unique identifier for this chunk

***

### content

> **content**: `string`

Defined in: [rag/src/vector-store/types.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L40)

The text content of the chunk

***

### metadata

> **metadata**: [`ChunkMetadata`](ChunkMetadata.md)

Defined in: [rag/src/vector-store/types.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L42)

Chunk metadata (position, page, custom fields)

***

### documentId?

> `optional` **documentId**: `string`

Defined in: [rag/src/vector-store/types.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L44)

ID of the source document
