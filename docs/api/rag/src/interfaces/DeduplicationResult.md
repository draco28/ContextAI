[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DeduplicationResult

# Interface: DeduplicationResult

Defined in: [rag/src/assembly/deduplication.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L96)

Result of deduplication operation.

## Properties

### unique

> **unique**: [`RerankerResult`](RerankerResult.md)[]

Defined in: [rag/src/assembly/deduplication.ts:98](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L98)

Results after removing duplicates

***

### duplicates

> **duplicates**: [`DuplicateInfo`](DuplicateInfo.md)[]

Defined in: [rag/src/assembly/deduplication.ts:100](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L100)

Results that were removed as duplicates

***

### comparisons

> **comparisons**: `number`

Defined in: [rag/src/assembly/deduplication.ts:102](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L102)

Number of comparisons made
