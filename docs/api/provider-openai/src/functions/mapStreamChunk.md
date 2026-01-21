[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-openai/src](../README.md) / mapStreamChunk

# Function: mapStreamChunk()

> **mapStreamChunk**(`chunk`, `toolCallState`): `StreamChunk`

Defined in: [provider-openai/src/response-mapper.ts:124](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/response-mapper.ts#L124)

Convert OpenAI stream chunk to ContextAI StreamChunk.
Returns null if chunk has no meaningful content.

## Parameters

### chunk

`ChatCompletionChunk`

The OpenAI stream chunk

### toolCallState

`Map`\<`number`, [`StreamingToolCallState`](../interfaces/StreamingToolCallState.md)\>

Mutable state for accumulating tool calls

## Returns

`StreamChunk`
