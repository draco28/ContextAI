[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / announceToScreenReader

# Function: announceToScreenReader()

> **announceToScreenReader**(`message`, `politeness`): `void`

Defined in: [react/src/utils/announcer.ts:194](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L194)

Standalone function to make a one-off announcement.
Prefer useAnnouncer hook in React components for better lifecycle management.

## Parameters

### message

`string`

The text to announce

### politeness

[`LiveRegionPoliteness`](../type-aliases/LiveRegionPoliteness.md) = `'polite'`

Politeness level (default: 'polite')

## Returns

`void`

## Example

```ts
// In a non-React context or event handler
announceToScreenReader('File uploaded successfully');
```
