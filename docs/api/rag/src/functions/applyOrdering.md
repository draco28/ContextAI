[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applyOrdering

# Function: applyOrdering()

> **applyOrdering**(`results`, `strategy`, `sandwichStartCount?`): [`RerankerResult`](../interfaces/RerankerResult.md)[]

Defined in: [rag/src/assembly/ordering.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L29)

Apply ordering strategy to reranked results.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Reranked results (already sorted by score descending)

### strategy

[`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Ordering strategy to apply

### sandwichStartCount?

`number`

For 'sandwich': how many top items at start

## Returns

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Results in the requested order

## Example

```typescript
// Sandwich ordering: put best at edges
const ordered = applyOrdering(results, 'sandwich', 3);
// [1st, 2nd, 3rd, 8th, 7th, 6th, 5th, 4th]
//  ^---------^     ^-------------------^
//  top 3 at start  remaining in reverse at end
```
