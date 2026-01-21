[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / Tool

# Interface: Tool\<TInput, TOutput\>

Defined in: [core/src/tool/types.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L55)

Tool interface - validated and typed

## Type Parameters

### TInput

`TInput` *extends* `z.ZodType` = `z.ZodType`

### TOutput

`TOutput` = `unknown`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [core/src/tool/types.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L56)

***

### description

> `readonly` **description**: `string`

Defined in: [core/src/tool/types.ts:57](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L57)

***

### parameters

> `readonly` **parameters**: `TInput`

Defined in: [core/src/tool/types.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L58)

## Methods

### execute()

> **execute**(`input`, `context?`): `Promise`\<[`ToolResult`](ToolResult.md)\<`TOutput`\>\>

Defined in: [core/src/tool/types.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L63)

Execute the tool with validated input

#### Parameters

##### input

`TypeOf`\<`TInput`\>

##### context?

[`ToolExecuteContext`](ToolExecuteContext.md)

#### Returns

`Promise`\<[`ToolResult`](ToolResult.md)\<`TOutput`\>\>

***

### validate()

> **validate**(`input`): `SafeParseReturnType`\<`TypeOf`\<`TInput`\>, `TypeOf`\<`TInput`\>\>

Defined in: [core/src/tool/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L71)

Validate input against schema

#### Parameters

##### input

`unknown`

#### Returns

`SafeParseReturnType`\<`TypeOf`\<`TInput`\>, `TypeOf`\<`TInput`\>\>

***

### toJSON()

> **toJSON**(): `object`

Defined in: [core/src/tool/types.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L78)

Get JSON schema for LLM tool definition

#### Returns

`object`

##### name

> **name**: `string`

##### description

> **description**: `string`

##### parameters

> **parameters**: `Record`\<`string`, `unknown`\>
