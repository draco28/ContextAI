[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MMRRerankerConfig

# Interface: MMRRerankerConfig

Defined in: [rag/src/reranker/types.ts:208](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L208)

Configuration for MMR (Maximal Marginal Relevance) reranker.

MMR balances relevance and diversity to avoid returning
multiple documents that say the same thing.

Formula: MMR = λ * Sim(q, d) - (1-λ) * max(Sim(d, d_selected))

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/reranker/types.ts:210](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L210)

Name for this reranker instance (default: 'MMRReranker')

***

### defaultLambda?

> `optional` **defaultLambda**: `number`

Defined in: [rag/src/reranker/types.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L216)

Default lambda value (can be overridden per-query).
Default: 0.5 (balanced)

***

### similarityFunction?

> `optional` **similarityFunction**: `"cosine"` \| `"euclidean"` \| `"dotProduct"`

Defined in: [rag/src/reranker/types.ts:222](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L222)

Similarity function for comparing embeddings.
Default: 'cosine'
