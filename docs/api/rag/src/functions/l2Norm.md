[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / l2Norm

# Function: l2Norm()

> **l2Norm**(`embedding`): `number`

Defined in: [rag/src/embeddings/utils.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L49)

Compute the L2 (Euclidean) norm of a vector.

## Parameters

### embedding

`number`[]

Vector to compute norm for

## Returns

`number`

The magnitude (length) of the vector

## Example

```typescript
l2Norm([3, 4]); // 5 (Pythagorean: sqrt(9 + 16))
```
