[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / dotProduct

# Function: dotProduct()

> **dotProduct**(`a`, `b`): `number`

Defined in: [rag/src/embeddings/utils.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L26)

Compute the dot product of two vectors.

For normalized vectors, this equals cosine similarity.

## Parameters

### a

`number`[]

First vector

### b

`number`[]

Second vector

## Returns

`number`

Dot product (sum of element-wise products)

## Throws

If vectors have different lengths

## Example

```typescript
const a = [1, 2, 3];
const b = [4, 5, 6];
dotProduct(a, b); // 1*4 + 2*5 + 3*6 = 32
```
