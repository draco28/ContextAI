[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseVectorStore

# Abstract Class: BaseVectorStore

Defined in: [rag/src/vector-store/base-store.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L59)

Abstract base class for vector stores.

Provides:
- Input validation (dimensions, empty arrays)
- Metadata filtering logic
- Similarity score computation
- Consistent error handling

Subclasses must implement:
- `_insert()` - Store-specific insertion
- `_search()` - Store-specific similarity search
- `_delete()` - Store-specific deletion
- `count()` - Return total chunk count
- `clear()` - Remove all chunks

## Example

```typescript
class PgVectorStore extends BaseVectorStore {
  readonly name = 'PgVectorStore';

  constructor(connectionString: string, config: VectorStoreConfig) {
    super(config);
    this.db = new Pool({ connectionString });
  }

  protected async _insert(chunks: ChunkWithEmbedding[]): Promise<string[]> {
    // PostgreSQL-specific insertion logic
  }

  // ... other abstract methods
}
```

## Extended by

- [`InMemoryVectorStore`](InMemoryVectorStore.md)

## Implements

- [`VectorStore`](../interfaces/VectorStore.md)

## Constructors

### Constructor

> **new BaseVectorStore**(`config`): `BaseVectorStore`

Defined in: [rag/src/vector-store/base-store.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L69)

#### Parameters

##### config

[`VectorStoreConfig`](../interfaces/VectorStoreConfig.md)

#### Returns

`BaseVectorStore`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/vector-store/base-store.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L61)

Human-readable name of this store

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`name`](../interfaces/VectorStore.md#name)

***

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/vector-store/base-store.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L64)

Dimension of vectors this store accepts

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`dimensions`](../interfaces/VectorStore.md#dimensions)

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

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`insert`](../interfaces/VectorStore.md#insert)

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

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`upsert`](../interfaces/VectorStore.md#upsert)

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

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`search`](../interfaces/VectorStore.md#search)

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

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`delete`](../interfaces/VectorStore.md#delete)

***

### count()

> `abstract` **count**(): `Promise`\<`number`\>

Defined in: [rag/src/vector-store/base-store.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L141)

Get the number of chunks in the store.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`count`](../interfaces/VectorStore.md#count)

***

### clear()

> `abstract` **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/vector-store/base-store.ts:146](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/base-store.ts#L146)

Remove all chunks from the store.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`VectorStore`](../interfaces/VectorStore.md).[`clear`](../interfaces/VectorStore.md#clear)
