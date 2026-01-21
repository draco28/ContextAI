[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / jaccardSimilarity

# Function: jaccardSimilarity()

> **jaccardSimilarity**(`textA`, `textB`): `number`

Defined in: [rag/src/assembly/deduplication.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L47)

Calculate Jaccard similarity between two texts.

Jaccard similarity = |A ∩ B| / |A ∪ B|
Where A and B are sets of words.

Returns value between 0 (completely different) and 1 (identical).

## Parameters

### textA

`string`

First text

### textB

`string`

Second text

## Returns

`number`

Similarity score between 0 and 1

## Example

```typescript
jaccardSimilarity('hello world', 'hello world'); // 1.0
jaccardSimilarity('hello world', 'goodbye world'); // 0.33
jaccardSimilarity('hello', 'goodbye'); // 0.0
```
