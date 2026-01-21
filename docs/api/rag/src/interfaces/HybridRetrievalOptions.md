[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HybridRetrievalOptions

# Interface: HybridRetrievalOptions

Defined in: [rag/src/retrieval/types.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L76)

Options specific to hybrid retrieval.

## Extends

- [`RetrievalOptions`](RetrievalOptions.md)

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/retrieval/types.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L64)

Maximum number of results to return (default: 10)

#### Inherited from

[`RetrievalOptions`](RetrievalOptions.md).[`topK`](RetrievalOptions.md#topk)

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/retrieval/types.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L66)

Minimum score threshold (0-1)

#### Inherited from

[`RetrievalOptions`](RetrievalOptions.md).[`minScore`](RetrievalOptions.md#minscore)

***

### filter?

> `optional` **filter**: [`MetadataFilter`](../type-aliases/MetadataFilter.md)

Defined in: [rag/src/retrieval/types.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L68)

Filter results by metadata

#### Inherited from

[`RetrievalOptions`](RetrievalOptions.md).[`filter`](RetrievalOptions.md#filter)

***

### includeMetadata?

> `optional` **includeMetadata**: `boolean`

Defined in: [rag/src/retrieval/types.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L70)

Include full metadata in results (default: true)

#### Inherited from

[`RetrievalOptions`](RetrievalOptions.md).[`includeMetadata`](RetrievalOptions.md#includemetadata)

***

### alpha?

> `optional` **alpha**: `number`

Defined in: [rag/src/retrieval/types.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L86)

Balance between dense and sparse retrieval.

- 0.0 = sparse only (pure BM25)
- 0.5 = balanced (default)
- 1.0 = dense only (pure vector search)

Values between give weighted combination via RRF.

***

### candidateMultiplier?

> `optional` **candidateMultiplier**: `number`

Defined in: [rag/src/retrieval/types.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L92)

Number of candidates to fetch from each retriever before fusion.
Higher values may improve recall but increase latency.
Default: topK * 3
