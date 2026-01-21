[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / VectorStore

# Interface: VectorStore

Defined in: [rag/src/vector-store/types.ts:177](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L177)

Interface for vector stores.

Vector stores are responsible for:
1. Storing chunks with their embeddings (insert, upsert)
2. Searching by vector similarity (search)
3. Managing stored data (delete, count, clear)

## Example

```typescript
const store: VectorStore = new PgVectorStore({
  dimensions: 1536,
  distanceMetric: 'cosine'
});

// Insert chunks with embeddings
const ids = await store.insert(chunksWithEmbeddings);

// Search for similar chunks
const results = await store.search(queryEmbedding, {
  topK: 5,
  minScore: 0.7,
  filter: { documentId: 'doc-123' }
});
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/vector-store/types.ts:179](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L179)

Human-readable name of this store

***

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/vector-store/types.ts:182](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L182)

Dimension of vectors this store accepts

## Methods

### insert()

> **insert**(`chunks`): `Promise`\<`string`[]\>

Defined in: [rag/src/vector-store/types.ts:191](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L191)

Insert chunks with embeddings into the store.

#### Parameters

##### chunks

[`ChunkWithEmbedding`](ChunkWithEmbedding.md)[]

Chunks with their embedding vectors

#### Returns

`Promise`\<`string`[]\>

Array of inserted chunk IDs

#### Throws

If insert fails or dimensions mismatch

***

### upsert()

> **upsert**(`chunks`): `Promise`\<`string`[]\>

Defined in: [rag/src/vector-store/types.ts:200](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L200)

Insert or update chunks (update if ID exists).

#### Parameters

##### chunks

[`ChunkWithEmbedding`](ChunkWithEmbedding.md)[]

Chunks with their embedding vectors

#### Returns

`Promise`\<`string`[]\>

Array of upserted chunk IDs

#### Throws

If upsert fails or dimensions mismatch

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`SearchResult`](SearchResult.md)[]\>

Defined in: [rag/src/vector-store/types.ts:210](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L210)

Search for similar chunks by query vector.

#### Parameters

##### query

`number`[]

Query embedding vector

##### options?

[`SearchOptions`](SearchOptions.md)

Search options (topK, minScore, filter)

#### Returns

`Promise`\<[`SearchResult`](SearchResult.md)[]\>

Array of search results sorted by similarity (descending)

#### Throws

If search fails or query dimensions mismatch

***

### delete()

> **delete**(`ids`): `Promise`\<`void`\>

Defined in: [rag/src/vector-store/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L220)

Delete chunks by their IDs.

Silently ignores IDs that don't exist.

#### Parameters

##### ids

`string`[]

Array of chunk IDs to delete

#### Returns

`Promise`\<`void`\>

#### Throws

If delete fails

***

### count()

> **count**(): `Promise`\<`number`\>

Defined in: [rag/src/vector-store/types.ts:227](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L227)

Get the number of chunks in the store.

#### Returns

`Promise`\<`number`\>

Total count of stored chunks

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/vector-store/types.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L234)

Remove all chunks from the store.

#### Returns

`Promise`\<`void`\>

#### Throws

If clear fails
