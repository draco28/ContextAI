[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / RateLimitInfo

# Interface: RateLimitInfo

Defined in: [core/src/provider/types.ts:180](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L180)

Rate limit information from provider

## Properties

### requestsRemaining?

> `optional` **requestsRemaining**: `number`

Defined in: [core/src/provider/types.ts:182](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L182)

Remaining requests in current window

***

### tokensRemaining?

> `optional` **tokensRemaining**: `number`

Defined in: [core/src/provider/types.ts:184](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L184)

Remaining tokens in current window

***

### resetAt?

> `optional` **resetAt**: `number`

Defined in: [core/src/provider/types.ts:186](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L186)

Unix timestamp when limits reset

***

### windowSeconds?

> `optional` **windowSeconds**: `number`

Defined in: [core/src/provider/types.ts:188](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L188)

Window duration in seconds
