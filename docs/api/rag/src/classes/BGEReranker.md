[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BGEReranker

# Class: BGEReranker

Defined in: [rag/src/reranker/bge-reranker.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/bge-reranker.ts#L76)

BGE Cross-Encoder Reranker.

Reranks retrieval results using a BAAI BGE cross-encoder model.
The model scores each query-document pair, providing more accurate
relevance scores than embedding similarity.

Performance characteristics:
- Latency: ~50-100ms per document (CPU), ~10-20ms per document (GPU)
- Memory: ~110MB (base) or ~330MB (large)
- Accuracy: Significantly better than bi-encoder similarity

## Example

```typescript
// Create reranker (loads model lazily on first use)
const reranker = new BGEReranker({
  modelName: 'Xenova/bge-reranker-base',
});

// Rerank search results
const results = await retriever.retrieve('How to reset password?');
const reranked = await reranker.rerank('How to reset password?', results, {
  topK: 5,
});

// Access score breakdown
reranked.forEach(r => {
  console.log(`${r.chunk.content.slice(0, 50)}...`);
  console.log(`  Original rank: ${r.originalRank} -> New rank: ${r.newRank}`);
  console.log(`  Scores: original=${r.scores.originalScore.toFixed(3)}, reranker=${r.scores.rerankerScore.toFixed(3)}`);
});
```

## Extends

- [`BaseReranker`](BaseReranker.md)

## Constructors

### Constructor

> **new BGEReranker**(`config`): `BGEReranker`

Defined in: [rag/src/reranker/bge-reranker.ts:93](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/bge-reranker.ts#L93)

#### Parameters

##### config

[`BGERerankerConfig`](../interfaces/BGERerankerConfig.md) = `{}`

#### Returns

`BGEReranker`

#### Overrides

[`BaseReranker`](BaseReranker.md).[`constructor`](BaseReranker.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/reranker/bge-reranker.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/bge-reranker.ts#L77)

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

***

### isLoaded()

> **isLoaded**(): `boolean`

Defined in: [rag/src/reranker/bge-reranker.ts:247](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/bge-reranker.ts#L247)

Check if the model is loaded.
Useful for pre-warming the model before first use.

#### Returns

`boolean`

***

### warmup()

> **warmup**(): `Promise`\<`void`\>

Defined in: [rag/src/reranker/bge-reranker.ts:255](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/bge-reranker.ts#L255)

Pre-load the model.
Call this during application startup to avoid first-request latency.

#### Returns

`Promise`\<`void`\>
