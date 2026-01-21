[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HybridRetriever

# Class: HybridRetriever

Defined in: [rag/src/retrieval/hybrid-retriever.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L86)

Hybrid retriever combining dense and sparse search with RRF fusion.

Hybrid retrieval is the modern best practice for production RAG:
- Dense handles semantic similarity and paraphrases
- Sparse handles exact keywords and technical terms
- RRF fusion combines their strengths

The alpha parameter controls the balance:
- alpha=0: Pure sparse (BM25 only)
- alpha=0.5: Balanced (default, recommended)
- alpha=1: Pure dense (vector only)

## Example

```typescript
// Initialize with vector store and embedding provider
const retriever = new HybridRetriever({
  vectorStore,
  embeddingProvider,
});

// Build BM25 index from documents
retriever.buildIndex([
  { id: 'doc1', content: 'PostgreSQL is a database', chunk: chunk1 },
  { id: 'doc2', content: 'MySQL is also a database', chunk: chunk2 },
]);

// Retrieve with balanced fusion (default)
const results = await retriever.retrieve('PostgreSQL performance tuning');

// Or favor semantic search for conceptual queries
const semanticResults = await retriever.retrieve(
  'How do I make my database faster?',
  { alpha: 0.7, topK: 5 }
);

// Or favor keyword search for technical queries
const keywordResults = await retriever.retrieve(
  'PostgreSQL 15.4 release notes',
  { alpha: 0.3, topK: 5 }
);
```

## Implements

- [`Retriever`](../interfaces/Retriever.md)

## Constructors

### Constructor

> **new HybridRetriever**(`vectorStore`, `embeddingProvider`, `config`): `HybridRetriever`

Defined in: [rag/src/retrieval/hybrid-retriever.ts:94](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L94)

#### Parameters

##### vectorStore

[`VectorStore`](../interfaces/VectorStore.md)

##### embeddingProvider

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

##### config

[`HybridRetrieverConfig`](../interfaces/HybridRetrieverConfig.md) = `{}`

#### Returns

`HybridRetriever`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/retrieval/hybrid-retriever.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L87)

Human-readable name of this retriever

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`name`](../interfaces/Retriever.md#name)

## Accessors

### dense

#### Get Signature

> **get** **dense**(): [`DenseRetriever`](DenseRetriever.md)

Defined in: [rag/src/retrieval/hybrid-retriever.ts:266](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L266)

Get the underlying dense retriever.

##### Returns

[`DenseRetriever`](DenseRetriever.md)

***

### sparse

#### Get Signature

> **get** **sparse**(): [`BM25Retriever`](BM25Retriever.md)

Defined in: [rag/src/retrieval/hybrid-retriever.ts:273](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L273)

Get the underlying sparse retriever.

##### Returns

[`BM25Retriever`](BM25Retriever.md)

***

### isIndexBuilt

#### Get Signature

> **get** **isIndexBuilt**(): `boolean`

Defined in: [rag/src/retrieval/hybrid-retriever.ts:280](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L280)

Check if the BM25 index has been built.

##### Returns

`boolean`

## Methods

### buildIndex()

> **buildIndex**(`documents`): `void`

Defined in: [rag/src/retrieval/hybrid-retriever.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L129)

Build the BM25 index for sparse retrieval.

This must be called before retrieve() if alpha < 1.
The documents should match what's in the vector store.

#### Parameters

##### documents

[`BM25Document`](../interfaces/BM25Document.md)[]

Documents to index for BM25

#### Returns

`void`

***

### retrieve()

> **retrieve**(`query`, `options`): `Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Defined in: [rag/src/retrieval/hybrid-retriever.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/hybrid-retriever.ts#L140)

Retrieve documents using hybrid dense + sparse search.

#### Parameters

##### query

`string`

Search query (natural language)

##### options

[`HybridRetrievalOptions`](../interfaces/HybridRetrievalOptions.md) = `{}`

Retrieval options including alpha

#### Returns

`Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Sorted results with full score transparency

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`retrieve`](../interfaces/Retriever.md#retrieve)
