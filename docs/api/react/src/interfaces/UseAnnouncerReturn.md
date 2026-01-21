[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAnnouncerReturn

# Interface: UseAnnouncerReturn

Defined in: [react/src/utils/announcer.ts:70](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L70)

Return type for useAnnouncer hook

## Properties

### announce()

> **announce**: (`message`, `politeness?`) => `void`

Defined in: [react/src/utils/announcer.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L77)

Announce a message to screen readers.

#### Parameters

##### message

`string`

The text to announce

##### politeness?

[`LiveRegionPoliteness`](../type-aliases/LiveRegionPoliteness.md)

Override the default politeness level

#### Returns

`void`

***

### clear()

> **clear**: () => `void`

Defined in: [react/src/utils/announcer.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L81)

Clear any pending announcement immediately.

#### Returns

`void`
