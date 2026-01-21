[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applySandwichOrdering

# Function: applySandwichOrdering()

> **applySandwichOrdering**\<`T`\>(`results`, `startCount?`): `T`[]

Defined in: [rag/src/reranker/position-bias.ts:80](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L80)

Sandwich ordering: Place most relevant documents at start and end.

Pattern (for 7 docs, startCount=3):
Original:  [1, 2, 3, 4, 5, 6, 7] (ranked by relevance)
Sandwich:  [1, 2, 3, 6, 7, 5, 4] (top 3 at start, remaining reversed at end)

This ensures the most important content is at positions where
LLMs pay the most attention (beginning and end).

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### results

`T`[]

Results sorted by relevance (descending)

### startCount?

`number`

Number of top items to place at start (default: half)

## Returns

`T`[]

Reordered results with top items at edges
