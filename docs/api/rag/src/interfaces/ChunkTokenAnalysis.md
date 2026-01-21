[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkTokenAnalysis

# Interface: ChunkTokenAnalysis

Defined in: [rag/src/assembly/token-budget.ts:290](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L290)

Token analysis for a single chunk.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/assembly/token-budget.ts:292](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L292)

Chunk ID

***

### tokens

> **tokens**: `number`

Defined in: [rag/src/assembly/token-budget.ts:294](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L294)

Estimated tokens for this chunk

***

### cumulativeTokens

> **cumulativeTokens**: `number`

Defined in: [rag/src/assembly/token-budget.ts:296](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L296)

Cumulative tokens including this chunk

***

### fitsInBudget

> **fitsInBudget**: `boolean`

Defined in: [rag/src/assembly/token-budget.ts:298](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L298)

Whether this chunk fits in budget

***

### percentOfBudget

> **percentOfBudget**: `number`

Defined in: [rag/src/assembly/token-budget.ts:300](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L300)

This chunk's percentage of total budget
