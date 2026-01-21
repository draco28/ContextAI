[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / orderChronologically

# Function: orderChronologically()

> **orderChronologically**(`results`): [`RerankerResult`](../interfaces/RerankerResult.md)[]

Defined in: [rag/src/assembly/ordering.ts:128](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L128)

Order chronologically by document position.

Uses chunk metadata to determine original document order:
1. Sort by documentId (group chunks from same document)
2. Then by startIndex within each document

Falls back to relevance order if metadata is missing.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

## Returns

[`RerankerResult`](../interfaces/RerankerResult.md)[]
