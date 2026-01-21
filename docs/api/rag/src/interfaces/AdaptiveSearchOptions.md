[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveSearchOptions

# Interface: AdaptiveSearchOptions

Defined in: [rag/src/adaptive/types.ts:253](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L253)

Extended search options for AdaptiveRAG.

## Extends

- [`RAGSearchOptions`](RAGSearchOptions.md)

## Properties

### overrideType?

> `optional` **overrideType**: [`QueryType`](../type-aliases/QueryType.md)

Defined in: [rag/src/adaptive/types.ts:258](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L258)

Override the automatic classification.
If provided, this type is used instead of classifying the query.

***

### forceRetrieval?

> `optional` **forceRetrieval**: `boolean`

Defined in: [rag/src/adaptive/types.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L264)

Force retrieval even if classification suggests skipping.
Default: false

***

### conversationHistory?

> `optional` **conversationHistory**: [`ConversationMessage`](ConversationMessage.md)[]

Defined in: [rag/src/adaptive/types.ts:270](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L270)

Conversation history for resolving CONVERSATIONAL queries.
Required for pronouns like "it", "that" to be resolved.

***

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/engine/types.ts:120](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L120)

Maximum number of results to retrieve.
Default: 10

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`topK`](RAGSearchOptions.md#topk)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/engine/types.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L126)

Minimum relevance score threshold (0-1).
Results below this score are excluded.

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`minScore`](RAGSearchOptions.md#minscore)

***

### enhance?

> `optional` **enhance**: `boolean`

Defined in: [rag/src/engine/types.ts:132](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L132)

Whether to enhance the query before retrieval.
Default: true if enhancer is configured

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`enhance`](RAGSearchOptions.md#enhance)

***

### rerank?

> `optional` **rerank**: `boolean`

Defined in: [rag/src/engine/types.ts:138](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L138)

Whether to rerank results after retrieval.
Default: true if reranker is configured

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`rerank`](RAGSearchOptions.md#rerank)

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/engine/types.ts:144](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L144)

Ordering strategy for assembled context.
Overrides assembler config for this search.

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`ordering`](RAGSearchOptions.md#ordering)

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [rag/src/engine/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L150)

Maximum tokens for assembled context.
Overrides assembler config for this search.

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`maxTokens`](RAGSearchOptions.md#maxtokens)

***

### retrieval?

> `optional` **retrieval**: [`RetrievalOptions`](RetrievalOptions.md)

Defined in: [rag/src/engine/types.ts:155](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L155)

Additional retrieval options (filters, alpha, etc.)

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`retrieval`](RAGSearchOptions.md#retrieval)

***

### useCache?

> `optional` **useCache**: `boolean`

Defined in: [rag/src/engine/types.ts:161](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L161)

Whether to use cache for this search.
Default: true if cache is configured

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`useCache`](RAGSearchOptions.md#usecache)

***

### cacheTtl?

> `optional` **cacheTtl**: `number`

Defined in: [rag/src/engine/types.ts:167](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L167)

Cache TTL in milliseconds for this result.
Only used if useCache is true.

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`cacheTtl`](RAGSearchOptions.md#cachettl)

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [rag/src/engine/types.ts:172](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L172)

Abort signal for cancellation.

#### Inherited from

[`RAGSearchOptions`](RAGSearchOptions.md).[`signal`](RAGSearchOptions.md#signal)
