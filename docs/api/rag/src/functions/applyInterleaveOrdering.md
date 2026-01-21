[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applyInterleaveOrdering

# Function: applyInterleaveOrdering()

> **applyInterleaveOrdering**\<`T`\>(`results`): `T`[]

Defined in: [rag/src/reranker/position-bias.ts:164](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L164)

Interleave ordering: Alternate between high and low relevance.

Pattern (for 6 docs):
Original:    [1, 2, 3, 4, 5, 6] (by relevance)
Interleaved: [1, 6, 2, 5, 3, 4] (high-low-high-low...)

This spreads important content throughout, ensuring no section
of the context is entirely low-value.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### results

`T`[]

## Returns

`T`[]
