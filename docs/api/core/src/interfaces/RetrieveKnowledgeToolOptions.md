[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / RetrieveKnowledgeToolOptions

# Interface: RetrieveKnowledgeToolOptions

Defined in: [core/src/tools/retrieve-knowledge.ts:82](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L82)

Options for configuring the retrieve_knowledge tool.

## Properties

### name?

> `optional` **name**: `string`

Defined in: [core/src/tools/retrieve-knowledge.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L87)

Custom tool name.
Default: 'retrieve_knowledge'

***

### description?

> `optional` **description**: `string`

Defined in: [core/src/tools/retrieve-knowledge.ts:94](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L94)

Custom tool description.
This is shown to the LLM to help it decide when to use the tool.
Default: A detailed description of when and how to use knowledge retrieval.

***

### defaultTopK?

> `optional` **defaultTopK**: `number`

Defined in: [core/src/tools/retrieve-knowledge.ts:100](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L100)

Default topK value if not specified in tool call.
Default: 5

***

### defaultEnhance?

> `optional` **defaultEnhance**: `boolean`

Defined in: [core/src/tools/retrieve-knowledge.ts:106](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L106)

Default value for query enhancement.
Default: true

***

### defaultRerank?

> `optional` **defaultRerank**: `boolean`

Defined in: [core/src/tools/retrieve-knowledge.ts:112](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L112)

Default value for reranking.
Default: true

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [core/src/tools/retrieve-knowledge.ts:118](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L118)

Tool execution timeout in milliseconds.
Default: 30000 (30 seconds)
