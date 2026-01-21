[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / InternalRerankerResult

# Interface: InternalRerankerResult

Defined in: [rag/src/reranker/base-reranker.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L24)

Internal result from subclass _rerank() implementation.
Contains the essential scoring information before transformation.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/reranker/base-reranker.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L26)

Chunk ID

***

### score

> **score**: `number`

Defined in: [rag/src/reranker/base-reranker.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L28)

Reranker's score (may need normalization)

***

### original

> **original**: [`RetrievalResult`](RetrievalResult.md)

Defined in: [rag/src/reranker/base-reranker.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L30)

Original result for reference

***

### scoreComponents?

> `optional` **scoreComponents**: `Partial`\<[`RerankerScores`](RerankerScores.md)\>

Defined in: [rag/src/reranker/base-reranker.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L32)

Additional score components (reranker-specific)
