[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RetrievalResult

# Interface: RetrievalResult

Defined in: [rag/src/retrieval/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L37)

A single retrieval result with scoring transparency.

Unlike SearchResult which only has a single score, RetrievalResult
provides full breakdown of how the result was ranked.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/retrieval/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L39)

Unique identifier of the retrieved chunk

***

### chunk

> **chunk**: [`Chunk`](Chunk.md)

Defined in: [rag/src/retrieval/types.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L41)

The retrieved chunk content

***

### score

> **score**: `number`

Defined in: [rag/src/retrieval/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L43)

The final relevance score (higher = more relevant)

***

### scores?

> `optional` **scores**: [`HybridScore`](HybridScore.md)

Defined in: [rag/src/retrieval/types.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L48)

Breakdown of scores by retrieval method.
Only present when using hybrid retrieval.

***

### denseRank?

> `optional` **denseRank**: `number`

Defined in: [rag/src/retrieval/types.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L50)

Original rank in dense results (1-indexed, undefined if not in dense results)

***

### sparseRank?

> `optional` **sparseRank**: `number`

Defined in: [rag/src/retrieval/types.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L52)

Original rank in sparse results (1-indexed, undefined if not in sparse results)
