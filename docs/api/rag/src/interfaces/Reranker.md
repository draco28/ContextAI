[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / Reranker

# Interface: Reranker

Defined in: [rag/src/reranker/types.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L129)

Interface for all rerankers.

Rerankers take retrieval results and reorder them based on
more accurate (but slower) scoring methods.

## Example

```typescript
const reranker: Reranker = new BGEReranker({
  modelName: 'BAAI/bge-reranker-base',
});

const reranked = await reranker.rerank(
  'How do I reset my password?',
  retrievalResults,
  { topK: 5 }
);
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/reranker/types.ts:131](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L131)

Human-readable name of this reranker

## Methods

### rerank()

> **rerank**(`query`, `results`, `options?`): `Promise`\<[`RerankerResult`](RerankerResult.md)[]\>

Defined in: [rag/src/reranker/types.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L141)

Rerank retrieval results based on query relevance.

#### Parameters

##### query

`string`

The search query (natural language)

##### results

[`RetrievalResult`](RetrievalResult.md)[]

Results from initial retrieval

##### options?

[`RerankerOptions`](RerankerOptions.md)

Reranking options

#### Returns

`Promise`\<[`RerankerResult`](RerankerResult.md)[]\>

Array of results sorted by reranked relevance (descending)
