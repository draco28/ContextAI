[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / PositionBiasStrategy

# Type Alias: PositionBiasStrategy

> **PositionBiasStrategy** = `"none"` \| `"sandwich"` \| `"reverse-sandwich"` \| `"interleave"`

Defined in: [rag/src/reranker/types.ts:277](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L277)

Strategy for position bias mitigation.

LLMs exhibit "lost in the middle" phenomenon where they pay
more attention to content at the beginning and end of context.
