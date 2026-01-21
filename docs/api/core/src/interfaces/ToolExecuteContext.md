[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ToolExecuteContext

# Interface: ToolExecuteContext

Defined in: [core/src/tool/types.ts:6](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L6)

Tool execution context

## Properties

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [core/src/tool/types.ts:8](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L8)

Abort signal for cancellation

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [core/src/tool/types.ts:10](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L10)

Additional metadata

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [core/src/tool/types.ts:12](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/types.ts#L12)

Timeout override in milliseconds (overrides tool's default)
