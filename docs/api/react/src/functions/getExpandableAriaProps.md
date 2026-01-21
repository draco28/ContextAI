[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / getExpandableAriaProps

# Function: getExpandableAriaProps()

> **getExpandableAriaProps**(`isExpanded`, `controlsId`): [`ExpandableAriaProps`](../interfaces/ExpandableAriaProps.md)

Defined in: [react/src/utils/a11y.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/a11y.ts#L96)

Generate ARIA props for an expandable trigger button.

## Parameters

### isExpanded

`boolean`

Whether the controlled region is currently expanded

### controlsId

`string`

The ID of the element being controlled

## Returns

[`ExpandableAriaProps`](../interfaces/ExpandableAriaProps.md)

Object with aria-expanded and aria-controls

## Example

```tsx
const [open, setOpen] = useState(false);
const contentId = 'details-content';

<button {...getExpandableAriaProps(open, contentId)} onClick={() => setOpen(!open)}>
  Toggle Details
</button>
<div id={contentId} hidden={!open}>
  Details content here
</div>
```
