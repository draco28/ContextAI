[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useFocusReturn

# Function: useFocusReturn()

> **useFocusReturn**(`enabled`): `void`

Defined in: [react/src/utils/focus-trap.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/focus-trap.ts#L110)

Hook that saves and restores focus when a component mounts/unmounts.

Useful for modals: saves focus on open, restores to original element on close.
This maintains the user's context after interacting with a modal.

## Parameters

### enabled

`boolean`

Whether to manage focus (typically tied to modal open state)

## Returns

`void`

## Example

```tsx
function Modal({ isOpen, children }) {
  useFocusReturn(isOpen);

  if (!isOpen) return null;
  return <div role="dialog">{children}</div>;
}
```
