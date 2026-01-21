[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / isActivationKey

# Function: isActivationKey()

> **isActivationKey**(`event`): `boolean`

Defined in: [react/src/utils/a11y.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/a11y.ts#L141)

Check if a keyboard event matches common activation keys (Enter or Space).
Useful for making non-button elements keyboard-activatable.

## Parameters

### event

The keyboard event to check

`KeyboardEvent`\<`Element`\> | `KeyboardEvent`

## Returns

`boolean`

true if Enter or Space was pressed

## Example

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (isActivationKey(e)) {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom Button
</div>
```
