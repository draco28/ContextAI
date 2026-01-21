[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAgentStreamReturn

# Interface: UseAgentStreamReturn

Defined in: [react/src/hooks/types.ts:146](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L146)

Return type for useAgentStream hook (full streaming with ReAct visibility)

Exposes the complete ReAct reasoning chain for building
debugging UIs and transparent agent interactions.

## Properties

### messages

> **messages**: [`Message`](Message.md)[]

Defined in: [react/src/hooks/types.ts:148](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L148)

All messages in the conversation

***

### streamingContent

> **streamingContent**: `string`

Defined in: [react/src/hooks/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L150)

Current streaming content (partial response being built)

***

### reasoning

> **reasoning**: [`ReasoningStep`](ReasoningStep.md)[]

Defined in: [react/src/hooks/types.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L152)

ReAct reasoning steps (thought/action/observation)

***

### trace

> **trace**: `ReActTrace`

Defined in: [react/src/hooks/types.ts:154](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L154)

Complete trace from the last response (for debugging)

***

### isLoading

> **isLoading**: `boolean`

Defined in: [react/src/hooks/types.ts:156](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L156)

Whether a request is in progress

***

### error

> **error**: `Error`

Defined in: [react/src/hooks/types.ts:158](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L158)

Current error, if any

***

### sendMessage()

> **sendMessage**: (`content`) => `Promise`\<`void`\>

Defined in: [react/src/hooks/types.ts:160](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L160)

Send a message to the agent

#### Parameters

##### content

`string`

#### Returns

`Promise`\<`void`\>

***

### clearMessages()

> **clearMessages**: () => `void`

Defined in: [react/src/hooks/types.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L162)

Clear all messages and reset state

#### Returns

`void`

***

### abort()

> **abort**: () => `void`

Defined in: [react/src/hooks/types.ts:164](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L164)

Abort the current request

#### Returns

`void`
