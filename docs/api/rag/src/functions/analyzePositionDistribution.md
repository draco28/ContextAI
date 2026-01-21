[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / analyzePositionDistribution

# Function: analyzePositionDistribution()

> **analyzePositionDistribution**(`results`, `topK`): `object`

Defined in: [rag/src/reranker/position-bias.ts:200](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L200)

Analyze the position distribution of top-k results.

Useful for understanding how reordering affects the placement
of the most important documents.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Results with original and new ranks

### topK

`number` = `5`

Number of top results to analyze

## Returns

Analysis of position distribution

### topKPositions

> **topKPositions**: `number`[]

Indices where top-k items are placed (0-indexed)

### topAtStart

> **topAtStart**: `boolean`

Whether top items are at start (first quartile)

### topAtEnd

> **topAtEnd**: `boolean`

Whether top items are at end (last quartile)

### middleConcentration

> **middleConcentration**: `number`

Fraction of top items in middle half
