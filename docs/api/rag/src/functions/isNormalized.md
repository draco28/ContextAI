[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / isNormalized

# Function: isNormalized()

> **isNormalized**(`embedding`, `tolerance`): `boolean`

Defined in: [rag/src/embeddings/utils.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/utils.ts#L162)

Check if a vector is normalized (unit length).

## Parameters

### embedding

`number`[]

Vector to check

### tolerance

`number` = `1e-6`

Acceptable deviation from 1.0 (default: 1e-6)

## Returns

`boolean`

true if the vector has unit length
