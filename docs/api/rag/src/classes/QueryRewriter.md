[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryRewriter

# Class: QueryRewriter

Defined in: [rag/src/query-enhancement/query-rewriter.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/query-rewriter.ts#L95)

Query Rewriter using LLM.

Transforms queries to improve retrieval by fixing errors
and clarifying intent. This is the simplest enhancement
strategy - one query in, one query out.

Cost: ~100-200 tokens per query (system + user + response)
Latency: ~200-500ms depending on LLM

## Example

```typescript
import { OpenAIProvider } from '@contextai/provider-openai';

const rewriter = new QueryRewriter({
  llmProvider: new OpenAIProvider({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  temperature: 0.2,  // Conservative rewrites
});

// Fix typos
const result = await rewriter.enhance('hw to cnfigure nginx');
console.log(result.enhanced[0]); // 'How to configure nginx'

// Clarify intent
const result2 = await rewriter.enhance('js date');
console.log(result2.enhanced[0]); // 'JavaScript date handling'
```

## Extends

- [`BaseQueryEnhancer`](BaseQueryEnhancer.md)

## Constructors

### Constructor

> **new QueryRewriter**(`config`): `QueryRewriter`

Defined in: [rag/src/query-enhancement/query-rewriter.ts:104](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/query-rewriter.ts#L104)

#### Parameters

##### config

[`QueryRewriterConfig`](../interfaces/QueryRewriterConfig.md)

#### Returns

`QueryRewriter`

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`constructor`](BaseQueryEnhancer.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/query-enhancement/query-rewriter.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/query-rewriter.ts#L96)

Human-readable name for this enhancer

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`name`](BaseQueryEnhancer.md#name)

***

### strategy

> `readonly` **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md) = `'rewrite'`

Defined in: [rag/src/query-enhancement/query-rewriter.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/query-rewriter.ts#L97)

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
