[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAgentReturn

# Interface: UseAgentReturn

Defined in: [react/src/hooks/types.ts:102](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L102)

Return type for useAgent hook (non-streaming)

Provides the simplest interface for agent interaction:
send a message, get a response.

## Properties

### messages

> **messages**: [`Message`](Message.md)[]

Defined in: [react/src/hooks/types.ts:104](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L104)

All messages in the conversation

***

### isLoading

> **isLoading**: `boolean`

Defined in: [react/src/hooks/types.ts:106](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L106)

Whether a request is in progress

***

### error

> **error**: `Error`

Defined in: [react/src/hooks/types.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L108)

Current error, if any

***

### sendMessage()

> **sendMessage**: (`content`) => `Promise`\<`AgentResponse`\>

Defined in: [react/src/hooks/types.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L110)

Send a message to the agent

#### Parameters

##### content

`string`

#### Returns

`Promise`\<`AgentResponse`\>

***

### clearMessages()

> **clearMessages**: () => `void`

Defined in: [react/src/hooks/types.ts:112](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L112)

Clear all messages and reset state

#### Returns

`void`
