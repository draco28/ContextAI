[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseQueryEnhancer

# Abstract Class: BaseQueryEnhancer

Defined in: [rag/src/query-enhancement/base-enhancer.ts:53](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/base-enhancer.ts#L53)

Abstract base class for query enhancers.

Subclasses must implement:
- `_enhance()`: Core enhancement logic
- `name`: Human-readable name
- `strategy`: Enhancement strategy type

## Example

```typescript
class MyEnhancer extends BaseQueryEnhancer {
  readonly name = 'MyEnhancer';
  readonly strategy: EnhancementStrategy = 'rewrite';

  protected _enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    // Implementation here
  };
}
```

## Extended by

- [`QueryRewriter`](QueryRewriter.md)
- [`HyDEEnhancer`](HyDEEnhancer.md)
- [`MultiQueryExpander`](MultiQueryExpander.md)

## Implements

- [`QueryEnhancer`](../interfaces/QueryEnhancer.md)

## Constructors

### Constructor

> **new BaseQueryEnhancer**(): `BaseQueryEnhancer`

#### Returns

`BaseQueryEnhancer`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/query-enhancement/base-enhancer.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/base-enhancer.ts#L55)

Human-readable name for this enhancer

#### Implementation of

[`QueryEnhancer`](../interfaces/QueryEnhancer.md).[`name`](../interfaces/QueryEnhancer.md#name)

***

### strategy

> `abstract` `readonly` **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md)

Defined in: [rag/src/query-enhancement/base-enhancer.ts:57](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/base-enhancer.ts#L57)

Strategy type this enhancer implements

#### Implementation of

[`QueryEnhancer`](../interfaces/QueryEnhancer.md).[`strategy`](../interfaces/QueryEnhancer.md#strategy)

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

#### Implementation of

[`QueryEnhancer`](../interfaces/QueryEnhancer.md).[`enhance`](../interfaces/QueryEnhancer.md#enhance)
