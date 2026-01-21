[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / analyzeBudget

# Function: analyzeBudget()

> **analyzeBudget**(`chunks`, `budget`, `formattingOverhead`): [`BudgetAnalysis`](../interfaces/BudgetAnalysis.md)

Defined in: [rag/src/assembly/token-budget.ts:249](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L249)

Analyze how chunks would fill the token budget.

Useful for planning and debugging without modifying chunks.

## Parameters

### chunks

[`Chunk`](../interfaces/Chunk.md)[]

Chunks to analyze

### budget

`number`

Token budget

### formattingOverhead

`number` = `50`

Extra chars per chunk for formatting

## Returns

[`BudgetAnalysis`](../interfaces/BudgetAnalysis.md)

Analysis of budget usage
