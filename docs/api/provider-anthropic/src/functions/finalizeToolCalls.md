[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / finalizeToolCalls

# Function: finalizeToolCalls()

> **finalizeToolCalls**(`state`): `ToolCall`[]

Defined in: [provider-anthropic/src/response-mapper.ts:421](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L421)

Finalizes all accumulated tool calls from streaming state.
Call this after the stream ends to get parsed tool calls.

## Parameters

### state

`StreamingState`

## Returns

`ToolCall`[]
