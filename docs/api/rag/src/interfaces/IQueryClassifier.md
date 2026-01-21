[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / IQueryClassifier

# Interface: IQueryClassifier

Defined in: [rag/src/adaptive/types.ts:328](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L328)

Interface for query classifiers.

Query classifiers analyze incoming queries and determine
their type using heuristic rules. No LLM calls are made.

## Example

```typescript
const classifier = new QueryClassifier();

const result = classifier.classify('Hello there!');
// result.type: 'simple'
// result.confidence: 0.95
// result.recommendation.skipRetrieval: true

const result2 = classifier.classify('Compare React and Vue for large apps');
// result2.type: 'complex'
// result2.recommendation.enableEnhancement: true
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/adaptive/types.ts:330](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L330)

Human-readable name of this classifier

## Methods

### classify()

> **classify**(`query`): [`ClassificationResult`](ClassificationResult.md)

Defined in: [rag/src/adaptive/types.ts:338](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L338)

Classify a query into a type.

#### Parameters

##### query

`string`

The user's query string

#### Returns

[`ClassificationResult`](ClassificationResult.md)

Classification result with type, confidence, and recommendations

***

### extractFeatures()

> **extractFeatures**(`query`): [`QueryFeatures`](QueryFeatures.md)

Defined in: [rag/src/adaptive/types.ts:347](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L347)

Extract features from a query without classifying.
Useful for debugging or custom classification logic.

#### Parameters

##### query

`string`

The user's query string

#### Returns

[`QueryFeatures`](QueryFeatures.md)

Extracted features
