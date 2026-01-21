[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DistanceMetric

# Type Alias: DistanceMetric

> **DistanceMetric** = `"cosine"` \| `"euclidean"` \| `"dotProduct"`

Defined in: [rag/src/vector-store/types.ts:135](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L135)

Distance metric for similarity computation.

- cosine: Angle-based, ignores magnitude (most common for text)
- euclidean: Straight-line distance
- dotProduct: For pre-normalized vectors (fastest)
