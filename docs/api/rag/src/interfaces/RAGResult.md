[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGResult

# Interface: RAGResult

Defined in: [rag/src/engine/types.ts:229](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L229)

Result of a RAG search operation.

Contains the assembled context ready for LLM consumption,
plus detailed metadata for debugging and observability.

## Extended by

- [`AdaptiveRAGResult`](AdaptiveRAGResult.md)

## Properties

### content

> **content**: `string`

Defined in: [rag/src/engine/types.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L234)

The assembled context string ready for LLM consumption.
Formatted according to the assembler configuration.

***

### estimatedTokens

> **estimatedTokens**: `number`

Defined in: [rag/src/engine/types.ts:239](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L239)

Estimated token count for the assembled content.

***

### sources

> **sources**: [`SourceAttribution`](SourceAttribution.md)[]

Defined in: [rag/src/engine/types.ts:244](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L244)

Source attributions for citation generation.

***

### assembly

> **assembly**: [`AssembledContext`](AssembledContext.md)

Defined in: [rag/src/engine/types.ts:249](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L249)

The full assembled context object (includes chunks).

***

### retrievalResults

> **retrievalResults**: [`RetrievalResult`](RetrievalResult.md)[]

Defined in: [rag/src/engine/types.ts:254](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L254)

Retrieval results before assembly (for debugging).

***

### rerankerResults?

> `optional` **rerankerResults**: [`RerankerResult`](RerankerResult.md)[]

Defined in: [rag/src/engine/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L259)

Reranked results (if reranking was performed).

***

### metadata

> **metadata**: [`RAGSearchMetadata`](RAGSearchMetadata.md)

Defined in: [rag/src/engine/types.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L264)

Search metadata for debugging and observability.
