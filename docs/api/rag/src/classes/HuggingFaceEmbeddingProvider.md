[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HuggingFaceEmbeddingProvider

# Class: HuggingFaceEmbeddingProvider

Defined in: [rag/src/embeddings/huggingface-provider.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L81)

HuggingFace embedding provider using Transformers.js.

Provides local embedding generation without API calls.
Supports both browser and Node.js environments.

## Example

```typescript
const provider = new HuggingFaceEmbeddingProvider({
  model: 'Xenova/bge-large-en-v1.5',
});

if (await provider.isAvailable()) {
  const result = await provider.embed('Hello, world!');
  console.log(result.embedding.length); // 1024
}
```

## Extends

- [`BaseEmbeddingProvider`](BaseEmbeddingProvider.md)

## Constructors

### Constructor

> **new HuggingFaceEmbeddingProvider**(`config`): `HuggingFaceEmbeddingProvider`

Defined in: [rag/src/embeddings/huggingface-provider.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L99)

#### Parameters

##### config

[`HuggingFaceEmbeddingConfig`](../interfaces/HuggingFaceEmbeddingConfig.md) = `{}`

#### Returns

`HuggingFaceEmbeddingProvider`

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

> `readonly` **name**: `"HuggingFaceEmbeddingProvider"` = `'HuggingFaceEmbeddingProvider'`

Defined in: [rag/src/embeddings/huggingface-provider.ts:82](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L82)

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

Defined in: [rag/src/embeddings/huggingface-provider.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L115)

Check if the provider is available.

Verifies that @xenova/transformers is installed and the model can be loaded.

#### Returns

`Promise`\<`boolean`\>

#### Overrides

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`isAvailable`](BaseEmbeddingProvider.md#isavailable)
