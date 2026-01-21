[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-ollama/src](../README.md) / OllamaProviderError

# Class: OllamaProviderError

Defined in: [provider-ollama/src/errors.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L36)

Error class for Ollama provider failures.

Extends ContextAIError to integrate with the SDK's error handling.
Provides Ollama-specific context like connection status.

## Example

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error instanceof OllamaProviderError) {
    if (error.code === 'OLLAMA_CONNECTION_ERROR') {
      console.log('Is Ollama running? Try: ollama serve');
    }
    console.error(`Ollama error [${error.code}]: ${error.message}`);
  }
}
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new OllamaProviderError**(`message`, `code`, `options?`): `OllamaProviderError`

Defined in: [provider-ollama/src/errors.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L45)

#### Parameters

##### message

`string`

##### code

[`OllamaErrorCode`](../type-aliases/OllamaErrorCode.md)

##### options?

###### cause?

`Error`

###### statusCode?

`number`

#### Returns

`OllamaProviderError`

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

> `readonly` **code**: [`OllamaErrorCode`](../type-aliases/OllamaErrorCode.md)

Defined in: [provider-ollama/src/errors.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L37)

Machine-readable error code for programmatic handling

#### Overrides

`ContextAIError.code`

***

### statusCode?

> `readonly` `optional` **statusCode**: `number`

Defined in: [provider-ollama/src/errors.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L40)

HTTP status code from the API response (if available)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [provider-ollama/src/errors.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L43)

Original error that caused this one

#### Overrides

`ContextAIError.cause`

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: [provider-ollama/src/errors.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L67)

Whether this error is transient and the request could succeed if retried.

Retryable errors:
- Timeouts - model might have been loading
- Connection errors - server might be starting up

##### Returns

`boolean`

#### Overrides

`ContextAIError.isRetryable`

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: [provider-ollama/src/errors.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L78)

Suggested retry delay in milliseconds.
Returns null if the error is not retryable.

##### Returns

`number`

#### Overrides

`ContextAIError.retryAfterMs`

***

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: [provider-ollama/src/errors.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L96)

User-friendly troubleshooting hints for common errors.

##### Returns

`string`

#### Overrides

`ContextAIError.troubleshootingHint`
