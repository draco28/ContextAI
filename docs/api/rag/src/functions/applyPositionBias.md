[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applyPositionBias

# Function: applyPositionBias()

> **applyPositionBias**\<`T`\>(`results`, `config`): `T`[]

Defined in: [rag/src/reranker/position-bias.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L46)

Apply position bias mitigation to reranked results.

Takes results sorted by relevance and reorders them to optimize
for LLM attention patterns based on the chosen strategy.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### results

`T`[]

Results sorted by relevance (descending)

### config

[`PositionBiasConfig`](../interfaces/PositionBiasConfig.md)

Position bias configuration

## Returns

`T`[]

Reordered results

## Example

```typescript
// Default sandwich: alternating top items at edges
const reordered = applyPositionBias(results, { strategy: 'sandwich' });

// Custom split: top 2 at start, remaining top at end
const reordered = applyPositionBias(results, {
  strategy: 'sandwich',
  startCount: 2,
});
```
