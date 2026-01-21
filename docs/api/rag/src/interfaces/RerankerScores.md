[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RerankerScores

# Interface: RerankerScores

Defined in: [rag/src/reranker/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L24)

Score breakdown showing how the final score was computed.

Different rerankers populate different fields:
- BGE: originalScore + rerankerScore
- MMR: originalScore + relevanceScore + diversityPenalty
- LLM: originalScore + rerankerScore

## Properties

### originalScore

> **originalScore**: `number`

Defined in: [rag/src/reranker/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L26)

Original score from the retriever (before reranking)

***

### rerankerScore

> **rerankerScore**: `number`

Defined in: [rag/src/reranker/types.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L28)

Score assigned by the reranker

***

### relevanceScore?

> `optional` **relevanceScore**: `number`

Defined in: [rag/src/reranker/types.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L30)

For MMR: relevance component (similarity to query)

***

### diversityPenalty?

> `optional` **diversityPenalty**: `number`

Defined in: [rag/src/reranker/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L32)

For MMR: diversity penalty (similarity to already-selected docs)
