[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / rrfScore

# Function: rrfScore()

> **rrfScore**(`rank`, `k`): `number`

Defined in: [rag/src/retrieval/rrf.ts:167](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L167)

Calculate the RRF score contribution for a given rank.

## Parameters

### rank

`number`

The rank (1-indexed)

### k

`number` = `DEFAULT_RRF_K`

RRF k parameter (default: 60)

## Returns

`number`

RRF contribution value
