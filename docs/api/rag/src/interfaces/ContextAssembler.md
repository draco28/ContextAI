[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ContextAssembler

# Interface: ContextAssembler

Defined in: [rag/src/assembly/types.ts:334](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L334)

Interface for all context assemblers.

Context assemblers take reranked results and format them
into a string suitable for LLM consumption.

## Example

```typescript
const assembler: ContextAssembler = new XMLAssembler({
  ordering: 'sandwich',
  tokenBudget: { maxTokens: 4000 },
});

const assembled = await assembler.assemble(rerankedResults, {
  topK: 10,
  preamble: 'Use the following sources to answer:',
});

console.log(assembled.content);
// <sources>
//   <source id="1" file="docs/auth.md">...</source>
//   ...
// </sources>
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/assembly/types.ts:336](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L336)

Human-readable name of this assembler

## Methods

### assemble()

> **assemble**(`results`, `options?`): `Promise`\<[`AssembledContext`](AssembledContext.md)\>

Defined in: [rag/src/assembly/types.ts:345](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L345)

Assemble reranked results into formatted context.

#### Parameters

##### results

[`RerankerResult`](RerankerResult.md)[]

Reranked results from the reranking stage

##### options?

[`AssemblyOptions`](AssemblyOptions.md)

Assembly options (can override config)

#### Returns

`Promise`\<[`AssembledContext`](AssembledContext.md)\>

Assembled context with formatted string and metadata
