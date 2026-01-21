[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveRAGResult

# Interface: AdaptiveRAGResult

Defined in: [rag/src/adaptive/types.ts:286](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L286)

Extended result from AdaptiveRAG.

## Extends

- [`RAGResult`](RAGResult.md)

## Properties

### classification?

> `optional` **classification**: [`ClassificationResult`](ClassificationResult.md)

Defined in: [rag/src/adaptive/types.ts:291](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L291)

Classification information for this query.
Present when includeClassificationInMetadata is true.

***

### skippedRetrieval

> **skippedRetrieval**: `boolean`

Defined in: [rag/src/adaptive/types.ts:296](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L296)

Whether retrieval was skipped for this query.

***

### skipReason?

> `optional` **skipReason**: `string`

Defined in: [rag/src/adaptive/types.ts:301](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L301)

Reason retrieval was skipped (if applicable).

***

### content

> **content**: `string`

Defined in: [rag/src/engine/types.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L234)

The assembled context string ready for LLM consumption.
Formatted according to the assembler configuration.

#### Inherited from

[`RAGResult`](RAGResult.md).[`content`](RAGResult.md#content)

***

### estimatedTokens

> **estimatedTokens**: `number`

Defined in: [rag/src/engine/types.ts:239](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L239)

Estimated token count for the assembled content.

#### Inherited from

[`RAGResult`](RAGResult.md).[`estimatedTokens`](RAGResult.md#estimatedtokens)

***

### sources

> **sources**: [`SourceAttribution`](SourceAttribution.md)[]

Defined in: [rag/src/engine/types.ts:244](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L244)

Source attributions for citation generation.

#### Inherited from

[`RAGResult`](RAGResult.md).[`sources`](RAGResult.md#sources)

***

### assembly

> **assembly**: [`AssembledContext`](AssembledContext.md)

Defined in: [rag/src/engine/types.ts:249](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L249)

The full assembled context object (includes chunks).

#### Inherited from

[`RAGResult`](RAGResult.md).[`assembly`](RAGResult.md#assembly)

***

### retrievalResults

> **retrievalResults**: [`RetrievalResult`](RetrievalResult.md)[]

Defined in: [rag/src/engine/types.ts:254](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L254)

Retrieval results before assembly (for debugging).

#### Inherited from

[`RAGResult`](RAGResult.md).[`retrievalResults`](RAGResult.md#retrievalresults)

***

### rerankerResults?

> `optional` **rerankerResults**: [`RerankerResult`](RerankerResult.md)[]

Defined in: [rag/src/engine/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L259)

Reranked results (if reranking was performed).

#### Inherited from

[`RAGResult`](RAGResult.md).[`rerankerResults`](RAGResult.md#rerankerresults)

***

### metadata

> **metadata**: [`RAGSearchMetadata`](RAGSearchMetadata.md)

Defined in: [rag/src/engine/types.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L264)

Search metadata for debugging and observability.

#### Inherited from

[`RAGResult`](RAGResult.md).[`metadata`](RAGResult.md#metadata)
