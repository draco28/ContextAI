[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkWithEmbedding

# Interface: ChunkWithEmbedding

Defined in: [rag/src/vector-store/types.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L52)

A chunk with its embedding vector.

This is the input format for vector stores.

## Extends

- [`Chunk`](Chunk.md)

## Properties

### id

> **id**: `string`

Defined in: [rag/src/vector-store/types.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L38)

Unique identifier for this chunk

#### Inherited from

[`Chunk`](Chunk.md).[`id`](Chunk.md#id)

***

### content

> **content**: `string`

Defined in: [rag/src/vector-store/types.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L40)

The text content of the chunk

#### Inherited from

[`Chunk`](Chunk.md).[`content`](Chunk.md#content)

***

### metadata

> **metadata**: [`ChunkMetadata`](ChunkMetadata.md)

Defined in: [rag/src/vector-store/types.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L42)

Chunk metadata (position, page, custom fields)

#### Inherited from

[`Chunk`](Chunk.md).[`metadata`](Chunk.md#metadata)

***

### documentId?

> `optional` **documentId**: `string`

Defined in: [rag/src/vector-store/types.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L44)

ID of the source document

#### Inherited from

[`Chunk`](Chunk.md).[`documentId`](Chunk.md#documentid)

***

### embedding

> **embedding**: `number`[]

Defined in: [rag/src/vector-store/types.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L54)

The embedding vector (should be normalized)
