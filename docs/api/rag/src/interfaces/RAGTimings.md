[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGTimings

# Interface: RAGTimings

Defined in: [rag/src/engine/types.ts:182](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L182)

Timing information for pipeline stages.

## Properties

### enhancementMs?

> `optional` **enhancementMs**: `number`

Defined in: [rag/src/engine/types.ts:184](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L184)

Time spent on query enhancement (ms)

***

### retrievalMs

> **retrievalMs**: `number`

Defined in: [rag/src/engine/types.ts:186](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L186)

Time spent on retrieval (ms)

***

### rerankingMs?

> `optional` **rerankingMs**: `number`

Defined in: [rag/src/engine/types.ts:188](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L188)

Time spent on reranking (ms)

***

### assemblyMs

> **assemblyMs**: `number`

Defined in: [rag/src/engine/types.ts:190](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L190)

Time spent on assembly (ms)

***

### totalMs

> **totalMs**: `number`

Defined in: [rag/src/engine/types.ts:192](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L192)

Total pipeline time (ms)
