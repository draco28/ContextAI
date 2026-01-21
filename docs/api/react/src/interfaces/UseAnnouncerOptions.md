[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAnnouncerOptions

# Interface: UseAnnouncerOptions

Defined in: [react/src/utils/announcer.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L52)

Options for the useAnnouncer hook

## Properties

### defaultPoliteness?

> `optional` **defaultPoliteness**: [`LiveRegionPoliteness`](../type-aliases/LiveRegionPoliteness.md)

Defined in: [react/src/utils/announcer.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L58)

Default politeness level for announcements.
- 'polite': Waits for user to finish current task (default)
- 'assertive': Interrupts immediately (use sparingly)

***

### clearDelay?

> `optional` **clearDelay**: `number`

Defined in: [react/src/utils/announcer.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L64)

Delay in ms before clearing the announcement.
Clearing prevents repeated announcements on re-renders.

#### Default

```ts
1000
```
