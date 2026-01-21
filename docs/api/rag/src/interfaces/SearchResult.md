[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SearchResult

# Interface: SearchResult

Defined in: [rag/src/vector-store/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L113)

A single search result with similarity score.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/vector-store/types.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L115)

Chunk ID

***

### score

> **score**: `number`

Defined in: [rag/src/vector-store/types.ts:117](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L117)

Similarity score (higher = more similar)

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/vector-store/types.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L119)

The matched chunk

***

### embedding?

> `optional` **embedding**: `number`[]

Defined in: [rag/src/vector-store/types.ts:121](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L121)

The embedding vector (if includeVectors was true)
