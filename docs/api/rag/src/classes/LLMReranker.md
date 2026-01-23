[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LLMReranker

# Class: LLMReranker

Defined in: [rag/src/reranker/llm-reranker.ts:106](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/llm-reranker.ts#L106)

LLM-based Reranker.

Scores each document's relevance using an LLM, providing the most
accurate (but also most expensive) reranking approach.

Supports two modes:
1. **Individual scoring** (default): Each document scored separately
   - More accurate, especially for nuanced relevance
   - Higher latency and cost

2. **Batch scoring**: All documents scored in one prompt
   - More efficient for many documents
   - May lose accuracy for large batches

## Example

```typescript
import { OpenAIProvider } from '@contextaisdk/provider-openai';

const reranker = new LLMReranker({
  llmProvider: new OpenAIProvider({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  temperature: 0,  // Deterministic scoring
});

// Score with controlled concurrency
const reranked = await reranker.rerank(query, results, {
  topK: 5,
  concurrency: 3,
});

// Check cost breakdown
console.log(`Scored ${results.length} documents`);
reranked.forEach(r => {
  console.log(`Score: ${r.scores.rerankerScore.toFixed(1)}/10 - ${r.chunk.content.slice(0, 50)}...`);
});
```

## Extends

- [`BaseReranker`](BaseReranker.md)

## Constructors

### Constructor

> **new LLMReranker**(`config`): `LLMReranker`

Defined in: [rag/src/reranker/llm-reranker.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/llm-reranker.ts#L119)

#### Parameters

##### config

[`LLMRerankerConfig`](../interfaces/LLMRerankerConfig.md) & `object`

#### Returns

`LLMReranker`

#### Overrides

[`BaseReranker`](BaseReranker.md).[`constructor`](BaseReranker.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/reranker/llm-reranker.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/llm-reranker.ts#L107)

Human-readable name of this reranker

#### Overrides

[`BaseReranker`](BaseReranker.md).[`name`](BaseReranker.md#name)

## Methods

### rerank()

> **rerank**(`query`, `results`, `options?`): `Promise`\<[`RerankerResult`](../interfaces/RerankerResult.md)[]\>

Defined in: [rag/src/reranker/base-reranker.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L81)

Public rerank method with validation and transformation.

Uses arrow function to preserve `this` binding when passed as callback.

#### Parameters

##### query

`string`

##### results

[`RetrievalResult`](../interfaces/RetrievalResult.md)[]

##### options?

[`RerankerOptions`](../interfaces/RerankerOptions.md)

#### Returns

`Promise`\<[`RerankerResult`](../interfaces/RerankerResult.md)[]\>

#### Inherited from

[`BaseReranker`](BaseReranker.md).[`rerank`](BaseReranker.md#rerank)
