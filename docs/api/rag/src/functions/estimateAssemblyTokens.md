[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / estimateAssemblyTokens

# Function: estimateAssemblyTokens()

> **estimateAssemblyTokens**(`text`): `number`

Defined in: [rag/src/assembly/token-budget.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L44)

Estimate token count for a string.

Uses character-based heuristic (4 chars ≈ 1 token).
This is approximate but fast and suitable for budget management.

For precise counts, use a model-specific tokenizer.

## Parameters

### text

`string`

Text to estimate tokens for

## Returns

`number`

Estimated token count

## Example

```typescript
estimateTokens('Hello, world!'); // ~4 tokens
estimateTokens('A longer sentence with more words.'); // ~9 tokens
```
