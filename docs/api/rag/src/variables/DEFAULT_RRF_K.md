[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DEFAULT\_RRF\_K

# Variable: DEFAULT\_RRF\_K

> `const` **DEFAULT\_RRF\_K**: `60` = `60`

Defined in: [rag/src/retrieval/rrf.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L28)

Default RRF k parameter.

k=60 is the standard value from the original RRF paper.
It provides a good balance between:
- Giving significant weight to top-ranked items
- Not over-penalizing items with lower ranks
