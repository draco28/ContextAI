[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EmbeddingError

# Class: EmbeddingError

Defined in: [rag/src/embeddings/errors.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L22)

Error thrown when embedding generation fails.

## Example

```typescript
throw new EmbeddingError(
  'Rate limit exceeded',
  'RATE_LIMIT',
  'OpenAIEmbeddingProvider',
  'text-embedding-3-small',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new EmbeddingError**(`message`, `code`, `providerName`, `model`, `cause?`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L32)

#### Parameters

##### message

`string`

##### code

[`EmbeddingErrorCode`](../type-aliases/EmbeddingErrorCode.md)

##### providerName

`string`

##### model

`string`

##### cause?

`Error`

#### Returns

`EmbeddingError`

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

> `readonly` **code**: [`EmbeddingErrorCode`](../type-aliases/EmbeddingErrorCode.md)

Defined in: [rag/src/embeddings/errors.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L24)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### providerName

> `readonly` **providerName**: `string`

Defined in: [rag/src/embeddings/errors.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L26)

Name of the provider that failed

***

### model

> `readonly` **model**: `string`

Defined in: [rag/src/embeddings/errors.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L28)

Model being used

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/embeddings/errors.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L30)

Underlying cause, if any

#### Overrides

`ContextAIError.cause`

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: core/dist/index.d.ts:1178

Whether this error is transient and the operation could succeed if retried.

Override in subclasses to provide specific retry logic.
Examples of retryable errors: rate limits, timeouts, network issues.

##### Returns

`boolean`

`true` if the error is retryable, `false` otherwise

#### Inherited from

`ContextAIError.isRetryable`

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: core/dist/index.d.ts:1187

Suggested delay in milliseconds before retrying the operation.

Override in subclasses to provide specific retry delays.
Only meaningful when `isRetryable` returns `true`.

##### Returns

`number`

Delay in ms, or `null` if not retryable

#### Inherited from

`ContextAIError.retryAfterMs`

***

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

## Methods

### toDetails()

> **toDetails**(): [`EmbeddingErrorDetails`](../interfaces/EmbeddingErrorDetails.md)

Defined in: [rag/src/embeddings/errors.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L50)

Get error details as a structured object.

#### Returns

[`EmbeddingErrorDetails`](../interfaces/EmbeddingErrorDetails.md)

***

### rateLimitExceeded()

> `static` **rateLimitExceeded**(`providerName`, `model`, `cause?`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L62)

Create an error for rate limit exceeded.

#### Parameters

##### providerName

`string`

##### model

`string`

##### cause?

`Error`

#### Returns

`EmbeddingError`

***

### modelNotFound()

> `static` **modelNotFound**(`providerName`, `model`, `cause?`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L79)

Create an error for model not found.

#### Parameters

##### providerName

`string`

##### model

`string`

##### cause?

`Error`

#### Returns

`EmbeddingError`

***

### batchTooLarge()

> `static` **batchTooLarge**(`providerName`, `model`, `batchSize`, `maxBatchSize`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L96)

Create an error for batch too large.

#### Parameters

##### providerName

`string`

##### model

`string`

##### batchSize

`number`

##### maxBatchSize

`number`

#### Returns

`EmbeddingError`

***

### textTooLong()

> `static` **textTooLong**(`providerName`, `model`, `textLength`, `maxLength`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:113](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L113)

Create an error for text too long.

#### Parameters

##### providerName

`string`

##### model

`string`

##### textLength

`number`

##### maxLength

`number`

#### Returns

`EmbeddingError`

***

### emptyInput()

> `static` **emptyInput**(`providerName`, `model`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:130](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L130)

Create an error for empty input.

#### Parameters

##### providerName

`string`

##### model

`string`

#### Returns

`EmbeddingError`

***

### invalidResponse()

> `static` **invalidResponse**(`providerName`, `model`, `details`, `cause?`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L142)

Create an error for invalid response from provider.

#### Parameters

##### providerName

`string`

##### model

`string`

##### details

`string`

##### cause?

`Error`

#### Returns

`EmbeddingError`

***

### providerUnavailable()

> `static` **providerUnavailable**(`providerName`, `model`, `reason`, `cause?`): `EmbeddingError`

Defined in: [rag/src/embeddings/errors.ts:160](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/embeddings/errors.ts#L160)

Create an error for provider unavailable.

#### Parameters

##### providerName

`string`

##### model

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`EmbeddingError`
