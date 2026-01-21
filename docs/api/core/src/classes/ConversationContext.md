[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ConversationContext

# Class: ConversationContext

Defined in: [core/src/agent/context.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L60)

ConversationContext - Manages message history for multi-turn conversations

Provides a sliding window over conversation history, automatically
truncating old messages when token limits are exceeded.

## Example

```typescript
const context = new ConversationContext({ maxTokens: 4000 });
context.addMessage({ role: 'user', content: 'Hello' });
context.addMessage({ role: 'assistant', content: 'Hi there!' });

// Get all messages for next LLM call
const messages = context.getMessages();
```

## Constructors

### Constructor

> **new ConversationContext**(`config`): `ConversationContext`

Defined in: [core/src/agent/context.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L65)

#### Parameters

##### config

[`ConversationContextConfig`](../interfaces/ConversationContextConfig.md) = `{}`

#### Returns

`ConversationContext`

## Accessors

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [core/src/agent/context.ts:98](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L98)

Get the number of messages in context

##### Returns

`number`

## Methods

### addMessage()

> **addMessage**(`message`): `void`

Defined in: [core/src/agent/context.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L77)

Add a message to the conversation history

#### Parameters

##### message

[`ChatMessage`](../interfaces/ChatMessage.md)

#### Returns

`void`

***

### addMessages()

> **addMessages**(`messages`): `void`

Defined in: [core/src/agent/context.ts:84](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L84)

Add multiple messages to the conversation history

#### Parameters

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

#### Returns

`void`

***

### getMessages()

> **getMessages**(): [`ChatMessage`](../interfaces/ChatMessage.md)[]

Defined in: [core/src/agent/context.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L91)

Get all messages in the conversation

#### Returns

[`ChatMessage`](../interfaces/ChatMessage.md)[]

***

### clear()

> **clear**(): `void`

Defined in: [core/src/agent/context.ts:105](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L105)

Clear all messages from context

#### Returns

`void`

***

### countTokens()

> **countTokens**(): `Promise`\<`number`\>

Defined in: [core/src/agent/context.ts:112](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L112)

Count tokens in current context

#### Returns

`Promise`\<`number`\>

***

### truncate()

> **truncate**(): `Promise`\<`number`\>

Defined in: [core/src/agent/context.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L122)

Truncate old messages to fit within maxTokens
Preserves system message (index 0) and removes oldest user/assistant pairs

#### Returns

`Promise`\<`number`\>

Number of messages removed

***

### toJSON()

> **toJSON**(): `object`

Defined in: [core/src/agent/context.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L152)

Create a snapshot of the current context for serialization

#### Returns

`object`

##### messages

> **messages**: [`ChatMessage`](../interfaces/ChatMessage.md)[]

##### maxTokens?

> `optional` **maxTokens**: `number`

***

### fromJSON()

> `static` **fromJSON**(`data`, `tokenCounter?`): `ConversationContext`

Defined in: [core/src/agent/context.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L162)

Create a ConversationContext from a serialized snapshot

#### Parameters

##### data

###### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

###### maxTokens?

`number`

##### tokenCounter?

[`TokenCounter`](../type-aliases/TokenCounter.md)

#### Returns

`ConversationContext`
