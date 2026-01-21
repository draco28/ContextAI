[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DeduplicationConfig

# Interface: DeduplicationConfig

Defined in: [rag/src/assembly/types.ts:102](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L102)

Configuration for chunk deduplication.

Removes near-duplicate chunks to maximize information density.

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [rag/src/assembly/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L107)

Enable deduplication.
Default: true

***

### similarityThreshold?

> `optional` **similarityThreshold**: `number`

Defined in: [rag/src/assembly/types.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L115)

Similarity threshold for considering chunks as duplicates.
Uses Jaccard similarity on word sets.
0.0 = never dedupe, 1.0 = only exact matches
Default: 0.8

***

### keepHighestScore?

> `optional` **keepHighestScore**: `boolean`

Defined in: [rag/src/assembly/types.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L122)

When duplicates found, keep the one with higher score.
If false, keeps the first encountered.
Default: true
