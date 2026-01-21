[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / generateCacheKey

# Function: generateCacheKey()

> **generateCacheKey**(`text`): `string`

Defined in: [rag/src/embeddings/cache.ts:158](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/cache.ts#L158)

Generate a cache key from text.

Uses a simple hash function for fast key generation.
For production with high collision sensitivity, consider using SHA-256.

## Parameters

### text

`string`

## Returns

`string`
