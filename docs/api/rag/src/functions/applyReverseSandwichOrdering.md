[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applyReverseSandwichOrdering

# Function: applyReverseSandwichOrdering()

> **applyReverseSandwichOrdering**\<`T`\>(`results`): `T`[]

Defined in: [rag/src/reranker/position-bias.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L119)

Reverse sandwich: Place less relevant at edges, most relevant in middle.

Pattern (for 7 docs):
Original:        [1, 2, 3, 4, 5, 6, 7]
Reverse-sandwich: [7, 5, 3, 1, 2, 4, 6]

Useful when you want to "bury" less important context while
keeping most important in a focused middle section.

Note: This is counterintuitive for most use cases. Only use when
you specifically want LLMs to focus on the middle of context.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### results

`T`[]

## Returns

`T`[]
