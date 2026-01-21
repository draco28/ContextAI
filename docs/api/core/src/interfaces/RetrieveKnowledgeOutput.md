[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / RetrieveKnowledgeOutput

# Interface: RetrieveKnowledgeOutput

Defined in: [core/src/tools/retrieve-knowledge.ts:124](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L124)

Output type for the retrieve_knowledge tool.

## Properties

### context

> **context**: `string`

Defined in: [core/src/tools/retrieve-knowledge.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L126)

The assembled context string for LLM consumption

***

### sourceCount

> **sourceCount**: `number`

Defined in: [core/src/tools/retrieve-knowledge.ts:128](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L128)

Number of source chunks included

***

### estimatedTokens

> **estimatedTokens**: `number`

Defined in: [core/src/tools/retrieve-knowledge.ts:130](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L130)

Estimated token count

***

### sources

> **sources**: `object`[]

Defined in: [core/src/tools/retrieve-knowledge.ts:132](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L132)

Source references for citations

#### index

> **index**: `number`

#### chunkId

> **chunkId**: `string`

#### source?

> `optional` **source**: `string`

#### relevance

> **relevance**: `number`

***

### effectiveQuery

> **effectiveQuery**: `string`

Defined in: [core/src/tools/retrieve-knowledge.ts:139](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L139)

The query that was actually used (may differ from input if enhanced)

***

### searchTimeMs

> **searchTimeMs**: `number`

Defined in: [core/src/tools/retrieve-knowledge.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L141)

Total search time in milliseconds

***

### fromCache

> **fromCache**: `boolean`

Defined in: [core/src/tools/retrieve-knowledge.ts:143](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L143)

Whether result was served from cache
