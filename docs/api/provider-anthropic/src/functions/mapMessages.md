[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapMessages

# Function: mapMessages()

> **mapMessages**(`messages`): `MessageParam`[]

Defined in: [provider-anthropic/src/message-mapper.ts:102](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L102)

Maps ContextAI ChatMessage array to Anthropic MessageParam array.

NOTE: Call extractSystemMessage first to separate system messages!
This function assumes system messages have already been extracted.

## Parameters

### messages

`ChatMessage`[]

## Returns

`MessageParam`[]
