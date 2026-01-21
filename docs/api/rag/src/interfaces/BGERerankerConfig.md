[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BGERerankerConfig

# Interface: BGERerankerConfig

Defined in: [rag/src/reranker/types.ts:159](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L159)

Configuration for BGE cross-encoder reranker.

BGE (BAAI General Embedding) rerankers use cross-encoder architecture
to score query-document pairs jointly, providing more accurate relevance
scores than bi-encoder embeddings.

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/reranker/types.ts:161](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L161)

Name for this reranker instance (default: 'BGEReranker')

***

### modelName?

> `optional` **modelName**: `string`

Defined in: [rag/src/reranker/types.ts:171](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L171)

Model identifier for Transformers.js.
Default: 'Xenova/bge-reranker-base'

Available models (smallest to largest):
- 'Xenova/bge-reranker-base' (~110MB, good balance)
- 'Xenova/bge-reranker-large' (~330MB, best quality)

***

### normalizeScores?

> `optional` **normalizeScores**: `boolean`

Defined in: [rag/src/reranker/types.ts:178](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L178)

Whether to normalize scores to 0-1 range.
Cross-encoder outputs raw logits which can be negative.
Default: true

***

### maxLength?

> `optional` **maxLength**: `number`

Defined in: [rag/src/reranker/types.ts:185](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L185)

Maximum sequence length for the model.
Longer sequences are truncated.
Default: 512

***

### device?

> `optional` **device**: `"auto"` \| `"cpu"` \| `"gpu"`

Defined in: [rag/src/reranker/types.ts:193](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L193)

Device to run inference on.
- 'cpu' - Always use CPU (slower but universal)
- 'gpu' - Attempt GPU acceleration (may not be available)
- 'auto' - Automatically detect best option (default)
