[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / buildRequestParams

# Function: buildRequestParams()

> **buildRequestParams**(`model`, `messages`, `options?`): `MessageCreateParams`

Defined in: [provider-anthropic/src/message-mapper.ts:384](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L384)

Builds complete Anthropic API request parameters.

Combines:
- Model selection
- System message (extracted)
- Mapped messages
- Generation options (temperature, max_tokens, etc.)
- Tools (if any)
- Extended thinking config (if enabled)

## Parameters

### model

`string`

### messages

`ChatMessage`[]

### options?

`GenerateOptions`

## Returns

`MessageCreateParams`
