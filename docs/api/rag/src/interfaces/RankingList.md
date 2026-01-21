[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RankingList

# Interface: RankingList

Defined in: [rag/src/retrieval/rrf.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L37)

A single ranking list with its source name.

## Properties

### name

> **name**: `string`

Defined in: [rag/src/retrieval/rrf.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L39)

Name of this ranker (e.g., "dense", "sparse")

***

### items

> **items**: [`RankedItem`](RankedItem.md)[]

Defined in: [rag/src/retrieval/rrf.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/rrf.ts#L41)

Ranked items from this ranker
