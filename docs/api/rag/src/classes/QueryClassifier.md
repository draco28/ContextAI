[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryClassifier

# Class: QueryClassifier

Defined in: [rag/src/adaptive/query-classifier.ts:232](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/query-classifier.ts#L232)

Heuristic-based query classifier.

Analyzes query text using pattern matching, word counts,
and keyword detection to classify into one of four types.
No LLM calls are made - classification is instant.

## Implements

- [`IQueryClassifier`](../interfaces/IQueryClassifier.md)

## Constructors

### Constructor

> **new QueryClassifier**(`config`): `QueryClassifier`

Defined in: [rag/src/adaptive/query-classifier.ts:239](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/query-classifier.ts#L239)

#### Parameters

##### config

[`QueryClassifierConfig`](../interfaces/QueryClassifierConfig.md) = `{}`

#### Returns

`QueryClassifier`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/adaptive/query-classifier.ts:233](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/query-classifier.ts#L233)

Human-readable name of this classifier

#### Implementation of

[`IQueryClassifier`](../interfaces/IQueryClassifier.md).[`name`](../interfaces/IQueryClassifier.md#name)

## Methods

### classify()

> **classify**(`query`): [`ClassificationResult`](../interfaces/ClassificationResult.md)

Defined in: [rag/src/adaptive/query-classifier.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/query-classifier.ts#L264)

Classify a query into a type.

#### Parameters

##### query

`string`

#### Returns

[`ClassificationResult`](../interfaces/ClassificationResult.md)

#### Implementation of

[`IQueryClassifier`](../interfaces/IQueryClassifier.md).[`classify`](../interfaces/IQueryClassifier.md#classify)

***

### extractFeatures()

> **extractFeatures**(`query`): [`QueryFeatures`](../interfaces/QueryFeatures.md)

Defined in: [rag/src/adaptive/query-classifier.ts:280](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/query-classifier.ts#L280)

Extract features from a query without classifying.

#### Parameters

##### query

`string`

#### Returns

[`QueryFeatures`](../interfaces/QueryFeatures.md)

#### Implementation of

[`IQueryClassifier`](../interfaces/IQueryClassifier.md).[`extractFeatures`](../interfaces/IQueryClassifier.md#extractfeatures)
