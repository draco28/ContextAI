[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / convertSize

# Function: convertSize()

> **convertSize**(`size`, `fromUnit`, `toUnit`): `number`

Defined in: [rag/src/chunking/token-counter.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L91)

Convert a size from one unit to another.

## Parameters

### size

`number`

The size value

### fromUnit

[`SizeUnit`](../type-aliases/SizeUnit.md)

Source unit

### toUnit

[`SizeUnit`](../type-aliases/SizeUnit.md)

Target unit

## Returns

`number`

Converted size

## Example

```typescript
convertSize(100, 'tokens', 'characters'); // => 400
convertSize(400, 'characters', 'tokens'); // => 100
```
