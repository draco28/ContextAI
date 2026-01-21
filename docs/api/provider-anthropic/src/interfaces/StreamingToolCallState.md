[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / StreamingToolCallState

# Interface: StreamingToolCallState

Defined in: [provider-anthropic/src/response-mapper.ts:166](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L166)

State for accumulating tool calls during streaming.

Tool calls arrive in pieces:
1. content_block_start: { type: 'tool_use', id, name }
2. content_block_delta: { partial_json: '...' } (multiple times)
3. content_block_stop: finalize and emit

## Properties

### id

> **id**: `string`

Defined in: [provider-anthropic/src/response-mapper.ts:168](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L168)

Tool call ID from Anthropic

***

### name

> **name**: `string`

Defined in: [provider-anthropic/src/response-mapper.ts:170](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L170)

Tool/function name

***

### argumentsJson

> **argumentsJson**: `string`

Defined in: [provider-anthropic/src/response-mapper.ts:172](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L172)

Accumulated JSON string for arguments

***

### index

> **index**: `number`

Defined in: [provider-anthropic/src/response-mapper.ts:174](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L174)

Block index for tracking
