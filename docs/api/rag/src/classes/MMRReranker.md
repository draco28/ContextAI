[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MMRReranker

# Class: MMRReranker

Defined in: [rag/src/reranker/mmr-reranker.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/mmr-reranker.ts#L66)

MMR Reranker for diversity-aware ranking.

Uses Maximal Marginal Relevance to select documents that are
both relevant to the query AND different from already-selected docs.

This is particularly useful when:
- Search results contain near-duplicates
- You want to cover multiple aspects of a topic
- Context window is limited and diversity maximizes information

**Requirements:**
- Results must have embeddings OR you must provide an embedding provider
- Embeddings are needed to compute inter-document similarity

## Example

```typescript
// With embedding provider (computes embeddings on-the-fly)
const reranker = new MMRReranker({
  embeddingProvider: new HuggingFaceEmbeddings({ model: 'BAAI/bge-small-en-v1.5' }),
  defaultLambda: 0.6,
});

// With pre-computed embeddings in results
const reranker = new MMRReranker({ defaultLambda: 0.5 });
const resultsWithEmbeddings = results.map(r => ({
  ...r,
  embedding: precomputedEmbeddings[r.id],
}));
const reranked = await reranker.rerank(query, resultsWithEmbeddings);
```

## Extends

- [`BaseReranker`](BaseReranker.md)

## Constructors

### Constructor

> **new MMRReranker**(`config`): `MMRReranker`

Defined in: [rag/src/reranker/mmr-reranker.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/mmr-reranker.ts#L81)

#### Parameters

##### config

[`MMRRerankerConfig`](../interfaces/MMRRerankerConfig.md) & `object` = `{}`

#### Returns

`MMRReranker`

#### Overrides

[`BaseReranker`](BaseReranker.md).[`constructor`](BaseReranker.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/reranker/mmr-reranker.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/mmr-reranker.ts#L67)

Human-readable name of this reranker

#### Overrides

[`BaseReranker`](BaseReranker.md).[`name`](BaseReranker.md#name)

## Methods

### rerank()

> **rerank**(`query`, `results`, `options?`): `Promise`\<[`RerankerResult`](../interfaces/RerankerResult.md)[]\>

Defined in: [rag/src/reranker/base-reranker.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L81)

Public rerank method with validation and transformation.

Uses arrow function to preserve `this` binding when passed as callback.

#### Parameters

##### query

`string`

##### results

[`RetrievalResult`](../interfaces/RetrievalResult.md)[]

##### options?

[`RerankerOptions`](../interfaces/RerankerOptions.md)

#### Returns

`Promise`\<[`RerankerResult`](../interfaces/RerankerResult.md)[]\>

#### Inherited from

[`BaseReranker`](BaseReranker.md).[`rerank`](BaseReranker.md#rerank)
