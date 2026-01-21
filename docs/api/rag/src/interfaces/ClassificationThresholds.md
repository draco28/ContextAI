[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ClassificationThresholds

# Interface: ClassificationThresholds

Defined in: [rag/src/adaptive/types.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L142)

Thresholds for classifying queries into each type.

These control how aggressively queries are classified.
Higher thresholds = fewer queries match that type.

## Properties

### simpleMaxWords

> **simpleMaxWords**: `number`

Defined in: [rag/src/adaptive/types.ts:147](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L147)

Maximum word count for SIMPLE queries.
Default: 4 (e.g., "hello", "thanks", "hi there")

***

### complexMinWords

> **complexMinWords**: `number`

Defined in: [rag/src/adaptive/types.ts:153](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L153)

Minimum word count for COMPLEX queries.
Default: 15

***

### complexKeywordThreshold

> **complexKeywordThreshold**: `number`

Defined in: [rag/src/adaptive/types.ts:159](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L159)

Minimum complex keywords for COMPLEX classification.
Default: 1

***

### conversationalPronounThreshold

> **conversationalPronounThreshold**: `number`

Defined in: [rag/src/adaptive/types.ts:165](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L165)

Minimum pronouns for CONVERSATIONAL classification.
Default: 1 (at least one pronoun like "it", "that")
