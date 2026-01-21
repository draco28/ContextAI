[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RRFResult

# Interface: RRFResult

Defined in: [rag/src/retrieval/types.ts:261](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L261)

Result of RRF fusion.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/retrieval/types.ts:263](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L263)

Item identifier

***

### score

> **score**: `number`

Defined in: [rag/src/retrieval/types.ts:265](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L265)

Fused RRF score

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/retrieval/types.ts:267](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L267)

The chunk data

***

### contributions

> **contributions**: `object`[]

Defined in: [rag/src/retrieval/types.ts:269](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L269)

Contribution from each ranker

#### name

> **name**: `string`

Ranker name

#### rank?

> `optional` **rank**: `number`

Rank in this ranker's list (undefined if not present)

#### score?

> `optional` **score**: `number`

Original score from this ranker (undefined if not present)

#### contribution

> **contribution**: `number`

RRF contribution to final score
