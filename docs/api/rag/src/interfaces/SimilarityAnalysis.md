[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SimilarityAnalysis

# Interface: SimilarityAnalysis

Defined in: [rag/src/assembly/deduplication.ts:307](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L307)

Analysis of similarity patterns in results.

## Properties

### totalPairs

> **totalPairs**: `number`

Defined in: [rag/src/assembly/deduplication.ts:309](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L309)

Total number of pairs compared

***

### averageSimilarity

> **averageSimilarity**: `number`

Defined in: [rag/src/assembly/deduplication.ts:311](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L311)

Average similarity across all pairs

***

### maxSimilarity

> **maxSimilarity**: `number`

Defined in: [rag/src/assembly/deduplication.ts:313](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L313)

Maximum similarity found

***

### minSimilarity

> **minSimilarity**: `number`

Defined in: [rag/src/assembly/deduplication.ts:315](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L315)

Minimum similarity found

***

### pairsAbove50

> **pairsAbove50**: `number`

Defined in: [rag/src/assembly/deduplication.ts:317](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L317)

Pairs with similarity >= 0.5

***

### pairsAbove70

> **pairsAbove70**: `number`

Defined in: [rag/src/assembly/deduplication.ts:319](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L319)

Pairs with similarity >= 0.7

***

### pairsAbove90

> **pairsAbove90**: `number`

Defined in: [rag/src/assembly/deduplication.ts:321](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L321)

Pairs with similarity >= 0.9
