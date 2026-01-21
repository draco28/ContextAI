[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseReranker

# Abstract Class: BaseReranker

Defined in: [rag/src/reranker/base-reranker.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L66)

Abstract base class for rerankers.

Subclasses must implement:
- `_rerank()`: Core reranking logic

The base class provides:
- Input validation
- Score normalization (optional)
- Result transformation with rank tracking
- Filtering by topK and minScore

## Example

```typescript
class MyReranker extends BaseReranker {
  readonly name = 'MyReranker';

  protected _rerank = async (
    query: string,
    results: RetrievalResult[]
  ): Promise<InternalRerankerResult[]> => {
    // Implement custom reranking logic
    return results.map((r, i) => ({
      id: r.id,
      score: computeScore(query, r),
      original: r,
    }));
  };
}
```

## Extended by

- [`BGEReranker`](BGEReranker.md)
- [`MMRReranker`](MMRReranker.md)
- [`LLMReranker`](LLMReranker.md)

## Implements

- [`Reranker`](../interfaces/Reranker.md)

## Constructors

### Constructor

> **new BaseReranker**(): `BaseReranker`

#### Returns

`BaseReranker`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/reranker/base-reranker.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/base-reranker.ts#L68)

Human-readable name of this reranker

#### Implementation of

[`Reranker`](../interfaces/Reranker.md).[`name`](../interfaces/Reranker.md#name)

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

#### Implementation of

[`Reranker`](../interfaces/Reranker.md).[`rerank`](../interfaces/Reranker.md#rerank)
