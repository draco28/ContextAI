[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapAnthropicError

# Function: mapAnthropicError()

> **mapAnthropicError**(`error`): [`AnthropicProviderError`](../classes/AnthropicProviderError.md)

Defined in: [provider-anthropic/src/errors.ts:125](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L125)

Maps Anthropic SDK errors to our standardized error type.

The Anthropic SDK throws errors with this structure:
- status: HTTP status code
- message: Error message
- error: { type: string, message: string }
- headers: Response headers (including request ID)

## Parameters

### error

`unknown`

The error from the Anthropic SDK

## Returns

[`AnthropicProviderError`](../classes/AnthropicProviderError.md)

A standardized AnthropicProviderError
