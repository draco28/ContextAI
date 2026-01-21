[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MultiQueryConfig

# Interface: MultiQueryConfig

Defined in: [rag/src/query-enhancement/types.ts:245](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L245)

Configuration for MultiQueryExpander.

Generates multiple query variants from different perspectives
to retrieve a broader set of relevant documents.

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

Defined in: [rag/src/query-enhancement/types.ts:247](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L247)

LLM provider for query expansion

***

### numVariants?

> `optional` **numVariants**: `number`

Defined in: [rag/src/query-enhancement/types.ts:252](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L252)

Number of query variants to generate.
Default: 3

***

### promptTemplate?

> `optional` **promptTemplate**: `string`

Defined in: [rag/src/query-enhancement/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L259)

Prompt template for expansion.
Placeholders: {query}, {numVariants}

Default: Instructs LLM to generate diverse reformulations.

***

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: [rag/src/query-enhancement/types.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L264)

System prompt for the LLM.
Default: Query expansion instructions.

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [rag/src/query-enhancement/types.ts:270](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L270)

Temperature for generation.
Higher = more diverse variants.
Default: 0.5
