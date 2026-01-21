[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGEngineErrorDetails

# Interface: RAGEngineErrorDetails

Defined in: [rag/src/engine/types.ts:331](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L331)

Details about a RAG engine error.

## Properties

### code

> **code**: [`RAGEngineErrorCode`](../type-aliases/RAGEngineErrorCode.md)

Defined in: [rag/src/engine/types.ts:333](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L333)

Machine-readable error code

***

### engineName

> **engineName**: `string`

Defined in: [rag/src/engine/types.ts:335](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L335)

Name of the engine that failed

***

### stage?

> `optional` **stage**: `"enhancement"` \| `"retrieval"` \| `"reranking"` \| `"assembly"` \| `"cache"`

Defined in: [rag/src/engine/types.ts:337](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L337)

Which pipeline stage failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/engine/types.ts:339](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L339)

Underlying cause, if any
