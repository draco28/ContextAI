[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / calculateTokenBudget

# Function: calculateTokenBudget()

> **calculateTokenBudget**(`config?`): `number`

Defined in: [rag/src/assembly/token-budget.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L92)

Calculate the effective token budget from configuration.

Priority:
1. Explicit maxTokens if provided
2. Calculated from contextWindowSize * budgetPercentage

## Parameters

### config?

[`TokenBudgetConfig`](../interfaces/TokenBudgetConfig.md)

Token budget configuration

## Returns

`number`

Effective maximum tokens
