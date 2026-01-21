[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / normalizeL2

# Function: normalizeL2()

> **normalizeL2**(`embedding`): `number`[]

Defined in: [rag/src/embeddings/utils.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L73)

Normalize a vector to unit length (L2 normalization).

After normalization, the vector has magnitude 1, which makes
dot product equivalent to cosine similarity.

## Parameters

### embedding

`number`[]

Vector to normalize

## Returns

`number`[]

New vector with unit length

## Example

```typescript
const normalized = normalizeL2([3, 4]);
// [0.6, 0.8] - unit vector pointing same direction
l2Norm(normalized); // 1.0
```
