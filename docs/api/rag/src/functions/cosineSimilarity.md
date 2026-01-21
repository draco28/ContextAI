[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / cosineSimilarity

# Function: cosineSimilarity()

> **cosineSimilarity**(`a`, `b`): `number`

Defined in: [rag/src/embeddings/utils.ts:109](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L109)

Compute cosine similarity between two vectors.

Measures the angle between vectors, ignoring magnitude.
Values range from -1 (opposite) to 1 (identical).

For pre-normalized vectors, use `dotProduct` instead (faster).

## Parameters

### a

`number`[]

First vector

### b

`number`[]

Second vector

## Returns

`number`

Similarity score between -1 and 1

## Throws

If vectors have different lengths

## Example

```typescript
const query = [1, 0, 0];
const doc1 = [1, 0, 0];  // identical
const doc2 = [0, 1, 0];  // orthogonal
const doc3 = [-1, 0, 0]; // opposite

cosineSimilarity(query, doc1); // 1.0
cosineSimilarity(query, doc2); // 0.0
cosineSimilarity(query, doc3); // -1.0
```
