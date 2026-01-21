[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / orderBySandwich

# Function: orderBySandwich()

> **orderBySandwich**(`results`, `startCount?`): [`RerankerResult`](../interfaces/RerankerResult.md)[]

Defined in: [rag/src/assembly/ordering.ts:88](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L88)

Sandwich ordering: most relevant at start and end.

This mitigates the "lost in the middle" problem where LLMs
attend less to content in the middle of the context.

Algorithm:
1. Take top `startCount` items for the beginning
2. Place remaining items at the end in reverse relevance order

Example with 8 items, startCount=3:
Input (by relevance):  [1, 2, 3, 4, 5, 6, 7, 8]
Output (sandwich):     [1, 2, 3, 8, 7, 6, 5, 4]

The most relevant items (1, 2, 3) are at the start where
they get high attention. The next most relevant (4, 5) are
at the end where attention recovers. The least relevant
items (6, 7, 8) are buried in the middle.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Results sorted by relevance descending

### startCount?

`number`

Number of top items to place at start (default: half)

## Returns

[`RerankerResult`](../interfaces/RerankerResult.md)[]
