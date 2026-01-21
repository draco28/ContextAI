[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ReActTrace

# Interface: ReActTrace

Defined in: [core/src/agent/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L47)

Complete ReAct trace for debugging

## Properties

### steps

> **steps**: [`ReActStep`](../type-aliases/ReActStep.md)[]

Defined in: [core/src/agent/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L49)

All steps in the reasoning chain

***

### iterations

> **iterations**: `number`

Defined in: [core/src/agent/types.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L51)

Number of ReAct iterations

***

### totalTokens

> **totalTokens**: `number`

Defined in: [core/src/agent/types.ts:53](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L53)

Total tokens used

***

### durationMs

> **durationMs**: `number`

Defined in: [core/src/agent/types.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L55)

Total duration in milliseconds
