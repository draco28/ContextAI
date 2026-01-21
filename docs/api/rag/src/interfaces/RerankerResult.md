[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RerankerResult

# Interface: RerankerResult

Defined in: [rag/src/reranker/types.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L41)

A single reranked result with score transparency.

Extends RetrievalResult with reranking-specific information
to show how the result's rank changed and why.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/reranker/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L43)

Unique identifier of the chunk

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/reranker/types.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L45)

The reranked chunk content

***

### score

> **score**: `number`

Defined in: [rag/src/reranker/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L47)

The final relevance score after reranking (0-1, higher = more relevant)

***

### originalRank

> **originalRank**: `number`

Defined in: [rag/src/reranker/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L49)

Original rank before reranking (1-indexed)

***

### newRank

> **newRank**: `number`

Defined in: [rag/src/reranker/types.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L51)

New rank after reranking (1-indexed)

***

### scores

> **scores**: [`RerankerScores`](RerankerScores.md)

Defined in: [rag/src/reranker/types.ts:53](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L53)

Score breakdown for transparency
