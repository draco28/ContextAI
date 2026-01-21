[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BM25Retriever

# Class: BM25Retriever

Defined in: [rag/src/retrieval/bm25.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L111)

BM25 sparse retriever for keyword-based search.

BM25 excels at:
- Exact keyword matching ("PostgreSQL 15.4")
- Technical terminology and proper nouns
- Queries where specific words MUST appear

## Example

```typescript
const retriever = new BM25Retriever({ k1: 1.2, b: 0.75 });

// Build index from documents
await retriever.buildIndex([
  { id: '1', content: 'PostgreSQL is a database', chunk: {...} },
  { id: '2', content: 'MySQL is also a database', chunk: {...} },
]);

// Search
const results = await retriever.retrieve('PostgreSQL database', { topK: 5 });
```

## Implements

- [`Retriever`](../interfaces/Retriever.md)

## Constructors

### Constructor

> **new BM25Retriever**(`config`): `BM25Retriever`

Defined in: [rag/src/retrieval/bm25.ts:127](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L127)

#### Parameters

##### config

[`BM25Config`](../interfaces/BM25Config.md) = `{}`

#### Returns

`BM25Retriever`

## Properties

### name

> `readonly` **name**: `"BM25Retriever"` = `'BM25Retriever'`

Defined in: [rag/src/retrieval/bm25.ts:112](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L112)

Human-readable name of this retriever

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`name`](../interfaces/Retriever.md#name)

## Accessors

### documentCount

#### Get Signature

> **get** **documentCount**(): `number`

Defined in: [rag/src/retrieval/bm25.ts:319](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L319)

Get the number of indexed documents.

##### Returns

`number`

***

### vocabularySize

#### Get Signature

> **get** **vocabularySize**(): `number`

Defined in: [rag/src/retrieval/bm25.ts:326](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L326)

Get the number of unique terms in the index.

##### Returns

`number`

***

### averageDocumentLength

#### Get Signature

> **get** **averageDocumentLength**(): `number`

Defined in: [rag/src/retrieval/bm25.ts:333](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L333)

Get the average document length.

##### Returns

`number`

## Methods

### buildIndex()

> **buildIndex**(`documents`): `void`

Defined in: [rag/src/retrieval/bm25.ts:151](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L151)

Build the BM25 index from documents.

This must be called before retrieve(). The index can be rebuilt
by calling this method again with new documents.

#### Parameters

##### documents

[`BM25Document`](../interfaces/BM25Document.md)[]

Documents to index

#### Returns

`void`

***

### retrieve()

> **retrieve**(`query`, `options`): `Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Defined in: [rag/src/retrieval/bm25.ts:230](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L230)

Retrieve documents matching the query using BM25 scoring.

#### Parameters

##### query

`string`

Search query

##### options

[`RetrievalOptions`](../interfaces/RetrievalOptions.md) = `{}`

Retrieval options

#### Returns

`Promise`\<[`RetrievalResult`](../interfaces/RetrievalResult.md)[]\>

Sorted results with BM25 scores

#### Implementation of

[`Retriever`](../interfaces/Retriever.md).[`retrieve`](../interfaces/Retriever.md#retrieve)

***

### hasTerm()

> **hasTerm**(`term`): `boolean`

Defined in: [rag/src/retrieval/bm25.ts:340](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L340)

Check if a term exists in the vocabulary.

#### Parameters

##### term

`string`

#### Returns

`boolean`

***

### getIDF()

> **getIDF**(`term`): `number`

Defined in: [rag/src/retrieval/bm25.ts:348](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/bm25.ts#L348)

Get the IDF value for a term.
Returns undefined if term not in vocabulary.

#### Parameters

##### term

`string`

#### Returns

`number`
