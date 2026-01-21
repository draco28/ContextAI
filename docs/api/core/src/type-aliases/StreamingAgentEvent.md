[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / StreamingAgentEvent

# Type Alias: StreamingAgentEvent

> **StreamingAgentEvent** = \{ `type`: `"thought"`; `content`: `string`; \} \| \{ `type`: `"action"`; `tool`: `string`; `input`: `Record`\<`string`, `unknown`\>; \} \| \{ `type`: `"observation"`; `result`: `unknown`; `success`: `boolean`; \} \| \{ `type`: `"text"`; `content`: `string`; \} \| \{ `type`: `"done"`; `response`: [`AgentResponse`](../interfaces/AgentResponse.md); \}

Defined in: [core/src/agent/types.ts:121](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L121)

Streaming agent response events
