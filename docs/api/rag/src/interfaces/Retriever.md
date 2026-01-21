[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / Retriever

# Interface: Retriever

Defined in: [rag/src/retrieval/types.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L119)

Interface for all retrievers.

Retrievers are responsible for finding relevant chunks given a query.
Implementations may use vector similarity, keyword matching, or both.

## Example

```typescript
const retriever: Retriever = new HybridRetriever({
  vectorStore,
  embeddingProvider,
  documents,
});

const results = await retriever.retrieve('How do I reset my password?', {
  topK: 5,
  alpha: 0.7, // favor semantic search
});
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/retrieval/types.ts:121](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L121)

Human-readable name of this retriever

## Methods

### retrieve()

> **retrieve**(`query`, `options?`): `Promise`\<[`RetrievalResult`](RetrievalResult.md)[]\>

Defined in: [rag/src/retrieval/types.ts:130](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L130)

Retrieve relevant chunks for a query.

#### Parameters

##### query

`string`

The search query (natural language)

##### options?

[`RetrievalOptions`](RetrievalOptions.md)

Retrieval options (topK, filters, etc.)

#### Returns

`Promise`\<[`RetrievalResult`](RetrievalResult.md)[]\>

Array of results sorted by relevance (descending)
