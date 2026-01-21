[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / PositionBiasConfig

# Interface: PositionBiasConfig

Defined in: [rag/src/reranker/types.ts:286](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L286)

Configuration for position bias mitigation.

## Properties

### strategy

> **strategy**: [`PositionBiasStrategy`](../type-aliases/PositionBiasStrategy.md)

Defined in: [rag/src/reranker/types.ts:288](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L288)

Strategy to use (default: 'none')

***

### startCount?

> `optional` **startCount**: `number`

Defined in: [rag/src/reranker/types.ts:294](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L294)

For 'sandwich': how many top items to place at the start.
Remaining top items go at the end.
Default: half of topK
