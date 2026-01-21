[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AssemblerConfig

# Interface: AssemblerConfig

Defined in: [rag/src/assembly/types.ts:171](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L171)

Configuration for context assemblers.

## Extended by

- [`XMLAssemblerConfig`](XMLAssemblerConfig.md)
- [`MarkdownAssemblerConfig`](MarkdownAssemblerConfig.md)

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/assembly/types.ts:173](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L173)

Name for this assembler instance

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/assembly/types.ts:179](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L179)

Ordering strategy for chunks.
Default: 'relevance'

***

### sandwichStartCount?

> `optional` **sandwichStartCount**: `number`

Defined in: [rag/src/assembly/types.ts:186](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L186)

For 'sandwich' ordering: how many top chunks at the start.
Remaining high-scoring chunks go at the end.
Default: half of included chunks

***

### tokenBudget?

> `optional` **tokenBudget**: [`TokenBudgetConfig`](TokenBudgetConfig.md)

Defined in: [rag/src/assembly/types.ts:189](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L189)

Token budget configuration

***

### deduplication?

> `optional` **deduplication**: [`DeduplicationConfig`](DeduplicationConfig.md)

Defined in: [rag/src/assembly/types.ts:192](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L192)

Deduplication configuration

***

### includeSourceAttribution?

> `optional` **includeSourceAttribution**: `boolean`

Defined in: [rag/src/assembly/types.ts:198](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L198)

Include source attributions in formatted output.
Default: true

***

### includeScores?

> `optional` **includeScores**: `boolean`

Defined in: [rag/src/assembly/types.ts:204](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L204)

Include relevance scores in formatted output.
Default: false
