[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useAutoFocus

# Function: useAutoFocus()

> **useAutoFocus**(`elementRef`, `enabled`): `void`

Defined in: [react/src/utils/focus-trap.ts:157](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/focus-trap.ts#L157)

Hook that auto-focuses an element on mount.

Useful for focusing the first interactive element in a modal
or the main content after navigation.

## Parameters

### elementRef

`RefObject`\<`HTMLElement`\>

Ref to the element to focus

### enabled

`boolean` = `true`

Whether to auto-focus (default: true)

## Returns

`void`

## Example

```tsx
function Modal({ isOpen }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useAutoFocus(closeButtonRef, isOpen);

  return (
    <div role="dialog">
      <button ref={closeButtonRef}>Close</button>
    </div>
  );
}
```
