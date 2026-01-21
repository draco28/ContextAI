[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / XMLAssemblerConfig

# Interface: XMLAssemblerConfig

Defined in: [rag/src/assembly/types.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L216)

Configuration specific to XML format assembler.

Outputs: `<source id="1" file="..." line="...">content</source>`

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

### rootTag?

> `optional` **rootTag**: `string`

Defined in: [rag/src/assembly/types.ts:221](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L221)

Root element tag name.
Default: 'sources'

***

### sourceTag?

> `optional` **sourceTag**: `string`

Defined in: [rag/src/assembly/types.ts:227](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L227)

Individual source element tag name.
Default: 'source'

***

### includeFilePath?

> `optional` **includeFilePath**: `boolean`

Defined in: [rag/src/assembly/types.ts:233](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L233)

Include file path attribute.
Default: true

***

### includeLocation?

> `optional` **includeLocation**: `boolean`

Defined in: [rag/src/assembly/types.ts:239](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L239)

Include line/page number attribute.
Default: true

***

### prettyPrint?

> `optional` **prettyPrint**: `boolean`

Defined in: [rag/src/assembly/types.ts:245](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L245)

Pretty print with indentation.
Default: true
