[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / meanEmbedding

# Function: meanEmbedding()

> **meanEmbedding**(`embeddings`, `normalize`): `number`[]

Defined in: [rag/src/embeddings/utils.ts:181](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L181)

Compute the mean of multiple embedding vectors.

Useful for combining embeddings (e.g., averaging sentence embeddings).

## Parameters

### embeddings

`number`[][]

Array of embedding vectors

### normalize

`boolean` = `true`

Whether to normalize the result (default: true)

## Returns

`number`[]

Mean vector

## Throws

If embeddings array is empty

## Throws

If embeddings have different dimensions
