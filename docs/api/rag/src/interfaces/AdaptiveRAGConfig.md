[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveRAGConfig

# Interface: AdaptiveRAGConfig

Defined in: [rag/src/adaptive/types.ts:199](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L199)

Configuration for AdaptiveRAG wrapper.

## Properties

### engine

> **engine**: [`RAGEngine`](RAGEngine.md)

Defined in: [rag/src/adaptive/types.ts:203](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L203)

The underlying RAG engine to wrap.

***

### classifierConfig?

> `optional` **classifierConfig**: [`QueryClassifierConfig`](QueryClassifierConfig.md)

Defined in: [rag/src/adaptive/types.ts:209](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L209)

Custom classifier configuration.
If not provided, default classifier is used.

***

### includeClassificationInMetadata?

> `optional` **includeClassificationInMetadata**: `boolean`

Defined in: [rag/src/adaptive/types.ts:215](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L215)

Whether to include classification info in result metadata.
Default: true

***

### name?

> `optional` **name**: `string`

Defined in: [rag/src/adaptive/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L220)

Custom name for this adaptive engine instance.

***

### skipRetrievalDefaults?

> `optional` **skipRetrievalDefaults**: [`SkipRetrievalOptions`](SkipRetrievalOptions.md)

Defined in: [rag/src/adaptive/types.ts:226](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L226)

Default options when skipRetrieval is true.
Controls what's returned for SIMPLE queries.
