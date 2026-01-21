[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / retrieveKnowledgeInputSchema

# Variable: retrieveKnowledgeInputSchema

> `const` **retrieveKnowledgeInputSchema**: `ZodObject`\<\{ `query`: `ZodString`; `maxResults`: `ZodOptional`\<`ZodNumber`\>; `enhanceQuery`: `ZodOptional`\<`ZodBoolean`\>; `rerankResults`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}, \{ `query?`: `string`; `maxResults?`: `number`; `enhanceQuery?`: `boolean`; `rerankResults?`: `boolean`; \}\>

Defined in: [core/src/tools/retrieve-knowledge.ts:153](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tools/retrieve-knowledge.ts#L153)

Zod schema for retrieve_knowledge tool input.
