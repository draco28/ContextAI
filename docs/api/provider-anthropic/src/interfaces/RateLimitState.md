[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / RateLimitState

# Interface: RateLimitState

Defined in: [provider-anthropic/src/types.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L75)

Tracks rate limit information from Anthropic response headers.

Anthropic returns these headers:
- anthropic-ratelimit-requests-limit
- anthropic-ratelimit-requests-remaining
- anthropic-ratelimit-requests-reset
- anthropic-ratelimit-tokens-limit
- anthropic-ratelimit-tokens-remaining
- anthropic-ratelimit-tokens-reset

## Properties

### requestsLimit

> **requestsLimit**: `number`

Defined in: [provider-anthropic/src/types.ts:77](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L77)

Maximum requests allowed in the current window

***

### requestsRemaining

> **requestsRemaining**: `number`

Defined in: [provider-anthropic/src/types.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L79)

Remaining requests in the current window

***

### requestsResetAt

> **requestsResetAt**: `number`

Defined in: [provider-anthropic/src/types.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L81)

When the request limit resets (Unix timestamp ms)

***

### tokensLimit

> **tokensLimit**: `number`

Defined in: [provider-anthropic/src/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L83)

Maximum tokens allowed in the current window

***

### tokensRemaining

> **tokensRemaining**: `number`

Defined in: [provider-anthropic/src/types.ts:85](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L85)

Remaining tokens in the current window

***

### tokensResetAt

> **tokensResetAt**: `number`

Defined in: [provider-anthropic/src/types.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L87)

When the token limit resets (Unix timestamp ms)
