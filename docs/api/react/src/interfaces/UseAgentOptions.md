[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAgentOptions

# Interface: UseAgentOptions

Defined in: [react/src/hooks/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L67)

Options for useAgent hook

## Extends

- `UseAgentOptionsBase`

## Properties

### initialMessages?

> `optional` **initialMessages**: [`Message`](Message.md)[]

Defined in: [react/src/hooks/types.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L59)

Initial messages to pre-populate the conversation

#### Inherited from

`UseAgentOptionsBase.initialMessages`

***

### onError()?

> `optional` **onError**: (`error`) => `void`

Defined in: [react/src/hooks/types.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L61)

Callback when error occurs

#### Parameters

##### error

`Error`

#### Returns

`void`

#### Inherited from

`UseAgentOptionsBase.onError`

***

### onToolCall()?

> `optional` **onToolCall**: (`tool`, `args`) => `void`

Defined in: [react/src/hooks/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L69)

Callback when a tool is called (for debugging/logging)

#### Parameters

##### tool

`string`

##### args

`unknown`

#### Returns

`void`
