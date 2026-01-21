[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapStreamEvent

# Function: mapStreamEvent()

> **mapStreamEvent**(`event`, `state`): `StreamChunk`

Defined in: [provider-anthropic/src/response-mapper.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L216)

Maps an Anthropic stream event to a ContextAI StreamChunk.

Returns null for events that don't produce output (e.g., message_start metadata).
The caller should skip null returns.

## Parameters

### event

`RawMessageStreamEvent`

Anthropic stream event

### state

`StreamingState`

Mutable streaming state (updated in place)

## Returns

`StreamChunk`

StreamChunk or null
