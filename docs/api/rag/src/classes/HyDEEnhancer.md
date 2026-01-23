[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HyDEEnhancer

# Class: HyDEEnhancer

Defined in: [rag/src/query-enhancement/hyde-enhancer.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/hyde-enhancer.ts#L122)

HyDE (Hypothetical Document Embeddings) Enhancer.

Generates hypothetical documents that answer the query,
which are then used for similarity-based retrieval.

This is more expensive than simple rewriting but can
dramatically improve retrieval for complex questions.

Cost: ~300-500 tokens per hypothetical doc
Latency: ~500-1000ms per doc + embedding time

## Example

```typescript
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { HuggingFaceEmbeddingProvider } from '@contextaisdk/rag';

const hyde = new HyDEEnhancer({
  llmProvider: new OpenAIProvider({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  }),
  embeddingProvider: new HuggingFaceEmbeddingProvider({
    modelName: 'Xenova/bge-base-en-v1.5',
  }),
  numHypothetical: 3,  // Generate 3 different perspectives
  temperature: 0.8,    // Higher diversity
});

const result = await hyde.enhance('How do I handle authentication errors?');

// Use the hypothetical docs for retrieval
// Instead of embedding the question, embed these docs
for (const hypotheticalQuery of result.enhanced) {
  const embedding = await embeddingProvider.embed(hypotheticalQuery);
  // ... search vector store with this embedding
}
```

## Extends

- [`BaseQueryEnhancer`](BaseQueryEnhancer.md)

## Constructors

### Constructor

> **new HyDEEnhancer**(`config`): `HyDEEnhancer`

Defined in: [rag/src/query-enhancement/hyde-enhancer.ts:133](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/hyde-enhancer.ts#L133)

#### Parameters

##### config

[`HyDEConfig`](../interfaces/HyDEConfig.md)

#### Returns

`HyDEEnhancer`

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`constructor`](BaseQueryEnhancer.md#constructor)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/query-enhancement/hyde-enhancer.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/hyde-enhancer.ts#L123)

Human-readable name for this enhancer

#### Overrides

[`BaseQueryEnhancer`](BaseQueryEnhancer.md).[`name`](BaseQueryEnhancer.md#name)

***

### strategy

> `readonly` **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md) = `'hyde'`

Defined in: [rag/src/query-enhancement/hyde-enhancer.ts:124](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/hyde-enhancer.ts#L124)

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
