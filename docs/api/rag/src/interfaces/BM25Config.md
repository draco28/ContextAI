[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BM25Config

# Interface: BM25Config

Defined in: [rag/src/retrieval/types.ts:146](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L146)

Configuration for BM25 sparse retriever.

BM25 (Best Matching 25) is a bag-of-words retrieval function that
ranks documents based on query term frequency and document length.

## Properties

### k1?

> `optional` **k1**: `number`

Defined in: [rag/src/retrieval/types.ts:153](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L153)

Term frequency saturation parameter.
Controls how much a term's frequency contributes to the score.
Higher values give more weight to term frequency.
Default: 1.2 (standard value)

***

### b?

> `optional` **b**: `number`

Defined in: [rag/src/retrieval/types.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L162)

Document length normalization parameter.
Controls how much document length affects scoring.
- 0 = no length normalization
- 1 = full length normalization
Default: 0.75 (standard value)

***

### tokenizer()?

> `optional` **tokenizer**: (`text`) => `string`[]

Defined in: [rag/src/retrieval/types.ts:168](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L168)

Custom tokenizer function.
If not provided, uses default whitespace + punctuation tokenizer.

#### Parameters

##### text

`string`

#### Returns

`string`[]

***

### minDocFreq?

> `optional` **minDocFreq**: `number`

Defined in: [rag/src/retrieval/types.ts:175](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L175)

Minimum document frequency for a term to be included.
Terms appearing in fewer documents are ignored.
Default: 1 (include all terms)

***

### maxDocFreqRatio?

> `optional` **maxDocFreqRatio**: `number`

Defined in: [rag/src/retrieval/types.ts:183](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/types.ts#L183)

Maximum document frequency ratio for a term (0-1).
Terms appearing in more than this ratio of documents are ignored.
Useful for filtering common words.
Default: 1.0 (include all terms)
