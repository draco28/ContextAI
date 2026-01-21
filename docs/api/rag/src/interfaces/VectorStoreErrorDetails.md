[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / VectorStoreErrorDetails

# Interface: VectorStoreErrorDetails

Defined in: [rag/src/vector-store/types.ts:257](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L257)

Details about a vector store error.

## Properties

### code

> **code**: [`VectorStoreErrorCode`](../type-aliases/VectorStoreErrorCode.md)

Defined in: [rag/src/vector-store/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L259)

Machine-readable error code

***

### storeName

> **storeName**: `string`

Defined in: [rag/src/vector-store/types.ts:261](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L261)

Name of the store that failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/vector-store/types.ts:263](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L263)

Underlying cause, if any
