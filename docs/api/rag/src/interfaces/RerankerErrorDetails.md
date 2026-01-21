[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RerankerErrorDetails

# Interface: RerankerErrorDetails

Defined in: [rag/src/reranker/types.ts:315](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L315)

Details about a reranker error.

## Properties

### code

> **code**: [`RerankerErrorCode`](../type-aliases/RerankerErrorCode.md)

Defined in: [rag/src/reranker/types.ts:317](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L317)

Machine-readable error code

***

### rerankerName

> **rerankerName**: `string`

Defined in: [rag/src/reranker/types.ts:319](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L319)

Name of the reranker that failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/reranker/types.ts:321](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L321)

Underlying cause, if any
