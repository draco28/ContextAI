[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingProvider

# Interface: EmbeddingProvider

Defined in: [rag/src/embeddings/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L67)

Interface for embedding providers.

Providers are responsible for:
1. Generating embeddings from text (embed)
2. Batch embedding for efficiency (embedBatch)
3. Reporting availability status (isAvailable)

## Example

```typescript
const provider: EmbeddingProvider = new OpenAIEmbeddingProvider({
  model: 'text-embedding-3-small',
  dimensions: 1536
});

if (await provider.isAvailable()) {
  const result = await provider.embed('Hello, world!');
  console.log(result.embedding.length); // 1536
}
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/embeddings/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L69)

Human-readable name of this provider

***

### dimensions

> `readonly` **dimensions**: `number`

Defined in: [rag/src/embeddings/types.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L72)

Output embedding dimensions

***

### maxBatchSize

> `readonly` **maxBatchSize**: `number`

Defined in: [rag/src/embeddings/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L75)

Maximum texts per batch request

## Methods

### embed()

> **embed**(`text`): `Promise`\<[`EmbeddingResult`](EmbeddingResult.md)\>

Defined in: [rag/src/embeddings/types.ts:84](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L84)

Generate an embedding for a single text.

#### Parameters

##### text

`string`

Text to embed

#### Returns

`Promise`\<[`EmbeddingResult`](EmbeddingResult.md)\>

Embedding result with vector, token count, and model

#### Throws

If embedding fails

***

### embedBatch()

> **embedBatch**(`texts`): `Promise`\<[`EmbeddingResult`](EmbeddingResult.md)[]\>

Defined in: [rag/src/embeddings/types.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L95)

Generate embeddings for multiple texts.

Automatically handles batching if texts exceed maxBatchSize.

#### Parameters

##### texts

`string`[]

Array of texts to embed

#### Returns

`Promise`\<[`EmbeddingResult`](EmbeddingResult.md)[]\>

Array of embedding results in same order as input

#### Throws

If embedding fails

***

### isAvailable()

> **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [rag/src/embeddings/types.ts:104](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L104)

Check if the provider is available and ready.

May check API keys, model availability, network connectivity, etc.

#### Returns

`Promise`\<`boolean`\>

true if the provider can generate embeddings
