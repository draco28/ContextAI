[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BudgetResult

# Interface: BudgetResult

Defined in: [rag/src/assembly/token-budget.ts:116](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L116)

Result of applying token budget to chunks.

## Properties

### included

> **included**: [`Chunk`](Chunk.md)[]

Defined in: [rag/src/assembly/token-budget.ts:118](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L118)

Chunks that fit within budget

***

### dropped

> **dropped**: [`Chunk`](Chunk.md)[]

Defined in: [rag/src/assembly/token-budget.ts:120](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L120)

Chunks dropped due to budget

***

### usedTokens

> **usedTokens**: `number`

Defined in: [rag/src/assembly/token-budget.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L122)

Total tokens used by included chunks

***

### remainingTokens

> **remainingTokens**: `number`

Defined in: [rag/src/assembly/token-budget.ts:124](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L124)

Remaining token budget

***

### wasTruncated

> **wasTruncated**: `boolean`

Defined in: [rag/src/assembly/token-budget.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L126)

Whether any chunks were truncated
