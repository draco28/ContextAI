[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MMRRerankerOptions

# Interface: MMRRerankerOptions

Defined in: [rag/src/reranker/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L75)

Options specific to MMR reranking.

## Extends

- [`RerankerOptions`](RerankerOptions.md)

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/reranker/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L65)

Maximum number of results to return (default: same as input length)

#### Inherited from

[`RerankerOptions`](RerankerOptions.md).[`topK`](RerankerOptions.md#topk)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/reranker/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L67)

Minimum score threshold (0-1)

#### Inherited from

[`RerankerOptions`](RerankerOptions.md).[`minScore`](RerankerOptions.md#minscore)

***

### includeScoreBreakdown?

> `optional` **includeScoreBreakdown**: `boolean`

Defined in: [rag/src/reranker/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L69)

Include score breakdown in results (default: true)

#### Inherited from

[`RerankerOptions`](RerankerOptions.md).[`includeScoreBreakdown`](RerankerOptions.md#includescorebreakdown)

***

### lambda?

> `optional` **lambda**: `number`

Defined in: [rag/src/reranker/types.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L85)

Balance between relevance and diversity.

- 0.0 = maximize diversity (ignore relevance)
- 0.5 = balanced (default)
- 1.0 = maximize relevance (ignore diversity)

Higher values prioritize relevance, lower values prioritize diversity.
