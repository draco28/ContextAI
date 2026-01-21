[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MarkdownAssembler

# Class: MarkdownAssembler

Defined in: [rag/src/assembly/markdown-assembler.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/markdown-assembler.ts#L66)

Assembler that outputs Markdown-formatted context.

## Example

```typescript
const assembler = new MarkdownAssembler({
  citationStyle: 'footnote',
  ordering: 'sandwich',
});

const result = await assembler.assemble(rerankedResults);
// Content from first source [1]
//
// ---
//
// Content from second source [2]
//
// ---
//
// [1]: auth.md:42
// [2]: users.md:15
```

## Extends

- [`BaseAssembler`](BaseAssembler.md)

## Constructors

### Constructor

> **new MarkdownAssembler**(`config?`): `MarkdownAssembler`

Defined in: [rag/src/assembly/markdown-assembler.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/markdown-assembler.ts#L72)

#### Parameters

##### config?

[`MarkdownAssemblerConfig`](../interfaces/MarkdownAssemblerConfig.md)

#### Returns

`MarkdownAssembler`

#### Overrides

[`BaseAssembler`](BaseAssembler.md).[`constructor`](BaseAssembler.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/assembly/markdown-assembler.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/markdown-assembler.ts#L67)

Human-readable name of this assembler

#### Overrides

[`BaseAssembler`](BaseAssembler.md).[`name`](BaseAssembler.md#name)

## Methods

### assemble()

> **assemble**(`results`, `options?`): `Promise`\<[`AssembledContext`](../interfaces/AssembledContext.md)\>

Defined in: [rag/src/assembly/base-assembler.ts:118](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/base-assembler.ts#L118)

Assemble reranked results into formatted context.

Pipeline:
1. Validate input
2. Apply topK limit
3. Deduplicate similar chunks
4. Apply ordering strategy
5. Apply token budget
6. Build source attributions
7. Format output (delegated to subclass)

#### Parameters

##### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Reranked results from the reranking stage

##### options?

[`AssemblyOptions`](../interfaces/AssemblyOptions.md)

Assembly options (can override config)

#### Returns

`Promise`\<[`AssembledContext`](../interfaces/AssembledContext.md)\>

Assembled context with formatted string and metadata

#### Inherited from

[`BaseAssembler`](BaseAssembler.md).[`assemble`](BaseAssembler.md#assemble)
