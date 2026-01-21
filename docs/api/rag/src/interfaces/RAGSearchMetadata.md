[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGSearchMetadata

# Interface: RAGSearchMetadata

Defined in: [rag/src/engine/types.ts:200](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L200)

Detailed metadata about the search operation.

Provides transparency into what happened during the search.

## Properties

### effectiveQuery

> **effectiveQuery**: `string`

Defined in: [rag/src/engine/types.ts:202](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L202)

The query used for retrieval (may differ from original if enhanced)

***

### allQueries?

> `optional` **allQueries**: `string`[]

Defined in: [rag/src/engine/types.ts:204](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L204)

All queries used (if multi-query enhancement)

***

### enhancement?

> `optional` **enhancement**: [`EnhancementResult`](EnhancementResult.md)

Defined in: [rag/src/engine/types.ts:206](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L206)

Enhancement result details (if enhancement was performed)

***

### retrievedCount

> **retrievedCount**: `number`

Defined in: [rag/src/engine/types.ts:208](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L208)

Number of results from retrieval (before reranking)

***

### rerankedCount?

> `optional` **rerankedCount**: `number`

Defined in: [rag/src/engine/types.ts:210](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L210)

Number of results after reranking

***

### assembledCount

> **assembledCount**: `number`

Defined in: [rag/src/engine/types.ts:212](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L212)

Number of chunks included in assembled context

***

### deduplicatedCount

> **deduplicatedCount**: `number`

Defined in: [rag/src/engine/types.ts:214](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L214)

Number of chunks deduplicated

***

### droppedCount

> **droppedCount**: `number`

Defined in: [rag/src/engine/types.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L216)

Number of chunks dropped due to token budget

***

### fromCache

> **fromCache**: `boolean`

Defined in: [rag/src/engine/types.ts:218](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L218)

Whether result was served from cache

***

### timings

> **timings**: [`RAGTimings`](RAGTimings.md)

Defined in: [rag/src/engine/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L220)

Pipeline timing information
