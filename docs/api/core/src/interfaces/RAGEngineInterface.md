[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / RAGEngineInterface

# Interface: RAGEngineInterface

Defined in: [core/src/tools/retrieve-knowledge.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L44)

Interface for the RAG engine that this tool uses.

This is a minimal interface to avoid tight coupling with @contextai/rag.
Any object implementing this interface can be used.

## Methods

### search()

> **search**(`query`, `options?`): `Promise`\<\{ `content`: `string`; `estimatedTokens`: `number`; `sources`: `object`[]; `metadata`: \{ `effectiveQuery`: `string`; `retrievedCount`: `number`; `assembledCount`: `number`; `fromCache`: `boolean`; `timings`: \{ `totalMs`: `number`; \}; \}; \}\>

Defined in: [core/src/tools/retrieve-knowledge.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L52)

Search the knowledge base for relevant information.

#### Parameters

##### query

`string`

The search query

##### options?

Search options

###### topK?

`number`

###### enhance?

`boolean`

###### rerank?

`boolean`

###### signal?

`AbortSignal`

#### Returns

`Promise`\<\{ `content`: `string`; `estimatedTokens`: `number`; `sources`: `object`[]; `metadata`: \{ `effectiveQuery`: `string`; `retrievedCount`: `number`; `assembledCount`: `number`; `fromCache`: `boolean`; `timings`: \{ `totalMs`: `number`; \}; \}; \}\>

Assembled context with sources
