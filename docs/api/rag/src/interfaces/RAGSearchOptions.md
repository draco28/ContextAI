[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGSearchOptions

# Interface: RAGSearchOptions

Defined in: [rag/src/engine/types.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L115)

Options for a single search operation.

All options are optional and override engine defaults.

## Extended by

- [`AdaptiveSearchOptions`](AdaptiveSearchOptions.md)

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/engine/types.ts:120](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L120)

Maximum number of results to retrieve.
Default: 10

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/engine/types.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L126)

Minimum relevance score threshold (0-1).
Results below this score are excluded.

***

### enhance?

> `optional` **enhance**: `boolean`

Defined in: [rag/src/engine/types.ts:132](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L132)

Whether to enhance the query before retrieval.
Default: true if enhancer is configured

***

### rerank?

> `optional` **rerank**: `boolean`

Defined in: [rag/src/engine/types.ts:138](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L138)

Whether to rerank results after retrieval.
Default: true if reranker is configured

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/engine/types.ts:144](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L144)

Ordering strategy for assembled context.
Overrides assembler config for this search.

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [rag/src/engine/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L150)

Maximum tokens for assembled context.
Overrides assembler config for this search.

***

### retrieval?

> `optional` **retrieval**: [`RetrievalOptions`](RetrievalOptions.md)

Defined in: [rag/src/engine/types.ts:155](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L155)

Additional retrieval options (filters, alpha, etc.)

***

### useCache?

> `optional` **useCache**: `boolean`

Defined in: [rag/src/engine/types.ts:161](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L161)

Whether to use cache for this search.
Default: true if cache is configured

***

### cacheTtl?

> `optional` **cacheTtl**: `number`

Defined in: [rag/src/engine/types.ts:167](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L167)

Cache TTL in milliseconds for this result.
Only used if useCache is true.

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [rag/src/engine/types.ts:172](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L172)

Abort signal for cancellation.
