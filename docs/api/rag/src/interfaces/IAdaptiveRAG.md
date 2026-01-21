[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / IAdaptiveRAG

# Interface: IAdaptiveRAG

Defined in: [rag/src/adaptive/types.ts:376](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L376)

Interface for adaptive RAG engines.

Wraps a standard RAGEngine and classifies queries to
optimize the pipeline configuration automatically.

## Example

```typescript
const adaptiveRag = new AdaptiveRAG({
  engine: ragEngine,
});

// Greetings skip retrieval
const r1 = await adaptiveRag.search('Hello!');
// r1.skippedRetrieval: true

// Complex queries get full pipeline
const r2 = await adaptiveRag.search('Compare these authentication methods');
// r2.classification.type: 'complex'
// (full pipeline with enhancement)
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/adaptive/types.ts:378](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L378)

Human-readable name of this adaptive engine

***

### engine

> `readonly` **engine**: [`RAGEngine`](RAGEngine.md)

Defined in: [rag/src/adaptive/types.ts:381](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L381)

The underlying RAG engine

***

### classifier

> `readonly` **classifier**: [`IQueryClassifier`](IQueryClassifier.md)

Defined in: [rag/src/adaptive/types.ts:384](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L384)

The query classifier used

## Methods

### search()

> **search**(`query`, `options?`): `Promise`\<[`AdaptiveRAGResult`](AdaptiveRAGResult.md)\>

Defined in: [rag/src/adaptive/types.ts:396](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L396)

Search with adaptive query classification.

Classifies the query, then configures and executes
the RAG pipeline accordingly.

#### Parameters

##### query

`string`

The search query

##### options?

[`AdaptiveSearchOptions`](AdaptiveSearchOptions.md)

Adaptive search options

#### Returns

`Promise`\<[`AdaptiveRAGResult`](AdaptiveRAGResult.md)\>

Extended RAG result with classification info

***

### classifyOnly()

> **classifyOnly**(`query`): [`ClassificationResult`](ClassificationResult.md)

Defined in: [rag/src/adaptive/types.ts:405](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L405)

Classify a query without executing search.
Useful for previewing classification before deciding to search.

#### Parameters

##### query

`string`

The query to classify

#### Returns

[`ClassificationResult`](ClassificationResult.md)

Classification result
