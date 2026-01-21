[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HuggingFaceEmbeddingConfig

# Interface: HuggingFaceEmbeddingConfig

Defined in: [rag/src/embeddings/huggingface-provider.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L22)

Configuration for HuggingFace embedding provider.

## Properties

### model?

> `optional` **model**: `string`

Defined in: [rag/src/embeddings/huggingface-provider.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L24)

Model identifier (e.g., "Xenova/bge-large-en-v1.5")

***

### dimensions?

> `optional` **dimensions**: `number`

Defined in: [rag/src/embeddings/huggingface-provider.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L26)

Output embedding dimensions (auto-detected from model if not specified)

***

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [rag/src/embeddings/huggingface-provider.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L28)

Maximum texts per batch request

***

### normalize?

> `optional` **normalize**: `boolean`

Defined in: [rag/src/embeddings/huggingface-provider.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L30)

Whether to normalize embeddings to unit length (default: true)

***

### device?

> `optional` **device**: `"auto"` \| `"cpu"` \| `"gpu"`

Defined in: [rag/src/embeddings/huggingface-provider.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L32)

Device to run inference on: 'cpu' | 'gpu' | 'auto'

***

### onProgress()?

> `optional` **onProgress**: (`progress`) => `void`

Defined in: [rag/src/embeddings/huggingface-provider.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/huggingface-provider.ts#L34)

Progress callback for model download

#### Parameters

##### progress

###### status

`string`

###### progress?

`number`

#### Returns

`void`
