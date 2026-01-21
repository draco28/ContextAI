[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-openai/src](../README.md) / OpenAIProviderError

# Class: OpenAIProviderError

Defined in: [provider-openai/src/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L32)

Error thrown by the OpenAI provider.

## Example

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error instanceof OpenAIProviderError) {
    if (error.code === 'OPENAI_RATE_LIMIT') {
      // Wait and retry
    }
  }
}
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new OpenAIProviderError**(`message`, `code`, `options?`): `OpenAIProviderError`

Defined in: [provider-openai/src/errors.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L38)

#### Parameters

##### message

`string`

##### code

[`OpenAIErrorCode`](../type-aliases/OpenAIErrorCode.md)

##### options?

###### cause?

`Error`

###### statusCode?

`number`

###### requestId?

`string`

#### Returns

`OpenAIProviderError`

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

> `readonly` **code**: [`OpenAIErrorCode`](../type-aliases/OpenAIErrorCode.md)

Defined in: [provider-openai/src/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L33)

Machine-readable error code for programmatic handling

#### Overrides

`ContextAIError.code`

***

### statusCode?

> `readonly` `optional` **statusCode**: `number`

Defined in: [provider-openai/src/errors.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L34)

***

### requestId?

> `readonly` `optional` **requestId**: `string`

Defined in: [provider-openai/src/errors.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L35)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [provider-openai/src/errors.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L36)

Underlying error that caused this one (for error chaining)

#### Overrides

`ContextAIError.cause`

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: [provider-openai/src/errors.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L58)

Check if this error is retryable (rate limits, temporary failures).

##### Returns

`boolean`

#### Overrides

`ContextAIError.isRetryable`

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: [provider-openai/src/errors.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L75)

Suggested delay before retrying (in milliseconds).

Returns appropriate delays based on error type:
- Rate limits: 60 seconds (API typically resets in ~1 min)
- Timeouts/connection: 5 seconds
- Server errors (5xx): 10 seconds

##### Returns

`number`

#### Overrides

`ContextAIError.retryAfterMs`

***

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: [provider-openai/src/errors.ts:98](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/errors.ts#L98)

Provide actionable troubleshooting hints for OpenAI errors.

Follows the pattern established by OllamaProviderError.

##### Returns

`string`

#### Overrides

`ContextAIError.troubleshootingHint`
