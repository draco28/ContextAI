[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / TokenBudgetConfig

# Interface: TokenBudgetConfig

Defined in: [rag/src/assembly/types.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L63)

Configuration for token budget management.

Ensures assembled context fits within LLM context window limits.

## Properties

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [rag/src/assembly/types.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L68)

Maximum tokens allowed for the assembled context.
If not set, uses contextWindowSize * budgetPercentage.

***

### contextWindowSize?

> `optional` **contextWindowSize**: `number`

Defined in: [rag/src/assembly/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L75)

Total context window size of the target LLM.
Used with budgetPercentage to calculate maxTokens.
Default: 8192 (GPT-3.5 default)

***

### budgetPercentage?

> `optional` **budgetPercentage**: `number`

Defined in: [rag/src/assembly/types.ts:82](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L82)

Percentage of context window to use for retrieved context.
Leaves room for system prompt, user query, and response.
Default: 0.5 (50%)

***

### overflowStrategy?

> `optional` **overflowStrategy**: `"truncate"` \| `"drop"`

Defined in: [rag/src/assembly/types.ts:90](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L90)

How to handle chunks that exceed the budget.
- 'truncate': Include partial chunk content
- 'drop': Exclude the chunk entirely
Default: 'drop'
