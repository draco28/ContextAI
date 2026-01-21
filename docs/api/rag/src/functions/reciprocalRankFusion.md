[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / reciprocalRankFusion

# Function: reciprocalRankFusion()

> **reciprocalRankFusion**(`rankings`, `k`): [`RRFResult`](../interfaces/RRFResult.md)[]

Defined in: [rag/src/retrieval/rrf.ts:84](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L84)

Fuse multiple ranking lists using Reciprocal Rank Fusion.

The formula is: RRFscore(d) = Σ 1/(k + rank_i(d))

Where:
- d is a document
- rank_i(d) is the rank of d in list i (1-indexed)
- k is a smoothing constant (default: 60)

## Parameters

### rankings

[`RankingList`](../interfaces/RankingList.md)[]

Array of ranking lists to fuse

### k

`number` = `DEFAULT_RRF_K`

RRF k parameter (default: 60)

## Returns

[`RRFResult`](../interfaces/RRFResult.md)[]

Fused results sorted by RRF score (descending)

## Example

```typescript
const denseRanking = {
  name: 'dense',
  items: [
    { id: 'a', rank: 1, score: 0.95, chunk: {...} },
    { id: 'b', rank: 2, score: 0.87, chunk: {...} },
  ]
};

const sparseRanking = {
  name: 'sparse',
  items: [
    { id: 'b', rank: 1, score: 0.90, chunk: {...} },
    { id: 'c', rank: 2, score: 0.75, chunk: {...} },
  ]
};

const fused = reciprocalRankFusion([denseRanking, sparseRanking]);
// Result: [
//   { id: 'b', score: 0.0328, contributions: [...] }, // In both lists
//   { id: 'a', score: 0.0164, contributions: [...] }, // Only in dense
//   { id: 'c', score: 0.0161, contributions: [...] }, // Only in sparse
// ]
```
