[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / AgentResponse

# Interface: AgentResponse

Defined in: [core/src/agent/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L107)

Agent response (non-streaming)

## Properties

### output

> **output**: `string`

Defined in: [core/src/agent/types.ts:109](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L109)

Final output text

***

### trace

> **trace**: [`ReActTrace`](ReActTrace.md)

Defined in: [core/src/agent/types.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L111)

Complete reasoning trace

***

### success

> **success**: `boolean`

Defined in: [core/src/agent/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L113)

Whether execution was successful

***

### error?

> `optional` **error**: `string`

Defined in: [core/src/agent/types.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L115)

Error message if failed
