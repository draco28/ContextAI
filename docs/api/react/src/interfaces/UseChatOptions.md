[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseChatOptions

# Interface: UseChatOptions

Defined in: [react/src/hooks/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L75)

Options for useChat hook

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

### onFinish()?

> `optional` **onFinish**: (`response`) => `void`

Defined in: [react/src/hooks/types.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L77)

Callback when response is fully complete

#### Parameters

##### response

`AgentResponse`

#### Returns

`void`

***

### onStream()?

> `optional` **onStream**: (`content`) => `void`

Defined in: [react/src/hooks/types.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L79)

Callback when streaming content updates

#### Parameters

##### content

`string`

#### Returns

`void`
