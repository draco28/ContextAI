[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseAssembler

# Abstract Class: BaseAssembler

Defined in: [rag/src/assembly/base-assembler.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/base-assembler.ts#L75)

Abstract base class for context assemblers.

Implements the Template Method pattern:
- Public `assemble()` handles orchestration (validation, ordering, dedup, budget)
- Protected `_format()` is implemented by subclasses for specific output formats

## Example

```typescript
class CustomAssembler extends BaseAssembler {
  readonly name = 'CustomAssembler';

  protected _format(chunks, sources, options) {
    return chunks.map(c => c.content).join('\n\n');
  }
}
```

## Extended by

- [`XMLAssembler`](XMLAssembler.md)
- [`MarkdownAssembler`](MarkdownAssembler.md)

## Implements

- [`ContextAssembler`](../interfaces/ContextAssembler.md)

## Constructors

### Constructor

> **new BaseAssembler**(`config?`): `BaseAssembler`

Defined in: [rag/src/assembly/base-assembler.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/base-assembler.ts#L87)

#### Parameters

##### config?

[`AssemblerConfig`](../interfaces/AssemblerConfig.md)

#### Returns

`BaseAssembler`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/assembly/base-assembler.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/base-assembler.ts#L77)

Human-readable name of this assembler

#### Implementation of

[`ContextAssembler`](../interfaces/ContextAssembler.md).[`name`](../interfaces/ContextAssembler.md#name)

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

#### Implementation of

[`ContextAssembler`](../interfaces/ContextAssembler.md).[`assemble`](../interfaces/ContextAssembler.md#assemble)
