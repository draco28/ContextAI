[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveRAGErrorDetails

# Interface: AdaptiveRAGErrorDetails

Defined in: [rag/src/adaptive/types.ts:424](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L424)

Details about an adaptive RAG error.

## Properties

### code

> **code**: [`AdaptiveRAGErrorCode`](../type-aliases/AdaptiveRAGErrorCode.md)

Defined in: [rag/src/adaptive/types.ts:426](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L426)

Machine-readable error code

***

### componentName

> **componentName**: `string`

Defined in: [rag/src/adaptive/types.ts:428](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L428)

Name of the component that failed

***

### queryType?

> `optional` **queryType**: [`QueryType`](../type-aliases/QueryType.md)

Defined in: [rag/src/adaptive/types.ts:430](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L430)

Query type at time of failure (if classified)

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/adaptive/types.ts:432](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L432)

Underlying cause, if any
