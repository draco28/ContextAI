[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / generateMessageId

# Function: generateMessageId()

> **generateMessageId**(): `string`

Defined in: [react/src/types.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/types.ts#L40)

Generate a unique message ID for React keys

Uses timestamp + random suffix for uniqueness without external deps

## Returns

`string`

A unique message ID string

## Example

```ts
const message: Message = {
  id: generateMessageId(),
  role: 'user',
  content: 'Hello!'
};
```
