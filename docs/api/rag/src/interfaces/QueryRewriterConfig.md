[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryRewriterConfig

# Interface: QueryRewriterConfig

Defined in: [rag/src/query-enhancement/types.ts:171](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L171)

Configuration for QueryRewriter.

The rewriter clarifies ambiguous or poorly-formed queries
by rephrasing them for clarity while preserving intent.

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

Defined in: [rag/src/query-enhancement/types.ts:173](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L173)

LLM provider for query rewriting

***

### promptTemplate?

> `optional` **promptTemplate**: `string`

Defined in: [rag/src/query-enhancement/types.ts:180](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L180)

Prompt template for rewriting.
Placeholder: {query}

Default: Instructs LLM to clarify and rephrase.

***

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: [rag/src/query-enhancement/types.ts:185](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L185)

System prompt for the LLM.
Default: Query clarification instructions.

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [rag/src/query-enhancement/types.ts:191](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L191)

Temperature for generation.
Lower = more conservative rewrites.
Default: 0.3
