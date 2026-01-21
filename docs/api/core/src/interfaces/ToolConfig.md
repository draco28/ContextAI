[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ToolConfig

# Interface: ToolConfig\<TInput, TOutput\>

Defined in: [core/src/tool/types.ts:27](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L27)

Tool configuration for defineTool()

## Type Parameters

### TInput

`TInput` *extends* `z.ZodType` = `z.ZodType`

### TOutput

`TOutput` = `unknown`

## Properties

### name

> **name**: `string`

Defined in: [core/src/tool/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L32)

Unique tool name

***

### description

> **description**: `string`

Defined in: [core/src/tool/types.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L34)

Human-readable description for LLM

***

### parameters

> **parameters**: `TInput`

Defined in: [core/src/tool/types.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L36)

Zod schema for input validation

***

### execute()

> **execute**: (`input`, `context`) => `Promise`\<[`ToolResult`](ToolResult.md)\<`TOutput`\>\>

Defined in: [core/src/tool/types.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L38)

Tool execution function

#### Parameters

##### input

`TypeOf`\<`TInput`\>

##### context

[`ToolExecuteContext`](ToolExecuteContext.md)

#### Returns

`Promise`\<[`ToolResult`](ToolResult.md)\<`TOutput`\>\>

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [core/src/tool/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L43)

Tool execution timeout in milliseconds (default: 30000)

***

### outputSchema?

> `optional` **outputSchema**: `ZodType`\<`TOutput`\>

Defined in: [core/src/tool/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L49)

Optional Zod schema for validating tool output.
If provided, ToolResult.data will be validated against this schema.
Validation failures throw ToolOutputValidationError.
