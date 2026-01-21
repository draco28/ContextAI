[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / splitBySize

# Function: splitBySize()

> **splitBySize**(`text`, `targetSize`, `unit`, `overlap`): `string`[]

Defined in: [rag/src/chunking/token-counter.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L150)

Split text into segments of approximately equal size.

Note: This is a utility for fixed-size chunking. Segments may be
slightly smaller than targetSize due to rounding.

## Parameters

### text

`string`

Text to split

### targetSize

`number`

Target size per segment

### unit

[`SizeUnit`](../type-aliases/SizeUnit.md)

Size unit

### overlap

`number` = `0`

Overlap between segments (default: 0)

## Returns

`string`[]

Array of text segments
