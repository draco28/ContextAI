[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LoaderErrorDetails

# Interface: LoaderErrorDetails

Defined in: [rag/src/loaders/types.ts:148](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L148)

Details about a loader error.

## Properties

### code

> **code**: [`LoaderErrorCode`](../type-aliases/LoaderErrorCode.md)

Defined in: [rag/src/loaders/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L150)

Machine-readable error code

***

### loaderName

> **loaderName**: `string`

Defined in: [rag/src/loaders/types.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L152)

Name of the loader that failed

***

### source

> **source**: `string`

Defined in: [rag/src/loaders/types.ts:154](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L154)

Source that was being loaded

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/loaders/types.ts:156](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L156)

Underlying cause, if any
