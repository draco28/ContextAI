[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveRAG

# Class: AdaptiveRAG

Defined in: [rag/src/adaptive/adaptive-rag.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L65)

Adaptive RAG engine wrapper.

Automatically classifies queries and configures the underlying
RAG engine for optimal performance based on query type.

## Implements

- [`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md)

## Constructors

### Constructor

> **new AdaptiveRAG**(`config`): `AdaptiveRAG`

Defined in: [rag/src/adaptive/adaptive-rag.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L73)

#### Parameters

##### config

[`AdaptiveRAGConfig`](../interfaces/AdaptiveRAGConfig.md)

#### Returns

`AdaptiveRAG`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/adaptive/adaptive-rag.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L66)

Human-readable name of this adaptive engine

#### Implementation of

[`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md).[`name`](../interfaces/IAdaptiveRAG.md#name)

***

### engine

> `readonly` **engine**: [`RAGEngine`](../interfaces/RAGEngine.md)

Defined in: [rag/src/adaptive/adaptive-rag.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L67)

The underlying RAG engine

#### Implementation of

[`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md).[`engine`](../interfaces/IAdaptiveRAG.md#engine)

***

### classifier

> `readonly` **classifier**: [`IQueryClassifier`](../interfaces/IQueryClassifier.md)

Defined in: [rag/src/adaptive/adaptive-rag.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L68)

The query classifier used

#### Implementation of

[`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md).[`classifier`](../interfaces/IAdaptiveRAG.md#classifier)

## Methods

### search()

> **search**(`query`, `options?`): `Promise`\<[`AdaptiveRAGResult`](../interfaces/AdaptiveRAGResult.md)\>

Defined in: [rag/src/adaptive/adaptive-rag.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L96)

Search with adaptive query classification.

#### Parameters

##### query

`string`

##### options?

[`AdaptiveSearchOptions`](../interfaces/AdaptiveSearchOptions.md)

#### Returns

`Promise`\<[`AdaptiveRAGResult`](../interfaces/AdaptiveRAGResult.md)\>

#### Implementation of

[`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md).[`search`](../interfaces/IAdaptiveRAG.md#search)

***

### classifyOnly()

> **classifyOnly**(`query`): [`ClassificationResult`](../interfaces/ClassificationResult.md)

Defined in: [rag/src/adaptive/adaptive-rag.ts:165](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/adaptive-rag.ts#L165)

Classify a query without executing search.

#### Parameters

##### query

`string`

#### Returns

[`ClassificationResult`](../interfaces/ClassificationResult.md)

#### Implementation of

[`IAdaptiveRAG`](../interfaces/IAdaptiveRAG.md).[`classifyOnly`](../interfaces/IAdaptiveRAG.md#classifyonly)
