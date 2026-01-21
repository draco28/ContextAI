[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / AgentConfig

# Interface: AgentConfig

Defined in: [core/src/agent/types.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L61)

Agent configuration

## Properties

### name

> **name**: `string`

Defined in: [core/src/agent/types.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L63)

Agent name for identification

***

### systemPrompt

> **systemPrompt**: `string`

Defined in: [core/src/agent/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L65)

System prompt defining agent behavior

***

### llm

> **llm**: [`LLMProvider`](LLMProvider.md)

Defined in: [core/src/agent/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L67)

LLM provider instance

***

### tools?

> `optional` **tools**: [`Tool`](Tool.md)\<`ZodType`\<`any`, `ZodTypeDef`, `any`\>, `unknown`\>[]

Defined in: [core/src/agent/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L69)

Available tools

***

### maxIterations?

> `optional` **maxIterations**: `number`

Defined in: [core/src/agent/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L71)

Maximum ReAct iterations (default: 10)

***

### callbacks?

> `optional` **callbacks**: [`ReActEventCallbacks`](ReActEventCallbacks.md)

Defined in: [core/src/agent/types.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L73)

Event callbacks for real-time debugging

***

### logger?

> `optional` **logger**: [`Logger`](Logger.md)

Defined in: [core/src/agent/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L75)

Optional logger for tracing

***

### memory?

> `optional` **memory**: [`MemoryProvider`](MemoryProvider.md)

Defined in: [core/src/agent/types.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L77)

Memory provider for conversation persistence

***

### sessionId?

> `optional` **sessionId**: `string`

Defined in: [core/src/agent/types.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L79)

Session ID for memory persistence (required if memory is provided)

***

### context?

> `optional` **context**: [`ChatMessage`](ChatMessage.md)[]

Defined in: [core/src/agent/types.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L81)

Initial conversation context (messages to pre-populate)

***

### maxContextTokens?

> `optional` **maxContextTokens**: `number`

Defined in: [core/src/agent/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L83)

Maximum tokens to retain in conversation context

***

### tokenCounter?

> `optional` **tokenCounter**: [`TokenCounter`](../type-aliases/TokenCounter.md)

Defined in: [core/src/agent/types.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L85)

Custom token counter for context management

***

### errorRecovery?

> `optional` **errorRecovery**: `ErrorRecoveryConfig`

Defined in: [core/src/agent/types.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L87)

Error recovery configuration for tool execution
