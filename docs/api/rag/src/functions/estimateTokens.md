[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / estimateTokens

# Function: estimateTokens()

> **estimateTokens**(`text`): `number`

Defined in: [rag/src/chunking/token-counter.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L45)

Estimate the number of tokens in a text string.

Uses a simple heuristic: tokens ≈ characters / 4

## Parameters

### text

`string`

The text to count tokens for

## Returns

`number`

Estimated token count (always >= 0)

## Example

```typescript
estimateTokens('Hello, world!'); // => 4 (13 chars / 4 ≈ 3.25, rounded up)
estimateTokens(''); // => 0
```
