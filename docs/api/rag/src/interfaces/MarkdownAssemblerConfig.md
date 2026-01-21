[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MarkdownAssemblerConfig

# Interface: MarkdownAssemblerConfig

Defined in: [rag/src/assembly/types.ts:257](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L257)

Configuration specific to Markdown format assembler.

Outputs: `[1] content... (source: file:line)`

## Extends

- [`AssemblerConfig`](AssemblerConfig.md)

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/assembly/types.ts:173](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L173)

Name for this assembler instance

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`name`](AssemblerConfig.md#name)

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/assembly/types.ts:179](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L179)

Ordering strategy for chunks.
Default: 'relevance'

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`ordering`](AssemblerConfig.md#ordering)

***

### sandwichStartCount?

> `optional` **sandwichStartCount**: `number`

Defined in: [rag/src/assembly/types.ts:186](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L186)

For 'sandwich' ordering: how many top chunks at the start.
Remaining high-scoring chunks go at the end.
Default: half of included chunks

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`sandwichStartCount`](AssemblerConfig.md#sandwichstartcount)

***

### tokenBudget?

> `optional` **tokenBudget**: [`TokenBudgetConfig`](TokenBudgetConfig.md)

Defined in: [rag/src/assembly/types.ts:189](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L189)

Token budget configuration

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`tokenBudget`](AssemblerConfig.md#tokenbudget)

***

### deduplication?

> `optional` **deduplication**: [`DeduplicationConfig`](DeduplicationConfig.md)

Defined in: [rag/src/assembly/types.ts:192](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L192)

Deduplication configuration

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`deduplication`](AssemblerConfig.md#deduplication)

***

### includeSourceAttribution?

> `optional` **includeSourceAttribution**: `boolean`

Defined in: [rag/src/assembly/types.ts:198](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L198)

Include source attributions in formatted output.
Default: true

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`includeSourceAttribution`](AssemblerConfig.md#includesourceattribution)

***

### includeScores?

> `optional` **includeScores**: `boolean`

Defined in: [rag/src/assembly/types.ts:204](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L204)

Include relevance scores in formatted output.
Default: false

#### Inherited from

[`AssemblerConfig`](AssemblerConfig.md).[`includeScores`](AssemblerConfig.md#includescores)

***

### citationStyle?

> `optional` **citationStyle**: `"inline"` \| `"footnote"` \| `"header"`

Defined in: [rag/src/assembly/types.ts:265](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L265)

Format for source citations.
- 'inline': `[1] content (source: file.md:10)`
- 'footnote': `content [1]` with footnotes at end
- 'header': `### Source 1: file.md\ncontent`
Default: 'inline'

***

### chunkSeparator?

> `optional` **chunkSeparator**: `string`

Defined in: [rag/src/assembly/types.ts:271](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L271)

Separator between chunks.
Default: '\n\n---\n\n'

***

### includeSectionHeaders?

> `optional` **includeSectionHeaders**: `boolean`

Defined in: [rag/src/assembly/types.ts:277](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L277)

Include section headers if available.
Default: true
