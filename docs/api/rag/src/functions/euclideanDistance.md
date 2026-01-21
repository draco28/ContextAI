[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / euclideanDistance

# Function: euclideanDistance()

> **euclideanDistance**(`a`, `b`): `number`

Defined in: [rag/src/embeddings/utils.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L142)

Compute Euclidean distance between two vectors.

Lower values indicate more similar vectors.
For normalized vectors, this is related to cosine similarity:
distance² = 2 - 2·similarity

## Parameters

### a

`number`[]

First vector

### b

`number`[]

Second vector

## Returns

`number`

Euclidean distance (always >= 0)

## Throws

If vectors have different lengths

## Example

```typescript
euclideanDistance([0, 0], [3, 4]); // 5
```
