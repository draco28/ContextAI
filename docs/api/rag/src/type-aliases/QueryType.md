[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryType

# Type Alias: QueryType

> **QueryType** = `"simple"` \| `"factual"` \| `"complex"` \| `"conversational"`

Defined in: [rag/src/adaptive/types.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L31)

Query type classification categories.

Each type determines how the RAG pipeline should be configured:
- SIMPLE: Skip retrieval entirely (greetings, thanks, etc.)
- FACTUAL: Standard pipeline (what, who, when, where questions)
- COMPLEX: Full pipeline with query enhancement (compare, analyze)
- CONVERSATIONAL: Use conversation history for context resolution
