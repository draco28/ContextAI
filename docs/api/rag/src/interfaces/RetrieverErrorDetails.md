[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RetrieverErrorDetails

# Interface: RetrieverErrorDetails

Defined in: [rag/src/retrieval/types.ts:299](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L299)

Details about a retriever error.

## Properties

### code

> **code**: [`RetrieverErrorCode`](../type-aliases/RetrieverErrorCode.md)

Defined in: [rag/src/retrieval/types.ts:301](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L301)

Machine-readable error code

***

### retrieverName

> **retrieverName**: `string`

Defined in: [rag/src/retrieval/types.ts:303](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L303)

Name of the retriever that failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/retrieval/types.ts:305](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L305)

Underlying cause, if any
