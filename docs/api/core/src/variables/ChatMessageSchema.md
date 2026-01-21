[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ChatMessageSchema

# Variable: ChatMessageSchema

> `const` **ChatMessageSchema**: `ZodObject`\<\{ `role`: `ZodEnum`\<\[`"system"`, `"user"`, `"assistant"`, `"tool"`\]\>; `content`: `ZodUnion`\<\[`ZodString`, `ZodArray`\<`ZodAny`, `"many"`\>\]\>; `name`: `ZodOptional`\<`ZodString`\>; `toolCallId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `role?`: `"system"` \| `"user"` \| `"assistant"` \| `"tool"`; `content?`: `string` \| `any`[]; `name?`: `string`; `toolCallId?`: `string`; \}, \{ `role?`: `"system"` \| `"user"` \| `"assistant"` \| `"tool"`; `content?`: `string` \| `any`[]; `name?`: `string`; `toolCallId?`: `string`; \}\>

Defined in: [core/src/agent/schemas.ts:6](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/schemas.ts#L6)

Schema for validating ChatMessage objects
