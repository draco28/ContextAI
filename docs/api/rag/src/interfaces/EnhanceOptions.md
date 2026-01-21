[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EnhanceOptions

# Interface: EnhanceOptions

Defined in: [rag/src/query-enhancement/types.ts:90](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L90)

Options for enhancement operations.

## Properties

### minQueryLength?

> `optional` **minQueryLength**: `number`

Defined in: [rag/src/query-enhancement/types.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L96)

Minimum query length to attempt enhancement.
Very short queries (e.g., single words) may not benefit.
Default: 3 characters

***

### maxVariants?

> `optional` **maxVariants**: `number`

Defined in: [rag/src/query-enhancement/types.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L101)

Maximum number of enhanced variants to generate.
Default varies by strategy.

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [rag/src/query-enhancement/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L107)

Temperature for LLM generation.
Higher = more creative, lower = more focused.
Default varies by strategy (0.3-0.7 typical).

***

### includeOriginal?

> `optional` **includeOriginal**: `boolean`

Defined in: [rag/src/query-enhancement/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L113)

Whether to include the original query in results.
When true, original is prepended to enhanced array.
Default: false (original only in `original` field)
