[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useFocusTrap

# Function: useFocusTrap()

> **useFocusTrap**(`containerRef`, `enabled`): `void`

Defined in: [react/src/utils/focus-trap.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/focus-trap.ts#L61)

Hook that traps focus within a container element.

When enabled, Tab and Shift+Tab cycle through focusable elements
within the container, preventing focus from escaping.

## Parameters

### containerRef

`RefObject`\<`HTMLElement`\>

Ref to the container element

### enabled

`boolean` = `true`

Whether the trap is active (default: true)

## Returns

`void`

## Example

```tsx
function Modal({ isOpen, onClose, children }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Only trap focus when modal is open
  useFocusTrap(containerRef, isOpen);

  if (!isOpen) return null;

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```
