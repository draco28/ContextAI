[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / OrderingStrategy

# Type Alias: OrderingStrategy

> **OrderingStrategy** = `"relevance"` \| `"sandwich"` \| `"chronological"`

Defined in: [rag/src/assembly/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L26)

Strategy for ordering chunks in assembled context.

LLMs exhibit "lost in the middle" phenomenon where they pay
more attention to content at the beginning and end of context.

- 'relevance': Order by score descending (default)
- 'sandwich': Most relevant at start and end (mitigates lost-in-middle)
- 'chronological': Order by document/chunk position (if available)
