[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / UseAgentStreamOptions

# Interface: UseAgentStreamOptions

Defined in: [react/src/hooks/types.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L85)

Options for useAgentStream hook

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

Defined in: [react/src/hooks/types.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L87)

Callback when a tool is called

#### Parameters

##### tool

`string`

##### args

`unknown`

#### Returns

`void`

***

### onThought()?

> `optional` **onThought**: (`content`) => `void`

Defined in: [react/src/hooks/types.ts:89](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L89)

Callback when agent generates a thought

#### Parameters

##### content

`string`

#### Returns

`void`

***

### onReasoning()?

> `optional` **onReasoning**: (`step`) => `void`

Defined in: [react/src/hooks/types.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L91)

Callback when a reasoning step occurs

#### Parameters

##### step

[`ReasoningStep`](ReasoningStep.md)

#### Returns

`void`
