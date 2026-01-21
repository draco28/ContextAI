[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGEngineImpl

# Class: RAGEngineImpl

Defined in: [rag/src/engine/rag-engine.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/rag-engine.ts#L85)

High-level RAG orchestrator implementation.

Coordinates the full RAG pipeline and provides a simple search() API.

## Example

```typescript
const engine = new RAGEngineImpl({
  retriever: new HybridRetriever({
    vectorStore,
    embeddingProvider,
    documents,
  }),
  assembler: new XMLAssembler({
    ordering: 'sandwich',
    tokenBudget: { maxTokens: 4000 },
  }),
  // Optional components
  enhancer: new QueryRewriter({ llmProvider }),
  reranker: new MMRReranker({ defaultLambda: 0.7 }),
});

const result = await engine.search('How do I reset my password?');
console.log(result.content); // Formatted context for LLM
```

## Implements

- [`RAGEngine`](../interfaces/RAGEngine.md)

## Constructors

### Constructor

> **new RAGEngineImpl**(`config`): `RAGEngineImpl`

Defined in: [rag/src/engine/rag-engine.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/rag-engine.ts#L95)

#### Parameters

##### config

[`RAGEngineConfig`](../interfaces/RAGEngineConfig.md)

#### Returns

`RAGEngineImpl`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/engine/rag-engine.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/rag-engine.ts#L86)

Human-readable name of this engine

#### Implementation of

[`RAGEngine`](../interfaces/RAGEngine.md).[`name`](../interfaces/RAGEngine.md#name)

## Methods

### search()

> **search**(`query`, `options`): `Promise`\<[`RAGResult`](../interfaces/RAGResult.md)\>

Defined in: [rag/src/engine/rag-engine.ts:134](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/rag-engine.ts#L134)

Search the knowledge base for relevant information.

Pipeline: enhance → retrieve → rerank → assemble

#### Parameters

##### query

`string`

##### options

[`RAGSearchOptions`](../interfaces/RAGSearchOptions.md) = `{}`

#### Returns

`Promise`\<[`RAGResult`](../interfaces/RAGResult.md)\>

#### Implementation of

[`RAGEngine`](../interfaces/RAGEngine.md).[`search`](../interfaces/RAGEngine.md#search)

***

### clearCache()

> **clearCache**(): `Promise`\<`void`\>

Defined in: [rag/src/engine/rag-engine.ts:384](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/rag-engine.ts#L384)

Clear the result cache.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`RAGEngine`](../interfaces/RAGEngine.md).[`clearCache`](../interfaces/RAGEngine.md#clearcache)
