[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryFeatures

# Interface: QueryFeatures

Defined in: [rag/src/adaptive/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L39)

Features extracted from a query for classification.

These signals are computed without any LLM calls using
heuristic rules (regex, word lists, patterns).

## Properties

### wordCount

> **wordCount**: `number`

Defined in: [rag/src/adaptive/types.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L41)

Number of words in the query

***

### charCount

> **charCount**: `number`

Defined in: [rag/src/adaptive/types.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L44)

Number of characters in the query

***

### hasQuestionWords

> **hasQuestionWords**: `boolean`

Defined in: [rag/src/adaptive/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L47)

Whether the query contains question words (what, who, etc.)

***

### questionWords

> **questionWords**: `string`[]

Defined in: [rag/src/adaptive/types.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L50)

The detected question words, if any

***

### isGreeting

> **isGreeting**: `boolean`

Defined in: [rag/src/adaptive/types.ts:53](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L53)

Whether the query is a greeting pattern

***

### hasPronouns

> **hasPronouns**: `boolean`

Defined in: [rag/src/adaptive/types.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L56)

Whether the query contains pronouns (it, that, this)

***

### pronouns

> **pronouns**: `string`[]

Defined in: [rag/src/adaptive/types.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L59)

The pronouns found, if any

***

### hasComplexKeywords

> **hasComplexKeywords**: `boolean`

Defined in: [rag/src/adaptive/types.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L62)

Whether the query contains analytical/complex keywords

***

### complexKeywords

> **complexKeywords**: `string`[]

Defined in: [rag/src/adaptive/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L65)

Complex keywords found (compare, analyze, explain why)

***

### hasFollowUpPattern

> **hasFollowUpPattern**: `boolean`

Defined in: [rag/src/adaptive/types.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L68)

Whether the query contains follow-up patterns

***

### endsWithQuestion

> **endsWithQuestion**: `boolean`

Defined in: [rag/src/adaptive/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L71)

Whether the query ends with a question mark

***

### potentialEntityCount

> **potentialEntityCount**: `number`

Defined in: [rag/src/adaptive/types.ts:74](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/types.ts#L74)

Number of distinct entity-like tokens (capitalized words)
