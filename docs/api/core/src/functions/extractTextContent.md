[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / extractTextContent

# Function: extractTextContent()

> **extractTextContent**(`content`): `string`

Defined in: [core/src/provider/content.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/content.ts#L85)

Extract all text from message content.
Concatenates text from string content or all text parts.

## Parameters

### content

[`MessageContent`](../type-aliases/MessageContent.md)

## Returns

`string`

## Example

```typescript
extractTextContent("Hello") // "Hello"
extractTextContent([
  { type: 'text', text: 'Hello ' },
  { type: 'image', url: '...' },
  { type: 'text', text: 'World' }
]) // "Hello World"
```
