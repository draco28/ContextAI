[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / AnthropicProviderError

# Class: AnthropicProviderError

Defined in: [provider-anthropic/src/errors.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L39)

Error class for Anthropic provider failures.

Extends ContextAIError to integrate with the SDK's error handling.
Provides additional context like HTTP status codes and request IDs.

## Example

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error instanceof AnthropicProviderError) {
    if (error.isRetryable) {
      // Implement retry logic
    }
    console.error(`Anthropic error [${error.code}]: ${error.message}`);
  }
}
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new AnthropicProviderError**(`message`, `code`, `options?`): `AnthropicProviderError`

Defined in: [provider-anthropic/src/errors.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L51)

#### Parameters

##### message

`string`

##### code

[`AnthropicErrorCode`](../type-aliases/AnthropicErrorCode.md)

##### options?

###### cause?

`Error`

###### statusCode?

`number`

###### requestId?

`string`

#### Returns

`AnthropicProviderError`

#### Overrides

`ContextAIError.constructor`

## Properties

### severity

> `readonly` **severity**: `ErrorSeverity`

Defined in: core/dist/index.d.ts:1164

Error severity level

#### Inherited from

`ContextAIError.severity`

***

### docsUrl?

> `readonly` `optional` **docsUrl**: `string`

Defined in: core/dist/index.d.ts:1166

URL to documentation for this error

#### Inherited from

`ContextAIError.docsUrl`

***

### code

> `readonly` **code**: [`AnthropicErrorCode`](../type-aliases/AnthropicErrorCode.md)

Defined in: [provider-anthropic/src/errors.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L40)

Machine-readable error code for programmatic handling

#### Overrides

`ContextAIError.code`

***

### statusCode?

> `readonly` `optional` **statusCode**: `number`

Defined in: [provider-anthropic/src/errors.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L43)

HTTP status code from the API response

***

### requestId?

> `readonly` `optional` **requestId**: `string`

Defined in: [provider-anthropic/src/errors.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L46)

Request ID from Anthropic (for support tickets)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [provider-anthropic/src/errors.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L49)

Original error that caused this one

#### Overrides

`ContextAIError.cause`

## Accessors

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: core/dist/index.d.ts:1196

User-friendly troubleshooting hint with actionable guidance.

Override in subclasses to provide specific troubleshooting steps.
Should explain what went wrong and how to fix it.

##### Returns

`string`

Troubleshooting hint, or `null` if not available

#### Inherited from

`ContextAIError.troubleshootingHint`

***

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: [provider-anthropic/src/errors.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L78)

Whether this error is transient and the request could succeed if retried.

Retryable errors:
- Rate limits (429) - wait and retry
- Overloaded (529) - API is busy
- Timeouts - network issues
- Connection errors - network issues
- Server errors (5xx) - transient API issues

##### Returns

`boolean`

#### Overrides

`ContextAIError.isRetryable`

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: [provider-anthropic/src/errors.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/errors.ts#L92)

Suggested retry delay in milliseconds.
Returns null if the error is not retryable.

##### Returns

`number`

#### Overrides

`ContextAIError.retryAfterMs`
