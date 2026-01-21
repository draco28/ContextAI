[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ConversationContextConfig

# Interface: ConversationContextConfig

Defined in: [core/src/agent/context.ts:12](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L12)

Configuration for ConversationContext

## Properties

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [core/src/agent/context.ts:14](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L14)

Maximum tokens to retain in context (triggers truncation)

***

### initialMessages?

> `optional` **initialMessages**: [`ChatMessage`](ChatMessage.md)[]

Defined in: [core/src/agent/context.ts:16](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L16)

Initial messages to populate context

***

### tokenCounter?

> `optional` **tokenCounter**: [`TokenCounter`](../type-aliases/TokenCounter.md)

Defined in: [core/src/agent/context.ts:18](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/context.ts#L18)

Custom token counter (defaults to estimation)
