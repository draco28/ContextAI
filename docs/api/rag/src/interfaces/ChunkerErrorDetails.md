[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkerErrorDetails

# Interface: ChunkerErrorDetails

Defined in: [rag/src/chunking/types.ts:105](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L105)

Details about a chunker error.

## Properties

### code

> **code**: [`ChunkerErrorCode`](../type-aliases/ChunkerErrorCode.md)

Defined in: [rag/src/chunking/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L107)

Machine-readable error code

***

### chunkerName

> **chunkerName**: `string`

Defined in: [rag/src/chunking/types.ts:109](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L109)

Name of the chunker that failed

***

### documentId?

> `optional` **documentId**: `string`

Defined in: [rag/src/chunking/types.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L111)

Document ID that was being chunked

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/chunking/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L113)

Underlying cause, if any
