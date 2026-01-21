[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGEngine

# Interface: RAGEngine

Defined in: [rag/src/engine/types.ts:290](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L290)

High-level RAG orchestrator interface.

The RAGEngine coordinates the full RAG pipeline and provides
a simple search() API. This is the primary interface for
integrating RAG into agents and tools.

## Example

```typescript
const engine: RAGEngine = new RAGEngineImpl({
  retriever: new HybridRetriever({ ... }),
  assembler: new XMLAssembler({ ... }),
});

const result = await engine.search('How do I reset my password?');
console.log(result.content); // Formatted context for LLM
console.log(result.sources); // For citations
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/engine/types.ts:292](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L292)

Human-readable name of this engine

## Methods

### search()

> **search**(`query`, `options?`): `Promise`\<[`RAGResult`](RAGResult.md)\>

Defined in: [rag/src/engine/types.ts:303](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L303)

Search the knowledge base for relevant information.

Orchestrates: enhance → retrieve → rerank → assemble

#### Parameters

##### query

`string`

The search query (natural language)

##### options?

[`RAGSearchOptions`](RAGSearchOptions.md)

Search options (topK, filters, etc.)

#### Returns

`Promise`\<[`RAGResult`](RAGResult.md)\>

Assembled context with metadata

***

### clearCache()

> **clearCache**(): `Promise`\<`void`\>

Defined in: [rag/src/engine/types.ts:308](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/types.ts#L308)

Clear the result cache (if cache is configured).

#### Returns

`Promise`\<`void`\>
