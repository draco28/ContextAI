[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / extractSystemMessage

# Function: extractSystemMessage()

> **extractSystemMessage**(`messages`): `ExtractedMessages`

Defined in: [provider-anthropic/src/message-mapper.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L70)

Extracts system messages from the conversation.

Anthropic requires system messages to be passed separately, not in the
messages array. This function:
1. Finds all system messages
2. Combines them into a single system string
3. Returns remaining messages without system messages

## Parameters

### messages

`ChatMessage`[]

## Returns

`ExtractedMessages`

## Example

```typescript
const { system, messages } = extractSystemMessage([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello' },
]);
// system = 'You are helpful.'
// messages = [{ role: 'user', content: 'Hello' }]
```
