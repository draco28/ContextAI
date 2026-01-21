[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / findSizeIndex

# Function: findSizeIndex()

> **findSizeIndex**(`text`, `targetSize`, `unit`): `number`

Defined in: [rag/src/chunking/token-counter.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L123)

Find the index where text exceeds a size limit.

Useful for splitting text at a target size boundary.

## Parameters

### text

`string`

The text to search

### targetSize

`number`

Maximum size

### unit

[`SizeUnit`](../type-aliases/SizeUnit.md)

Size unit

## Returns

`number`

Index where size is exceeded, or text.length if under limit

## Example

```typescript
// Find where we hit 10 tokens
const idx = findSizeIndex('This is a sample text for testing', 10, 'tokens');
const chunk = text.slice(0, idx); // First 10 tokens worth
```
