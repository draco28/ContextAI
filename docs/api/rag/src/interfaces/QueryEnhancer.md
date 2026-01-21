[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryEnhancer

# Interface: QueryEnhancer

Defined in: [rag/src/query-enhancement/types.ts:137](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L137)

Interface for all query enhancers.

Query enhancers transform user queries before retrieval
to improve search quality. All enhancers follow the same
interface but implement different strategies.

## Example

```typescript
const rewriter = new QueryRewriter({
  llmProvider: new OpenAIProvider({ model: 'gpt-4o-mini' }),
});

const result = await rewriter.enhance('hw do i reset pasword?');
// result.enhanced: ['How do I reset my password?']
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/query-enhancement/types.ts:139](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L139)

Human-readable name of this enhancer

***

### strategy

> `readonly` **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md)

Defined in: [rag/src/query-enhancement/types.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L141)

Strategy type this enhancer implements

## Methods

### enhance()

> **enhance**(`query`, `options?`): `Promise`\<[`EnhancementResult`](EnhancementResult.md)\>

Defined in: [rag/src/query-enhancement/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L150)

Enhance a query for better retrieval.

#### Parameters

##### query

`string`

The user's original query

##### options?

[`EnhanceOptions`](EnhanceOptions.md)

Enhancement options

#### Returns

`Promise`\<[`EnhancementResult`](EnhancementResult.md)\>

Enhanced queries with metadata
