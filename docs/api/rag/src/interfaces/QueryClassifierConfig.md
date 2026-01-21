[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryClassifierConfig

# Interface: QueryClassifierConfig

Defined in: [rag/src/adaptive/types.ts:171](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L171)

Configuration for QueryClassifier.

## Properties

### thresholds?

> `optional` **thresholds**: `Partial`\<[`ClassificationThresholds`](ClassificationThresholds.md)\>

Defined in: [rag/src/adaptive/types.ts:176](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L176)

Custom classification thresholds.
If not provided, sensible defaults are used.

***

### additionalGreetings?

> `optional` **additionalGreetings**: `string`[]

Defined in: [rag/src/adaptive/types.ts:182](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L182)

Additional greeting patterns to recognize.
These are added to the default list.

***

### additionalComplexKeywords?

> `optional` **additionalComplexKeywords**: `string`[]

Defined in: [rag/src/adaptive/types.ts:188](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L188)

Additional complex keywords to recognize.
These are added to the default list.

***

### name?

> `optional` **name**: `string`

Defined in: [rag/src/adaptive/types.ts:193](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L193)

Custom name for this classifier instance.
