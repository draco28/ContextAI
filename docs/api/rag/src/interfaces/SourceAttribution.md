[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SourceAttribution

# Interface: SourceAttribution

Defined in: [rag/src/assembly/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L37)

Attribution information for a source chunk.

Provides traceability from assembled context back to original documents.

## Properties

### index

> **index**: `number`

Defined in: [rag/src/assembly/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L39)

Sequential index in the assembled context (1-indexed)

***

### chunkId

> **chunkId**: `string`

Defined in: [rag/src/assembly/types.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L41)

Original chunk ID

***

### documentId?

> `optional` **documentId**: `string`

Defined in: [rag/src/assembly/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L43)

Source document ID (if available)

***

### source?

> `optional` **source**: `string`

Defined in: [rag/src/assembly/types.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L45)

File path or URL (if available in metadata)

***

### location?

> `optional` **location**: `string`

Defined in: [rag/src/assembly/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L47)

Line or page number (if available)

***

### score

> **score**: `number`

Defined in: [rag/src/assembly/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L49)

Relevance score (0-1)

***

### section?

> `optional` **section**: `string`

Defined in: [rag/src/assembly/types.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L51)

Section or heading (if available)
