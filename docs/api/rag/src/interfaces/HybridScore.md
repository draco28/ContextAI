[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / HybridScore

# Interface: HybridScore

Defined in: [rag/src/retrieval/types.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L22)

Transparency scores showing contribution of each retrieval method.

This allows users to understand WHY a result was ranked highly:
- High dense, low sparse: semantically similar but different words
- Low dense, high sparse: exact keyword match but different meaning
- Both high: strong match on both dimensions

## Properties

### dense

> **dense**: `number`

Defined in: [rag/src/retrieval/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L24)

Score from dense (vector) retrieval (0-1, higher = more similar)

***

### sparse

> **sparse**: `number`

Defined in: [rag/src/retrieval/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L26)

Score from sparse (BM25) retrieval (normalized 0-1)

***

### fused

> **fused**: `number`

Defined in: [rag/src/retrieval/types.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L28)

Final fused score after RRF combination
