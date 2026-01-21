[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / maxRRFScore

# Function: maxRRFScore()

> **maxRRFScore**(`numRankers`, `k`): `number`

Defined in: [rag/src/retrieval/rrf.ts:181](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L181)

Calculate the maximum possible RRF score for N rankers.

This is useful for normalizing RRF scores to 0-1 range.
The max score occurs when a document is ranked #1 in all rankers.

## Parameters

### numRankers

`number`

Number of ranking lists

### k

`number` = `DEFAULT_RRF_K`

RRF k parameter (default: 60)

## Returns

`number`

Maximum possible RRF score
