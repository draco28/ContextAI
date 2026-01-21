[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ResponseFormat

# Type Alias: ResponseFormat

> **ResponseFormat** = \{ `type`: `"text"`; \} \| \{ `type`: `"json_object"`; `schema?`: `Record`\<`string`, `unknown`\>; \} \| \{ `type`: `"json_schema"`; `jsonSchema`: \{ `name`: `string`; `schema`: `Record`\<`string`, `unknown`\>; `strict?`: `boolean`; \}; \}

Defined in: [core/src/provider/types.ts:165](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L165)

Response format configuration for structured output
