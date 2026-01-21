[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / orderByRelevance

# Function: orderByRelevance()

> **orderByRelevance**(`results`): [`RerankerResult`](../interfaces/RerankerResult.md)[]

Defined in: [rag/src/assembly/ordering.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L62)

Order by relevance score descending (default).

Results are typically already in this order from reranking,
but this ensures consistency.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

## Returns

[`RerankerResult`](../interfaces/RerankerResult.md)[]
