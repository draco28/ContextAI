[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / TokenUsage

# Interface: TokenUsage

Defined in: [core/src/provider/types.ts:107](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L107)

Token usage information

## Properties

### promptTokens

> **promptTokens**: `number`

Defined in: [core/src/provider/types.ts:109](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L109)

Tokens in the prompt/input

***

### completionTokens

> **completionTokens**: `number`

Defined in: [core/src/provider/types.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L111)

Tokens in the completion/output

***

### totalTokens

> **totalTokens**: `number`

Defined in: [core/src/provider/types.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L113)

Total tokens used

***

### reasoningTokens?

> `optional` **reasoningTokens**: `number`

Defined in: [core/src/provider/types.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L115)

Tokens used for reasoning (Claude thinking, o1 reasoning)

***

### cacheReadTokens?

> `optional` **cacheReadTokens**: `number`

Defined in: [core/src/provider/types.ts:117](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L117)

Tokens read from prompt cache

***

### cacheWriteTokens?

> `optional` **cacheWriteTokens**: `number`

Defined in: [core/src/provider/types.ts:119](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L119)

Tokens written to prompt cache
