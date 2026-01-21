[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / findSimilarPairs

# Function: findSimilarPairs()

> **findSimilarPairs**(`results`, `threshold`): [`SimilarPair`](../interfaces/SimilarPair.md)[]

Defined in: [rag/src/assembly/deduplication.ts:211](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L211)

Find all pairs of similar chunks above threshold.

Useful for analysis and debugging.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Results to analyze

### threshold

`number` = `0.7`

Minimum similarity to report

## Returns

[`SimilarPair`](../interfaces/SimilarPair.md)[]

Array of similar pairs
