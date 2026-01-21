[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / OllamaEmbeddingConfig

# Interface: OllamaEmbeddingConfig

Defined in: [rag/src/embeddings/ollama-provider.ts:19](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L19)

Configuration for Ollama embedding provider.

## Properties

### model?

> `optional` **model**: `string`

Defined in: [rag/src/embeddings/ollama-provider.ts:21](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L21)

Model identifier (e.g., "nomic-embed-text")

***

### dimensions?

> `optional` **dimensions**: `number`

Defined in: [rag/src/embeddings/ollama-provider.ts:23](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L23)

Output embedding dimensions (auto-detected from model if not specified)

***

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [rag/src/embeddings/ollama-provider.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L25)

Maximum texts per batch request

***

### normalize?

> `optional` **normalize**: `boolean`

Defined in: [rag/src/embeddings/ollama-provider.ts:27](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L27)

Whether to normalize embeddings to unit length (default: true)

***

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: [rag/src/embeddings/ollama-provider.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L29)

Ollama server base URL

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [rag/src/embeddings/ollama-provider.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/ollama-provider.ts#L31)

Request timeout in milliseconds
