[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MultiQueryExpander

# Class: MultiQueryExpander

Defined in: [rag/src/query-enhancement/multi-query-expander.ts:121](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/multi-query-expander.ts#L121)

Multi-Query Expander using LLM.

Generates multiple query variants from different perspectives
to improve retrieval coverage. Use when you want to cast a
wider net and retrieve more diverse documents.

Cost: ~200-400 tokens total (one call generates all variants)
Latency: ~300-600ms depending on LLM

Note: Using multi-query means multiple retrieval calls,
so consider the cost/latency tradeoff.

## Example

```typescript
import { OpenAIProvider } from '@contextai/provider-openai';

const expander = new MultiQueryExpander({
  llmProvider: new OpenAIProvider({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  numVariants: 4,
  temperature: 0.6,  // Slightly more creative variants
});

const result = await expander.enhance('react hooks best practices');

// Retrieve with each variant
const allResults = [];
for (const variant of result.enhanced) {
  const docs = await retriever.retrieve(variant);
  allResults.push(...docs);
}

// Deduplicate and rerank
const unique = deduplicateByContent(allResults);
const reranked = await reranker.rerank(originalQuery, unique);
```

## Extends

- [`BaseQueryEnhancer`](BaseQueryEnhancer.md)

## Constructors

### Constructor

> **new MultiQueryExpander**(`config`): `MultiQueryExpander`

Defined in: [rag/src/query-enhancement/multi-query-expander.ts:131](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/multi-query-expander.ts#L131)

#### Parameters

##### config

[`MultiQueryConfig`](../interfaces/MultiQueryConfig.md)

#### Returns

`MultiQueryExpander`

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`constructor`](BaseQueryEnhancer.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/query-enhancement/multi-query-expander.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/multi-query-expander.ts#L122)

Human-readable name for this enhancer

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`name`](BaseQueryEnhancer.md#name)

***

### strategy

> `readonly` **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md) = `'multi-query'`

Defined in: [rag/src/query-enhancement/multi-query-expander.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/multi-query-expander.ts#L123)

Strategy type this enhancer implements

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`strategy`](BaseQueryEnhancer.md#strategy)

## Methods

### enhance()

> **enhance**(`query`, `options?`): `Promise`\<[`EnhancementResult`](../interfaces/EnhancementResult.md)\>

Defined in: [rag/src/query-enhancement/base-enhancer.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/base-enhancer.ts#L73)

Enhance a query for better retrieval.

This is the public API. It:
1. Validates input
2. Checks minimum length
3. Calls subclass implementation
4. Measures timing
5. Adds metadata

#### Parameters

##### query

`string`

The user's original query

##### options?

[`EnhanceOptions`](../interfaces/EnhanceOptions.md)

Enhancement options

#### Returns

`Promise`\<[`EnhancementResult`](../interfaces/EnhancementResult.md)\>

Enhanced queries with metadata

#### Inherited from

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`enhance`](BaseQueryEnhancer.md#enhance)
