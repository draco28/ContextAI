[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryEnhancementErrorDetails

# Interface: QueryEnhancementErrorDetails

Defined in: [rag/src/query-enhancement/types.ts:290](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L290)

Details about a query enhancement error.

## Properties

### code

> **code**: [`QueryEnhancementErrorCode`](../type-aliases/QueryEnhancementErrorCode.md)

Defined in: [rag/src/query-enhancement/types.ts:292](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L292)

Machine-readable error code

***

### enhancerName

> **enhancerName**: `string`

Defined in: [rag/src/query-enhancement/types.ts:294](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L294)

Name of the enhancer that failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/query-enhancement/types.ts:296](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L296)

Underlying cause, if any
