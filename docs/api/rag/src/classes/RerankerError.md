[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RerankerError

# Class: RerankerError

Defined in: [rag/src/reranker/errors.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L28)

Error thrown when reranking operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw RerankerError.modelLoadFailed('BGEReranker', 'Model not found');

// Direct construction
throw new RerankerError(
  'Custom error message',
  'RERANKING_FAILED',
  'MyReranker',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new RerankerError**(`message`, `code`, `rerankerName`, `cause?`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L36)

#### Parameters

##### message

`string`

##### code

[`RerankerErrorCode`](../type-aliases/RerankerErrorCode.md)

##### rerankerName

`string`

##### cause?

`Error`

#### Returns

`RerankerError`

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

> `readonly` **code**: [`RerankerErrorCode`](../type-aliases/RerankerErrorCode.md)

Defined in: [rag/src/reranker/errors.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L30)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### rerankerName

> `readonly` **rerankerName**: `string`

Defined in: [rag/src/reranker/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L32)

Name of the reranker that failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/reranker/errors.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L34)

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

> **toDetails**(): [`RerankerErrorDetails`](../interfaces/RerankerErrorDetails.md)

Defined in: [rag/src/reranker/errors.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L52)

Get error details as a structured object.

#### Returns

[`RerankerErrorDetails`](../interfaces/RerankerErrorDetails.md)

***

### modelLoadFailed()

> `static` **modelLoadFailed**(`rerankerName`, `reason`, `cause?`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L68)

Create an error for model loading failure.
Used when BGE or other ML models fail to initialize.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RerankerError`

***

### rerankingFailed()

> `static` **rerankingFailed**(`rerankerName`, `reason`, `cause?`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:84](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L84)

Create an error for reranking operation failure.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RerankerError`

***

### invalidInput()

> `static` **invalidInput**(`rerankerName`, `reason`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:100](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L100)

Create an error for invalid input.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

#### Returns

`RerankerError`

***

### configError()

> `static` **configError**(`rerankerName`, `reason`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L111)

Create an error for configuration issues.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

#### Returns

`RerankerError`

***

### llmError()

> `static` **llmError**(`rerankerName`, `reason`, `cause?`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L123)

Create an error for LLM-related failures.
Used by LLMReranker when the underlying LLM fails.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RerankerError`

***

### embeddingRequired()

> `static` **embeddingRequired**(`rerankerName`, `reason`): `RerankerError`

Defined in: [rag/src/reranker/errors.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/errors.ts#L140)

Create an error when embeddings are required but not available.
Used by MMR reranker when results lack embeddings.

#### Parameters

##### rerankerName

`string`

##### reason

`string`

#### Returns

`RerankerError`
