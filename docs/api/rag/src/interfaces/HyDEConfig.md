[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HyDEConfig

# Interface: HyDEConfig

Defined in: [rag/src/query-enhancement/types.ts:203](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L203)

Configuration for HyDEEnhancer.

HyDE (Hypothetical Document Embeddings) generates a hypothetical
answer to the query, then uses its embedding for retrieval.
This can find documents similar to what the answer *should* look like.

Reference: Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels"

## Extends

- [`BaseEnhancerConfig`](BaseEnhancerConfig.md)

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/query-enhancement/types.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L162)

Custom name for this enhancer instance

#### Inherited from

[`BaseEnhancerConfig`](BaseEnhancerConfig.md).[`name`](BaseEnhancerConfig.md#name)

***

### llmProvider

> **llmProvider**: `LLMProvider`

Defined in: [rag/src/query-enhancement/types.ts:205](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L205)

LLM provider for generating hypothetical documents

***

### embeddingProvider

> **embeddingProvider**: [`EmbeddingProvider`](EmbeddingProvider.md)

Defined in: [rag/src/query-enhancement/types.ts:207](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L207)

Embedding provider for embedding hypothetical documents

***

### numHypothetical?

> `optional` **numHypothetical**: `number`

Defined in: [rag/src/query-enhancement/types.ts:213](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L213)

Number of hypothetical documents to generate.
More = better coverage but higher cost.
Default: 1

***

### promptTemplate?

> `optional` **promptTemplate**: `string`

Defined in: [rag/src/query-enhancement/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L220)

Prompt template for hypothetical document generation.
Placeholder: {query}

Default: Instructs LLM to write a passage that answers the query.

***

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: [rag/src/query-enhancement/types.ts:225](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L225)

System prompt for the LLM.
Default: Document generation instructions.

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [rag/src/query-enhancement/types.ts:231](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L231)

Temperature for generation.
Higher = more diverse hypothetical docs.
Default: 0.7

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [rag/src/query-enhancement/types.ts:236](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L236)

Maximum tokens for hypothetical document.
Default: 256
