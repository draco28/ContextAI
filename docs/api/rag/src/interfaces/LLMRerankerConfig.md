[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LLMRerankerConfig

# Interface: LLMRerankerConfig

Defined in: [rag/src/reranker/types.ts:235](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L235)

Configuration for LLM-based reranker.

Uses an LLM to score relevance of documents to a query.
Most accurate but also most expensive option.

## Properties

### name?

> `optional` **name**: `string`

Defined in: [rag/src/reranker/types.ts:237](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L237)

Name for this reranker instance (default: 'LLMReranker')

***

### promptTemplate?

> `optional` **promptTemplate**: `string`

Defined in: [rag/src/reranker/types.ts:245](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L245)

Prompt template for scoring.
Available placeholders: {query}, {document}

Default prompt asks for 0-10 relevance score.

***

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: [rag/src/reranker/types.ts:251](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L251)

System prompt for the LLM.
Default: instructs to act as a relevance judge.

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [rag/src/reranker/types.ts:258](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L258)

Temperature for LLM responses.
Lower = more deterministic scores.
Default: 0 (deterministic)

***

### defaultConcurrency?

> `optional` **defaultConcurrency**: `number`

Defined in: [rag/src/reranker/types.ts:264](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/types.ts#L264)

Default concurrency limit.
Default: 5
