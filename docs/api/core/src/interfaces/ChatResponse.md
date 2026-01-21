[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ChatResponse

# Interface: ChatResponse

Defined in: [core/src/provider/types.ts:125](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L125)

LLM response structure

## Properties

### content

> **content**: `string`

Defined in: [core/src/provider/types.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L126)

***

### toolCalls?

> `optional` **toolCalls**: [`ToolCall`](ToolCall.md)[]

Defined in: [core/src/provider/types.ts:127](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L127)

***

### finishReason

> **finishReason**: `"error"` \| `"length"` \| `"stop"` \| `"tool_calls"` \| `"content_filter"`

Defined in: [core/src/provider/types.ts:128](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L128)

***

### usage?

> `optional` **usage**: [`TokenUsage`](TokenUsage.md)

Defined in: [core/src/provider/types.ts:130](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L130)

Token usage statistics

***

### metadata?

> `optional` **metadata**: [`ResponseMetadata`](ResponseMetadata.md)

Defined in: [core/src/provider/types.ts:132](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L132)

Response metadata for debugging/observability

***

### thinking?

> `optional` **thinking**: `string`

Defined in: [core/src/provider/types.ts:134](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L134)

Model's reasoning/thinking content (Claude extended thinking)
