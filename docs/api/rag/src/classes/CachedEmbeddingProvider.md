[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / CachedEmbeddingProvider

# Class: CachedEmbeddingProvider

Defined in: [rag/src/embeddings/cache.ts:204](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L204)

Wrapper that adds caching to any embedding provider.

Uses the Decorator Pattern to transparently cache embeddings.

## Example

```typescript
const baseProvider = new OllamaEmbeddingProvider();
const cachedProvider = new CachedEmbeddingProvider({
  provider: baseProvider,
  maxCacheSize: 5000,
});

// First call: generates embedding, stores in cache
await cachedProvider.embed('Hello'); // ~100ms

// Second call: returns cached embedding
await cachedProvider.embed('Hello'); // ~0ms
```

## Extends

- [`BaseEmbeddingProvider`](BaseEmbeddingProvider.md)

## Constructors

### Constructor

> **new CachedEmbeddingProvider**(`config`): `CachedEmbeddingProvider`

Defined in: [rag/src/embeddings/cache.ts:217](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L217)

#### Parameters

##### config

[`CachedEmbeddingProviderConfig`](../interfaces/CachedEmbeddingProviderConfig.md)

#### Returns

`CachedEmbeddingProvider`

#### Overrides

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`constructor`](BaseEmbeddingProvider.md#constructor)

## Properties

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/embeddings/base-provider.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L62)

Output embedding dimensions

#### Inherited from

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`dimensions`](BaseEmbeddingProvider.md#dimensions)

***

### maxBatchSize

> `readonly` **maxBatchSize**: `number`

Defined in: [rag/src/embeddings/base-provider.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L65)

Maximum texts per batch request

#### Inherited from

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`maxBatchSize`](BaseEmbeddingProvider.md#maxbatchsize)

***

### name

> `readonly` **name**: `string`

Defined in: [rag/src/embeddings/cache.ts:205](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L205)

Human-readable name of this provider

#### Overrides

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`name`](BaseEmbeddingProvider.md#name)

## Methods

### embed()

> **embed**(`text`): `Promise`\<[`EmbeddingResult`](../interfaces/EmbeddingResult.md)\>

Defined in: [rag/src/embeddings/base-provider.ts:82](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L82)

Generate an embedding for a single text.

Validates input, calls provider, and optionally normalizes.

#### Parameters

##### text

`string`

#### Returns

`Promise`\<[`EmbeddingResult`](../interfaces/EmbeddingResult.md)\>

#### Inherited from

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`embed`](BaseEmbeddingProvider.md#embed)

***

### embedBatch()

> **embedBatch**(`texts`): `Promise`\<[`EmbeddingResult`](../interfaces/EmbeddingResult.md)[]\>

Defined in: [rag/src/embeddings/base-provider.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L107)

Generate embeddings for multiple texts.

Automatically handles batching if texts exceed maxBatchSize.

#### Parameters

##### texts

`string`[]

#### Returns

`Promise`\<[`EmbeddingResult`](../interfaces/EmbeddingResult.md)[]\>

#### Inherited from

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`embedBatch`](BaseEmbeddingProvider.md#embedbatch)

***

### isAvailable()

> **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [rag/src/embeddings/cache.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L234)

Check if the underlying provider is available.

#### Returns

`Promise`\<`boolean`\>

#### Overrides

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`isAvailable`](BaseEmbeddingProvider.md#isavailable)

***

### getStats()

> **getStats**(): `object`

Defined in: [rag/src/embeddings/cache.ts:320](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L320)

Get cache statistics.

#### Returns

`object`

##### hits

> **hits**: `number`

##### misses

> **misses**: `number`

##### hitRate

> **hitRate**: `number`

***

### clearCache()

> **clearCache**(): `Promise`\<`void`\>

Defined in: [rag/src/embeddings/cache.ts:332](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L332)

Clear the cache.

#### Returns

`Promise`\<`void`\>

***

### resetStats()

> **resetStats**(): `void`

Defined in: [rag/src/embeddings/cache.ts:339](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L339)

Reset statistics.

#### Returns

`void`
