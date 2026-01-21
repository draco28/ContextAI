[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / generateA11yId

# Function: generateA11yId()

> **generateA11yId**(`prefix`): `string`

Defined in: [react/src/utils/a11y.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/a11y.ts#L52)

Generate a unique ID for ARIA relationships.
Uses crypto.randomUUID when available, falls back to timestamp-based ID.

## Parameters

### prefix

`string` = `'a11y'`

Optional prefix for the ID (e.g., 'message', 'step')

## Returns

`string`

A unique string ID

## Example

```tsx
const descriptionId = generateA11yId('error');
// Returns: "error-a1b2c3d4" or similar

<span id={descriptionId}>Error message here</span>
<input aria-describedby={descriptionId} />
```
