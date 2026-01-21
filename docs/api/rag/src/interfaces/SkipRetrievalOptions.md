[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SkipRetrievalOptions

# Interface: SkipRetrievalOptions

Defined in: [rag/src/adaptive/types.ts:232](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L232)

Options for handling queries that skip retrieval.

## Properties

### content?

> `optional` **content**: `string`

Defined in: [rag/src/adaptive/types.ts:237](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L237)

Content to return when retrieval is skipped.
Default: '' (empty string)

***

### skipReason?

> `optional` **skipReason**: `string`

Defined in: [rag/src/adaptive/types.ts:243](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L243)

Message explaining why retrieval was skipped.
Default: 'Query classified as simple - no retrieval needed'
