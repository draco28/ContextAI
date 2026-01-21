[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LLMRerankerOptions

# Interface: LLMRerankerOptions

Defined in: [rag/src/reranker/types.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L91)

Options specific to LLM reranking.

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

### concurrency?

> `optional` **concurrency**: `number`

Defined in: [rag/src/reranker/types.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L97)

Maximum concurrent LLM calls.
Higher values increase speed but may hit rate limits.
Default: 5

***

### batchMode?

> `optional` **batchMode**: `boolean`

Defined in: [rag/src/reranker/types.ts:103](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L103)

Whether to use batch scoring (single prompt with all docs).
More efficient but may reduce accuracy for many docs.
Default: false (score each doc individually)
