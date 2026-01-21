[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / normalizeContent

# Function: normalizeContent()

> **normalizeContent**(`content`): [`ContentPart`](../type-aliases/ContentPart.md)[]

Defined in: [core/src/provider/content.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/content.ts#L64)

Normalize message content to always be an array of content parts.
Useful for providers that need consistent array format.

## Parameters

### content

[`MessageContent`](../type-aliases/MessageContent.md)

## Returns

[`ContentPart`](../type-aliases/ContentPart.md)[]

## Example

```typescript
normalizeContent("Hello") // [{ type: 'text', text: 'Hello' }]
normalizeContent([{ type: 'text', text: 'Hi' }]) // [{ type: 'text', text: 'Hi' }]
```
