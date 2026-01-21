[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / GenerateOptions

# Interface: GenerateOptions

Defined in: [core/src/provider/types.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L216)

Options for generate/chat calls

## Properties

### temperature?

> `optional` **temperature**: `number`

Defined in: [core/src/provider/types.ts:218](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L218)

Sampling temperature (0-2, lower = more deterministic)

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [core/src/provider/types.ts:220](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L220)

Maximum tokens to generate

***

### stopSequences?

> `optional` **stopSequences**: `string`[]

Defined in: [core/src/provider/types.ts:222](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L222)

Stop generation at these sequences

***

### tools?

> `optional` **tools**: [`ToolDefinition`](ToolDefinition.md)[]

Defined in: [core/src/provider/types.ts:224](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L224)

Tools available for the model to call

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [core/src/provider/types.ts:226](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L226)

Abort signal for cancellation

***

### responseFormat?

> `optional` **responseFormat**: [`ResponseFormat`](../type-aliases/ResponseFormat.md)

Defined in: [core/src/provider/types.ts:228](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L228)

Response format (text, json_object, json_schema)

***

### topP?

> `optional` **topP**: `number`

Defined in: [core/src/provider/types.ts:230](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L230)

Nucleus sampling: consider tokens with top_p probability mass

***

### topK?

> `optional` **topK**: `number`

Defined in: [core/src/provider/types.ts:232](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L232)

Top-K sampling: only consider top K tokens (Claude)

***

### frequencyPenalty?

> `optional` **frequencyPenalty**: `number`

Defined in: [core/src/provider/types.ts:234](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L234)

Penalize tokens based on frequency in response (-2 to 2)

***

### presencePenalty?

> `optional` **presencePenalty**: `number`

Defined in: [core/src/provider/types.ts:236](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L236)

Penalize tokens that already appeared (-2 to 2)

***

### seed?

> `optional` **seed**: `number`

Defined in: [core/src/provider/types.ts:238](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L238)

Random seed for reproducible outputs

***

### user?

> `optional` **user**: `string`

Defined in: [core/src/provider/types.ts:240](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L240)

End-user identifier for abuse detection

***

### thinking?

> `optional` **thinking**: [`ThinkingConfig`](ThinkingConfig.md)

Defined in: [core/src/provider/types.ts:242](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L242)

Extended thinking configuration (Claude 3.5+, o1)
