[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapResponse

# Function: mapResponse()

> **mapResponse**(`message`): `ChatResponse`

Defined in: [provider-anthropic/src/response-mapper.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/response-mapper.ts#L44)

Maps an Anthropic Message response to ContextAI ChatResponse.

Extracts:
- Text content from text blocks
- Tool calls from tool_use blocks
- Thinking content from thinking blocks (extended thinking)
- Usage statistics
- Metadata (request ID, model)

## Parameters

### message

`Message`

## Returns

`ChatResponse`
