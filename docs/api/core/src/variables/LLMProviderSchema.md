[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / LLMProviderSchema

# Variable: LLMProviderSchema

> `const` **LLMProviderSchema**: `ZodObject`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `name`: `ZodString`; `model`: `ZodString`; `chat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `streamChat`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; `isAvailable`: `ZodFunction`\<`ZodTuple`\<\[\], `ZodUnknown`\>, `ZodUnknown`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>

Defined in: [core/src/agent/schemas.ts:21](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/schemas.ts#L21)

Schema for validating LLMProvider interface
Uses passthrough to allow additional properties
