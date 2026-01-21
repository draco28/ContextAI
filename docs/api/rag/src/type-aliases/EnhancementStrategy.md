[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EnhancementStrategy

# Type Alias: EnhancementStrategy

> **EnhancementStrategy** = `"rewrite"` \| `"hyde"` \| `"multi-query"` \| `"passthrough"`

Defined in: [rag/src/query-enhancement/types.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L29)

Type of query enhancement strategy used.

Each strategy has different trade-offs:
- 'rewrite': 1 LLM call, returns single clarified query
- 'hyde': 1+ LLM calls + embedding, returns queries based on hypothetical docs
- 'multi-query': 1 LLM call, returns multiple query variants
- 'passthrough': No transformation (for testing/fallback)
