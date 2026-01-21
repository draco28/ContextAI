[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AssembledContext

# Interface: AssembledContext

Defined in: [rag/src/assembly/types.ts:135](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L135)

Result of context assembly operation.

Contains the formatted context string plus metadata for debugging
and citation generation.

## Properties

### content

> **content**: `string`

Defined in: [rag/src/assembly/types.ts:137](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L137)

The formatted context string ready for LLM consumption

***

### estimatedTokens

> **estimatedTokens**: `number`

Defined in: [rag/src/assembly/types.ts:143](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L143)

Token count estimate.
Uses simple heuristic: ~4 characters per token.

***

### chunkCount

> **chunkCount**: `number`

Defined in: [rag/src/assembly/types.ts:146](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L146)

Number of chunks included in the assembled context

***

### deduplicatedCount

> **deduplicatedCount**: `number`

Defined in: [rag/src/assembly/types.ts:149](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L149)

Number of chunks removed by deduplication

***

### droppedCount

> **droppedCount**: `number`

Defined in: [rag/src/assembly/types.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L152)

Number of chunks dropped due to token budget

***

### sources

> **sources**: [`SourceAttribution`](SourceAttribution.md)[]

Defined in: [rag/src/assembly/types.ts:155](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L155)

Source attributions for all included chunks

***

### chunks

> **chunks**: [`Chunk`](Chunk.md)[]

Defined in: [rag/src/assembly/types.ts:161](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L161)

The chunks in their final order (after ordering and filtering).
Useful for debugging or further processing.
