[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / OrderingAnalysis

# Interface: OrderingAnalysis

Defined in: [rag/src/assembly/ordering.ts:200](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L200)

Analysis of chunk ordering.

## Properties

### totalCount

> **totalCount**: `number`

Defined in: [rag/src/assembly/ordering.ts:202](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L202)

Total number of chunks

***

### averageScore

> **averageScore**: `number`

Defined in: [rag/src/assembly/ordering.ts:204](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L204)

Average relevance score across all chunks

***

### scoreDistribution

> **scoreDistribution**: `object`

Defined in: [rag/src/assembly/ordering.ts:206](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L206)

Average scores by position (start/middle/end thirds)

#### start

> **start**: `number`

#### middle

> **middle**: `number`

#### end

> **end**: `number`

***

### highAttentionScoreSum

> **highAttentionScoreSum**: `number`

Defined in: [rag/src/assembly/ordering.ts:212](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L212)

Sum of scores in high-attention zones (start + end)

***

### middleScoreSum

> **middleScoreSum**: `number`

Defined in: [rag/src/assembly/ordering.ts:214](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/ordering.ts#L214)

Sum of scores in low-attention zone (middle)
