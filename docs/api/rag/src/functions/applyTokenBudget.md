[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / applyTokenBudget

# Function: applyTokenBudget()

> **applyTokenBudget**(`chunks`, `budget`, `overflowStrategy`, `formattingOverhead`): [`BudgetResult`](../interfaces/BudgetResult.md)

Defined in: [rag/src/assembly/token-budget.ts:148](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L148)

Apply token budget to a list of chunks.

Processes chunks in order, including as many as fit within budget.
Handles overflow according to the configured strategy.

## Parameters

### chunks

[`Chunk`](../interfaces/Chunk.md)[]

Chunks to process (in desired order)

### budget

`number`

Maximum tokens to use

### overflowStrategy

How to handle chunks that exceed remaining budget

`"truncate"` | `"drop"`

### formattingOverhead

`number` = `50`

Extra chars per chunk for formatting

## Returns

[`BudgetResult`](../interfaces/BudgetResult.md)

Result with included/dropped chunks and token stats

## Example

```typescript
const result = applyTokenBudget(chunks, 1000, 'drop');
console.log(`Included ${result.included.length} chunks`);
console.log(`Used ${result.usedTokens} of 1000 tokens`);
```
