[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RerankerOptions

# Interface: RerankerOptions

Defined in: [rag/src/reranker/types.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L63)

Options for reranking operations.

## Extended by

- [`MMRRerankerOptions`](MMRRerankerOptions.md)
- [`LLMRerankerOptions`](LLMRerankerOptions.md)

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/reranker/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L65)

Maximum number of results to return (default: same as input length)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/reranker/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L67)

Minimum score threshold (0-1)

***

### includeScoreBreakdown?

> `optional` **includeScoreBreakdown**: `boolean`

Defined in: [rag/src/reranker/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L69)

Include score breakdown in results (default: true)
