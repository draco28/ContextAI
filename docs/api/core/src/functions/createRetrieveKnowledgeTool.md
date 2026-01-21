[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / createRetrieveKnowledgeTool

# Function: createRetrieveKnowledgeTool()

> **createRetrieveKnowledgeTool**(`ragEngine`, `options`): [`Tool`](../interfaces/Tool.md)\<`ZodObject`\<\{ `query`: `ZodString`; `maxResults`: `ZodOptional`\<`ZodNumber`\>; `enhanceQuery`: `ZodOptional`\<`ZodBoolean`\>; `rerankResults`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}\>, [`RetrieveKnowledgeOutput`](../interfaces/RetrieveKnowledgeOutput.md)\>

Defined in: [core/src/tools/retrieve-knowledge.ts:240](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L240)

Create a retrieve_knowledge tool for agent registration.

This factory function creates a Tool that wraps a RAGEngine,
allowing agents to search a knowledge base when needed.

## Parameters

### ragEngine

[`RAGEngineInterface`](../interfaces/RAGEngineInterface.md)

The RAG engine to use for searches

### options

[`RetrieveKnowledgeToolOptions`](../interfaces/RetrieveKnowledgeToolOptions.md) = `{}`

Tool configuration options

## Returns

[`Tool`](../interfaces/Tool.md)\<`ZodObject`\<\{ `query`: `ZodString`; `maxResults`: `ZodOptional`\<`ZodNumber`\>; `enhanceQuery`: `ZodOptional`\<`ZodBoolean`\>; `rerankResults`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}\>, [`RetrieveKnowledgeOutput`](../interfaces/RetrieveKnowledgeOutput.md)\>

A Tool compatible with the agent's tool registry

## Example

```typescript
// Basic usage
const tool = createRetrieveKnowledgeTool(ragEngine);

// With custom options
const tool = createRetrieveKnowledgeTool(ragEngine, {
  defaultTopK: 10,
  timeout: 60000,
  description: 'Search the codebase documentation...',
});
```
