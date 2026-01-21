[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / PipelineRecommendation

# Interface: PipelineRecommendation

Defined in: [rag/src/adaptive/types.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L108)

Recommended pipeline configuration based on query type.

## Properties

### skipRetrieval

> **skipRetrieval**: `boolean`

Defined in: [rag/src/adaptive/types.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L110)

Whether to skip retrieval entirely

***

### enableEnhancement

> **enableEnhancement**: `boolean`

Defined in: [rag/src/adaptive/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L113)

Whether to enable query enhancement

***

### suggestedStrategy?

> `optional` **suggestedStrategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md)

Defined in: [rag/src/adaptive/types.ts:116](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L116)

Suggested enhancement strategy (if enhancement enabled)

***

### enableReranking

> **enableReranking**: `boolean`

Defined in: [rag/src/adaptive/types.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L119)

Whether to enable reranking

***

### suggestedTopK

> **suggestedTopK**: `number`

Defined in: [rag/src/adaptive/types.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L122)

Suggested topK based on query complexity

***

### needsConversationContext

> **needsConversationContext**: `boolean`

Defined in: [rag/src/adaptive/types.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L129)

Whether conversation history is needed to resolve the query.
For CONVERSATIONAL queries, the caller should resolve
pronouns/references before RAG retrieval.
