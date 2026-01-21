[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / OllamaEmbeddingProvider

# Class: OllamaEmbeddingProvider

Defined in: [rag/src/embeddings/ollama-provider.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L83)

Ollama embedding provider for local inference.

Connects to a local Ollama server to generate embeddings.
Supports any Ollama-compatible embedding model.

## Example

```typescript
const provider = new OllamaEmbeddingProvider({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
});

if (await provider.isAvailable()) {
  const result = await provider.embed('Hello, world!');
  console.log(result.embedding.length); // 768
}
```

## Extends

- [`BaseEmbeddingProvider`](BaseEmbeddingProvider.md)

## Constructors

### Constructor

> **new OllamaEmbeddingProvider**(`config`): `OllamaEmbeddingProvider`

Defined in: [rag/src/embeddings/ollama-provider.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L92)

#### Parameters

##### config

[`OllamaEmbeddingConfig`](../interfaces/OllamaEmbeddingConfig.md) = `{}`

#### Returns

`OllamaEmbeddingProvider`

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

> `readonly` **name**: `"OllamaEmbeddingProvider"` = `'OllamaEmbeddingProvider'`

Defined in: [rag/src/embeddings/ollama-provider.ts:84](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L84)

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

Defined in: [rag/src/embeddings/ollama-provider.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L108)

Check if the Ollama server is available.

Pings the server and verifies the model is available.

#### Returns

`Promise`\<`boolean`\>

#### Overrides

[`BaseEmbeddingProvider`](BaseEmbeddingProvider.md).[`isAvailable`](BaseEmbeddingProvider.md#isavailable)
