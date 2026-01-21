[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseEmbeddingProvider

# Abstract Class: BaseEmbeddingProvider

Defined in: [rag/src/embeddings/base-provider.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L54)

Abstract base class for embedding providers.

Provides:
- Input validation (empty text, batch size)
- Auto-batching for large requests
- Optional L2 normalization
- Consistent error handling

Subclasses must implement:
- `_embed()` - Provider-specific single text embedding
- `_embedBatch()` - Provider-specific batch embedding (optional)
- `isAvailable()` - Provider availability check

## Example

```typescript
class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(apiKey: string) {
    super({
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 2048
    });
    this.apiKey = apiKey;
  }

  protected async _embed(text: string): Promise<EmbeddingResult> {
    // Call OpenAI API
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
```

## Extended by

- [`HuggingFaceEmbeddingProvider`](HuggingFaceEmbeddingProvider.md)
- [`OllamaEmbeddingProvider`](OllamaEmbeddingProvider.md)
- [`CachedEmbeddingProvider`](CachedEmbeddingProvider.md)

## Implements

- [`EmbeddingProvider`](../interfaces/EmbeddingProvider.md)

## Constructors

### Constructor

> **new BaseEmbeddingProvider**(`config`): `BaseEmbeddingProvider`

Defined in: [rag/src/embeddings/base-provider.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L70)

#### Parameters

##### config

[`EmbeddingProviderConfig`](../interfaces/EmbeddingProviderConfig.md)

#### Returns

`BaseEmbeddingProvider`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/embeddings/base-provider.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L56)

Human-readable name of this provider

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`name`](../interfaces/EmbeddingProvider.md#name)

***

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/embeddings/base-provider.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L62)

Output embedding dimensions

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`dimensions`](../interfaces/EmbeddingProvider.md#dimensions)

***

### maxBatchSize

> `readonly` **maxBatchSize**: `number`

Defined in: [rag/src/embeddings/base-provider.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L65)

Maximum texts per batch request

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`maxBatchSize`](../interfaces/EmbeddingProvider.md#maxbatchsize)

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

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`embed`](../interfaces/EmbeddingProvider.md#embed)

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

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`embedBatch`](../interfaces/EmbeddingProvider.md#embedbatch)

***

### isAvailable()

> `abstract` **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [rag/src/embeddings/base-provider.ts:161](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/base-provider.ts#L161)

Check if the provider is available and ready.

Subclasses must implement this to check API keys, connectivity, etc.

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`EmbeddingProvider`](../interfaces/EmbeddingProvider.md).[`isAvailable`](../interfaces/EmbeddingProvider.md#isavailable)
