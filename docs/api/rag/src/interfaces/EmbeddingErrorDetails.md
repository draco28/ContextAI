[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingErrorDetails

# Interface: EmbeddingErrorDetails

Defined in: [rag/src/embeddings/types.ts:127](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L127)

Details about an embedding error.

## Properties

### code

> **code**: [`EmbeddingErrorCode`](../type-aliases/EmbeddingErrorCode.md)

Defined in: [rag/src/embeddings/types.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L129)

Machine-readable error code

***

### providerName

> **providerName**: `string`

Defined in: [rag/src/embeddings/types.ts:131](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L131)

Name of the provider that failed

***

### model

> **model**: `string`

Defined in: [rag/src/embeddings/types.ts:133](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L133)

Model being used

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/embeddings/types.ts:135](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L135)

Underlying cause, if any
