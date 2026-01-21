[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / InMemoryVectorStore

# Class: InMemoryVectorStore

Defined in: [rag/src/vector-store/memory-store.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/memory-store.ts#L45)

In-memory vector store for testing and small-scale use.

Features:
- No external dependencies
- Brute-force similarity search
- Full metadata filtering support
- Suitable for up to ~10K vectors

## Example

```typescript
const store = new InMemoryVectorStore({ dimensions: 1536 });

await store.insert([
  { id: 'chunk-1', content: 'Hello', embedding: [...], metadata: {} }
]);

const results = await store.search(queryVector, { topK: 5 });
```

## Extends

- [`BaseVectorStore`](BaseVectorStore.md)

## Constructors

### Constructor

> **new InMemoryVectorStore**(`config`): `InMemoryVectorStore`

Defined in: [rag/src/vector-store/memory-store.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/memory-store.ts#L51)

#### Parameters

##### config

[`VectorStoreConfig`](../interfaces/VectorStoreConfig.md)

#### Returns

`InMemoryVectorStore`

#### Overrides

[`BaseVectorStore`](BaseVectorStore.md).[`constructor`](BaseVectorStore.md#constructor)

## Properties

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/vector-store/base-store.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L64)

Dimension of vectors this store accepts

#### Inherited from

[`BaseVectorStore`](BaseVectorStore.md).[`dimensions`](BaseVectorStore.md#dimensions)

***

### name

> `readonly` **name**: `"InMemoryVectorStore"` = `'InMemoryVectorStore'`

Defined in: [rag/src/vector-store/memory-store.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/memory-store.ts#L46)

Human-readable name of this store

#### Overrides

[`BaseVectorStore`](BaseVectorStore.md).[`name`](BaseVectorStore.md#name)

## Methods

### insert()

> **insert**(`chunks`): `Promise`\<`string`[]\>

Defined in: [rag/src/vector-store/base-store.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L79)

Insert chunks with embeddings into the store.

Validates dimensions before delegating to store-specific implementation.

#### Parameters

##### chunks

[`ChunkWithEmbedding`](../interfaces/ChunkWithEmbedding.md)[]

#### Returns

`Promise`\<`string`[]\>

#### Inherited from

[`BaseVectorStore`](BaseVectorStore.md).[`insert`](BaseVectorStore.md#insert)

***

### upsert()

> **upsert**(`chunks`): `Promise`\<`string`[]\>

Defined in: [rag/src/vector-store/base-store.ts:94](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L94)

Insert or update chunks (update if ID exists).

Default implementation uses _insert with upsert semantics.
Subclasses may override for native upsert support.

#### Parameters

##### chunks

[`ChunkWithEmbedding`](../interfaces/ChunkWithEmbedding.md)[]

#### Returns

`Promise`\<`string`[]\>

#### Inherited from

[`BaseVectorStore`](BaseVectorStore.md).[`upsert`](BaseVectorStore.md#upsert)

***

### search()

> **search**(`query`, `options?`): `Promise`\<[`SearchResult`](../interfaces/SearchResult.md)[]\>

Defined in: [rag/src/vector-store/base-store.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L108)

Search for similar chunks by query vector.

Validates query dimensions before delegating to store-specific implementation.

#### Parameters

##### query

`number`[]

##### options?

[`SearchOptions`](../interfaces/SearchOptions.md)

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult.md)[]\>

#### Inherited from

[`BaseVectorStore`](BaseVectorStore.md).[`search`](BaseVectorStore.md#search)

***

### delete()

> **delete**(`ids`): `Promise`\<`void`\>

Defined in: [rag/src/vector-store/base-store.ts:130](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L130)

Delete chunks by their IDs.

Silently ignores IDs that don't exist.

#### Parameters

##### ids

`string`[]

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseVectorStore`](BaseVectorStore.md).[`delete`](BaseVectorStore.md#delete)

***

### count()

> **count**(): `Promise`\<`number`\>

Defined in: [rag/src/vector-store/memory-store.ts:155](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/memory-store.ts#L155)

Get the number of stored chunks.

#### Returns

`Promise`\<`number`\>

#### Overrides

[`BaseVectorStore`](BaseVectorStore.md).[`count`](BaseVectorStore.md#count)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/vector-store/memory-store.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/memory-store.ts#L162)

Remove all chunks from the store.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseVectorStore`](BaseVectorStore.md).[`clear`](BaseVectorStore.md#clear)
