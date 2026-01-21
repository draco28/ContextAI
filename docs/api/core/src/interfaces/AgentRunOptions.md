[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / AgentRunOptions

# Interface: AgentRunOptions

Defined in: [core/src/agent/types.ts:93](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L93)

Runtime options for agent.run()

## Properties

### maxIterations?

> `optional` **maxIterations**: `number`

Defined in: [core/src/agent/types.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L95)

Override max iterations

***

### context?

> `optional` **context**: [`ChatMessage`](ChatMessage.md)[]

Defined in: [core/src/agent/types.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L97)

Additional context messages

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [core/src/agent/types.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L99)

Abort signal for cancellation

***

### callbacks?

> `optional` **callbacks**: [`ReActEventCallbacks`](ReActEventCallbacks.md)

Defined in: [core/src/agent/types.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L101)

Override callbacks at runtime (merges with constructor callbacks)
