[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingResult

# Interface: EmbeddingResult

Defined in: [rag/src/embeddings/types.ts:15](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L15)

Result from generating an embedding.

## Properties

### embedding

> **embedding**: `number`[]

Defined in: [rag/src/embeddings/types.ts:17](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L17)

The embedding vector (normalized)

***

### tokenCount

> **tokenCount**: `number`

Defined in: [rag/src/embeddings/types.ts:19](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L19)

Number of tokens in the input text

***

### model

> **model**: `string`

Defined in: [rag/src/embeddings/types.ts:21](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/types.ts#L21)

Model used to generate the embedding
