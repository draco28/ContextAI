[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / XMLAssembler

# Class: XMLAssembler

Defined in: [rag/src/assembly/xml-assembler.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/xml-assembler.ts#L70)

Assembler that outputs XML-formatted context.

## Example

```typescript
const assembler = new XMLAssembler({
  ordering: 'sandwich',
  tokenBudget: { maxTokens: 4000 },
  includeScores: true,
});

const result = await assembler.assemble(rerankedResults);
// <sources>
//   <source id="1" file="auth.md" score="0.95">...</source>
// </sources>
```

## Extends

- [`BaseAssembler`](BaseAssembler.md)

## Constructors

### Constructor

> **new XMLAssembler**(`config?`): `XMLAssembler`

Defined in: [rag/src/assembly/xml-assembler.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/xml-assembler.ts#L76)

#### Parameters

##### config?

[`XMLAssemblerConfig`](../interfaces/XMLAssemblerConfig.md)

#### Returns

`XMLAssembler`

#### Overrides

[`BaseAssembler`](BaseAssembler.md).[`constructor`](BaseAssembler.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/assembly/xml-assembler.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/xml-assembler.ts#L71)

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
