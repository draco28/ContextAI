[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RankedItem

# Interface: RankedItem

Defined in: [rag/src/retrieval/types.ts:247](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L247)

A ranked item for RRF fusion.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/retrieval/types.ts:249](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L249)

Item identifier

***

### rank

> **rank**: `number`

Defined in: [rag/src/retrieval/types.ts:251](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L251)

Rank in this list (1-indexed)

***

### score

> **score**: `number`

Defined in: [rag/src/retrieval/types.ts:253](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L253)

Original score from this ranker

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/retrieval/types.ts:255](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L255)

The chunk data
