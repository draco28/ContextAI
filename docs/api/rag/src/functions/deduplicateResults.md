[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / deduplicateResults

# Function: deduplicateResults()

> **deduplicateResults**(`results`, `config?`): [`DeduplicationResult`](../interfaces/DeduplicationResult.md)

Defined in: [rag/src/assembly/deduplication.ts:136](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L136)

Remove near-duplicate chunks from results.

Uses greedy approach: iterate through results in order,
keep each result only if it's not too similar to any kept result.

## Parameters

### results

[`RerankerResult`](../interfaces/RerankerResult.md)[]

Results to deduplicate (in relevance order)

### config?

[`DeduplicationConfig`](../interfaces/DeduplicationConfig.md)

Deduplication configuration

## Returns

[`DeduplicationResult`](../interfaces/DeduplicationResult.md)

Deduplication result with unique and removed items

## Example

```typescript
const result = deduplicateResults(results, {
  similarityThreshold: 0.8,
  keepHighestScore: true,
});
console.log(`Removed ${result.duplicates.length} duplicates`);
```
