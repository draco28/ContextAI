[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / AgentConfigSchema

# Variable: AgentConfigSchema

> `const` **AgentConfigSchema**: `ZodObject`\<\{ `name`: `ZodString`; `systemPrompt`: `ZodString`; `llm`: `ZodObject`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>; `tools`: `ZodOptional`\<`ZodArray`\<`ZodAny`, `"many"`\>\>; `maxIterations`: `ZodOptional`\<`ZodNumber`\>; `callbacks`: `ZodOptional`\<`ZodObject`\<\{ \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>\>\>; `logger`: `ZodOptional`\<`ZodObject`\<\{ \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `name?`: `string`; `systemPrompt?`: `string`; `llm?`: `object` & `object`; `tools?`: `any`[]; `maxIterations?`: `number`; `callbacks?`: `object` & `object`; `logger?`: `object` & `object`; \}, \{ `name?`: `string`; `systemPrompt?`: `string`; `llm?`: `object` & `object`; `tools?`: `any`[]; `maxIterations?`: `number`; `callbacks?`: `object` & `object`; `logger?`: `object` & `object`; \}\>

Defined in: [core/src/agent/schemas.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/schemas.ts#L38)

Schema for validating AgentConfig
