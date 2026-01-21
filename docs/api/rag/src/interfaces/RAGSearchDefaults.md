[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGSearchDefaults

# Interface: RAGSearchDefaults

Defined in: [rag/src/engine/types.ts:89](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L89)

Default values for search options.

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/engine/types.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L91)

Default topK for retrieval

***

### minScore?

> `optional` **minScore**: `number`

Defined in: [rag/src/engine/types.ts:93](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L93)

Default minimum score threshold

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/engine/types.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L95)

Default ordering strategy

***

### enhance?

> `optional` **enhance**: `boolean`

Defined in: [rag/src/engine/types.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L97)

Default: whether to enhance queries

***

### rerank?

> `optional` **rerank**: `boolean`

Defined in: [rag/src/engine/types.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L99)

Default: whether to rerank results

***

### useCache?

> `optional` **useCache**: `boolean`

Defined in: [rag/src/engine/types.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L101)

Default: whether to use cache

***

### cacheTtl?

> `optional` **cacheTtl**: `number`

Defined in: [rag/src/engine/types.ts:103](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L103)

Default cache TTL in milliseconds
