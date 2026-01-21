[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseChatReturn

# Interface: UseChatReturn

Defined in: [react/src/hooks/types.ts:121](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L121)

Return type for useChat hook (primary API)

Full-featured hook with streaming content display,
abort support, and external message control.

## Properties

### messages

> **messages**: [`Message`](Message.md)[]

Defined in: [react/src/hooks/types.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L123)

All messages in the conversation

***

### streamingContent

> **streamingContent**: `string`

Defined in: [react/src/hooks/types.ts:125](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L125)

Current streaming content (partial response being built)

***

### isLoading

> **isLoading**: `boolean`

Defined in: [react/src/hooks/types.ts:127](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L127)

Whether a request is in progress

***

### error

> **error**: `Error`

Defined in: [react/src/hooks/types.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L129)

Current error, if any

***

### sendMessage()

> **sendMessage**: (`content`) => `Promise`\<`AgentResponse`\>

Defined in: [react/src/hooks/types.ts:131](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L131)

Send a message to the agent

#### Parameters

##### content

`string`

#### Returns

`Promise`\<`AgentResponse`\>

***

### clearMessages()

> **clearMessages**: () => `void`

Defined in: [react/src/hooks/types.ts:133](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L133)

Clear all messages and reset state

#### Returns

`void`

***

### abort()

> **abort**: () => `void`

Defined in: [react/src/hooks/types.ts:135](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L135)

Abort the current request

#### Returns

`void`

***

### setMessages

> **setMessages**: `Dispatch`\<`SetStateAction`\<[`Message`](Message.md)[]\>\>

Defined in: [react/src/hooks/types.ts:137](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L137)

Set messages programmatically (for external control)
