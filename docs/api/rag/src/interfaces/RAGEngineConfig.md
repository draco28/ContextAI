[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGEngineConfig

# Interface: RAGEngineConfig

Defined in: [rag/src/engine/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L43)

Configuration for RAGEngine.

Only retriever and assembler are required. Optional components
(enhancer, reranker, cache) are skipped if not provided.

## Example

```typescript
const engine = new RAGEngine({
  retriever: new HybridRetriever({ ... }),
  assembler: new XMLAssembler({ ... }),
  // Optional: add components for better quality
  enhancer: new QueryRewriter({ ... }),
  reranker: new MMRReranker({ ... }),
});
```

## Properties

### enhancer?

> `optional` **enhancer**: [`QueryEnhancer`](QueryEnhancer.md)

Defined in: [rag/src/engine/types.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L48)

Optional query enhancer for pre-retrieval optimization.
If not provided, queries are used as-is.

***

### retriever

> **retriever**: [`Retriever`](Retriever.md)

Defined in: [rag/src/engine/types.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L54)

Required retriever for finding relevant chunks.
Can be dense, sparse, or hybrid.

***

### reranker?

> `optional` **reranker**: [`Reranker`](Reranker.md)

Defined in: [rag/src/engine/types.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L60)

Optional reranker for post-retrieval relevance optimization.
If not provided, retrieval results are used directly.

***

### assembler

> **assembler**: [`ContextAssembler`](ContextAssembler.md)

Defined in: [rag/src/engine/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L65)

Required assembler for formatting context for LLM consumption.

***

### cache?

> `optional` **cache**: [`CacheProvider`](CacheProvider.md)\<[`RAGResult`](RAGResult.md)\>

Defined in: [rag/src/engine/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L71)

Optional cache for storing search results.
Key is the query + options hash, value is RAGResult.

***

### name?

> `optional` **name**: `string`

Defined in: [rag/src/engine/types.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L77)

Name for this engine instance.
Default: 'RAGEngine'

***

### defaults?

> `optional` **defaults**: [`RAGSearchDefaults`](RAGSearchDefaults.md)

Defined in: [rag/src/engine/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L83)

Default options for search operations.
Can be overridden per-search.
