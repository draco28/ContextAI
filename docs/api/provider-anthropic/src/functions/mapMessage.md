[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapMessage

# Function: mapMessage()

> **mapMessage**(`message`): `MessageParam`

Defined in: [provider-anthropic/src/message-mapper.ts:114](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L114)

Maps a single ChatMessage to Anthropic MessageParam.

Handles:
- User messages (text or multimodal)
- Assistant messages (text or with tool calls)
- Tool result messages

## Parameters

### message

`ChatMessage`

## Returns

`MessageParam`
