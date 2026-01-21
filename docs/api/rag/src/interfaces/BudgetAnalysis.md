[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BudgetAnalysis

# Interface: BudgetAnalysis

Defined in: [rag/src/assembly/token-budget.ts:306](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L306)

Analysis of token budget usage.

## Properties

### budget

> **budget**: `number`

Defined in: [rag/src/assembly/token-budget.ts:308](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L308)

Token budget

***

### totalChunks

> **totalChunks**: `number`

Defined in: [rag/src/assembly/token-budget.ts:310](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L310)

Total number of chunks

***

### totalTokens

> **totalTokens**: `number`

Defined in: [rag/src/assembly/token-budget.ts:312](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L312)

Total tokens across all chunks

***

### includedCount

> **includedCount**: `number`

Defined in: [rag/src/assembly/token-budget.ts:314](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L314)

Number of chunks that fit in budget

***

### droppedCount

> **droppedCount**: `number`

Defined in: [rag/src/assembly/token-budget.ts:316](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L316)

Number of chunks that exceed budget

***

### budgetUtilization

> **budgetUtilization**: `number`

Defined in: [rag/src/assembly/token-budget.ts:318](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L318)

Percentage of budget used by included chunks

***

### chunks

> **chunks**: [`ChunkTokenAnalysis`](ChunkTokenAnalysis.md)[]

Defined in: [rag/src/assembly/token-budget.ts:320](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L320)

Per-chunk analysis
