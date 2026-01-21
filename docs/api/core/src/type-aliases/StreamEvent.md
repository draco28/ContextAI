[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / StreamEvent

# Type Alias: StreamEvent

> **StreamEvent** = [`ThoughtEvent`](../interfaces/ThoughtEvent.md) \| [`ActionEvent`](../interfaces/ActionEvent.md) \| [`ObservationEvent`](../interfaces/ObservationEvent.md) \| [`ToolCallEvent`](../interfaces/ToolCallEvent.md) \| \{ `type`: `"thought_delta"`; `content`: `string`; `iteration`: `number`; `timestamp`: `number`; \} \| \{ `type`: `"output_delta"`; `content`: `string`; `timestamp`: `number`; \} \| \{ `type`: `"error"`; `error`: `string`; `code?`: `string`; `timestamp`: `number`; \} \| \{ `type`: `"done"`; `output`: `string`; `trace`: [`ReActTrace`](../interfaces/ReActTrace.md); \}

Defined in: [core/src/agent/types.ts:287](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L287)

Event yielded by executeStream() generator
