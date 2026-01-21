[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ClassificationResult

# Interface: ClassificationResult

Defined in: [rag/src/adaptive/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L83)

Result of query classification.

Contains the determined type, confidence score, and the
raw features used to make the decision.

## Properties

### type

> **type**: [`QueryType`](../type-aliases/QueryType.md)

Defined in: [rag/src/adaptive/types.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L85)

The classified query type

***

### confidence

> **confidence**: `number`

Defined in: [rag/src/adaptive/types.ts:93](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L93)

Confidence score for this classification (0-1).

Higher values indicate stronger signal for this type.
Low confidence may indicate ambiguous queries.

***

### features

> **features**: [`QueryFeatures`](QueryFeatures.md)

Defined in: [rag/src/adaptive/types.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L96)

Raw features extracted from the query

***

### recommendation

> **recommendation**: [`PipelineRecommendation`](PipelineRecommendation.md)

Defined in: [rag/src/adaptive/types.ts:102](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L102)

Recommended pipeline configuration based on classification.
These are suggestions that can be overridden by the caller.
