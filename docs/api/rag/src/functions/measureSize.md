[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / measureSize

# Function: measureSize()

> **measureSize**(`text`, `unit`): `number`

Defined in: [rag/src/chunking/token-counter.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L73)

Measure text size using the specified unit.

## Parameters

### text

`string`

The text to measure

### unit

[`SizeUnit`](../type-aliases/SizeUnit.md)

'tokens' or 'characters'

## Returns

`number`

Size in the specified unit

## Example

```typescript
measureSize('Hello, world!', 'tokens'); // => 4
measureSize('Hello, world!', 'characters'); // => 13
```
