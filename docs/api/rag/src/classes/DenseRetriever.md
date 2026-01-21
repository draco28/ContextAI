[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DenseRetriever

# Class: DenseRetriever

Defined in: [rag/src/retrieval/dense-retriever.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L43)

Dense retriever using vector similarity search.

Dense retrieval excels at:
- Semantic similarity ("car" matches "automobile")
- Paraphrased queries ("How do I X?" matches "Steps to X")
- Concept matching across different vocabulary

## Example

```typescript
const retriever = new DenseRetriever({
  vectorStore,
  embeddingProvider,
});

const results = await retriever.retrieve('How do I reset my password?', {
  topK: 5,
  minScore: 0.7,
});
```

## Implements

- [`Retriever`](../interfaces/Retriever.md)

## Constructors

### Constructor

> **new DenseRetriever**(`vectorStore`, `embeddingProvider`, `config`): `DenseRetriever`

Defined in: [rag/src/retrieval/dense-retriever.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L49)

#### Parameters

##### vectorStore

[`VectorStore`](../interfaces/VectorStore.md)

##### embeddingProvider

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

##### config

[`DenseRetrieverConfig`](../interfaces/DenseRetrieverConfig.md) = `{}`

#### Returns

`DenseRetriever`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/retrieval/dense-retriever.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L44)

Human-readable name of this retriever

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`name`](../interfaces/Retriever.md#name)

## Accessors

### store

#### Get Signature

> **get** **store**(): [`VectorStore`](../interfaces/VectorStore.md)

Defined in: [rag/src/retrieval/dense-retriever.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L129)

Get the underlying vector store.
Useful for accessing store-specific functionality.

##### Returns

[`VectorStore`](../interfaces/VectorStore.md)

***

### provider

#### Get Signature

> **get** **provider**(): [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

Defined in: [rag/src/retrieval/dense-retriever.ts:137](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L137)

Get the underlying embedding provider.
Useful for accessing provider-specific functionality.

##### Returns

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Methods

### retrieve()

> **retrieve**(`query`, `options`): `Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Defined in: [rag/src/retrieval/dense-retriever.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/dense-retriever.ts#L70)

Retrieve documents using vector similarity search.

1. Embeds the query using the embedding provider
2. Searches the vector store for similar chunks
3. Converts results to RetrievalResult format

#### Parameters

##### query

`string`

Search query (natural language)

##### options

[`RetrievalOptions`](../interfaces/RetrievalOptions.md) = `{}`

Retrieval options

#### Returns

`Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Sorted results with similarity scores

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`retrieve`](../interfaces/Retriever.md#retrieve)
