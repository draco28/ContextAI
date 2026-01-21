[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DuplicateInfo

# Interface: DuplicateInfo

Defined in: [rag/src/assembly/deduplication.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L108)

Information about a removed duplicate.

## Properties

### removed

> **removed**: [`RerankerResult`](RerankerResult.md)

Defined in: [rag/src/assembly/deduplication.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L110)

The removed result

***

### keptId

> **keptId**: `string`

Defined in: [rag/src/assembly/deduplication.ts:112](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L112)

The kept result it was similar to

***

### similarity

> **similarity**: `number`

Defined in: [rag/src/assembly/deduplication.ts:114](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L114)

Similarity score between them
