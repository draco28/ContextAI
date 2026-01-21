[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / AgentRunOptionsSchema

# Variable: AgentRunOptionsSchema

> `const` **AgentRunOptionsSchema**: `ZodObject`\<\{ `maxIterations`: `ZodOptional`\<`ZodNumber`\>; `context`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `role`: `ZodEnum`\<\[`"system"`, `"user"`, `"assistant"`, `"tool"`\]\>; `content`: `ZodUnion`\<\[`ZodString`, `ZodArray`\<`ZodAny`, `"many"`\>\]\>; `name`: `ZodOptional`\<`ZodString`\>; `toolCallId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `role?`: `"system"` \| `"user"` \| `"assistant"` \| `"tool"`; `content?`: `string` \| `any`[]; `name?`: `string`; `toolCallId?`: `string`; \}, \{ `role?`: `"system"` \| `"user"` \| `"assistant"` \| `"tool"`; `content?`: `string` \| `any`[]; `name?`: `string`; `toolCallId?`: `string`; \}\>, `"many"`\>\>; `signal`: `ZodOptional`\<`ZodAny`\>; `callbacks`: `ZodOptional`\<`ZodObject`\<\{ \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ \}, `ZodTypeAny`, `"passthrough"`\>\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `maxIterations?`: `number`; `context?`: `object`[]; `signal?`: `any`; `callbacks?`: `object` & `object`; \}, \{ `maxIterations?`: `number`; `context?`: `object`[]; `signal?`: `any`; `callbacks?`: `object` & `object`; \}\>

Defined in: [core/src/agent/schemas.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/schemas.ts#L64)

Schema for validating AgentRunOptions
