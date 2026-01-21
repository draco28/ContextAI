[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / normalizeRRFScores

# Function: normalizeRRFScores()

> **normalizeRRFScores**(`results`, `numRankers`, `k`): [`RRFResult`](../interfaces/RRFResult.md)[]

Defined in: [rag/src/retrieval/rrf.ts:199](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L199)

Normalize RRF scores to 0-1 range.

Uses the theoretical maximum score (ranked #1 in all lists) as the normalizer.

## Parameters

### results

[`RRFResult`](../interfaces/RRFResult.md)[]

RRF results to normalize

### numRankers

`number`

Number of ranking lists used

### k

`number` = `DEFAULT_RRF_K`

RRF k parameter (default: 60)

## Returns

[`RRFResult`](../interfaces/RRFResult.md)[]

Results with normalized scores
