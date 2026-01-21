[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RetrieverError

# Class: RetrieverError

Defined in: [rag/src/retrieval/errors.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L25)

Error thrown when retrieval operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw RetrieverError.invalidQuery('HybridRetriever', 'Query cannot be empty');

// Direct construction
throw new RetrieverError(
  'Custom error message',
  'RETRIEVAL_FAILED',
  'MyRetriever',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new RetrieverError**(`message`, `code`, `retrieverName`, `cause?`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L33)

#### Parameters

##### message

`string`

##### code

[`RetrieverErrorCode`](../type-aliases/RetrieverErrorCode.md)

##### retrieverName

`string`

##### cause?

`Error`

#### Returns

`RetrieverError`

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

> `readonly` **code**: [`RetrieverErrorCode`](../type-aliases/RetrieverErrorCode.md)

Defined in: [rag/src/retrieval/errors.ts:27](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L27)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### retrieverName

> `readonly` **retrieverName**: `string`

Defined in: [rag/src/retrieval/errors.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L29)

Name of the retriever that failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/retrieval/errors.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L31)

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

> **toDetails**(): [`RetrieverErrorDetails`](../interfaces/RetrieverErrorDetails.md)

Defined in: [rag/src/retrieval/errors.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L49)

Get error details as a structured object.

#### Returns

[`RetrieverErrorDetails`](../interfaces/RetrieverErrorDetails.md)

***

### invalidQuery()

> `static` **invalidQuery**(`retrieverName`, `reason`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L60)

Create an error for invalid query.

#### Parameters

##### retrieverName

`string`

##### reason

`string`

#### Returns

`RetrieverError`

***

### retrievalFailed()

> `static` **retrievalFailed**(`retrieverName`, `reason`, `cause?`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:74](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L74)

Create an error for retrieval failure.

#### Parameters

##### retrieverName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RetrieverError`

***

### configError()

> `static` **configError**(`retrieverName`, `reason`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:90](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L90)

Create an error for configuration issues.

#### Parameters

##### retrieverName

`string`

##### reason

`string`

#### Returns

`RetrieverError`

***

### indexNotBuilt()

> `static` **indexNotBuilt**(`retrieverName`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:104](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L104)

Create an error for index not built.

#### Parameters

##### retrieverName

`string`

#### Returns

`RetrieverError`

***

### embeddingFailed()

> `static` **embeddingFailed**(`retrieverName`, `reason`, `cause?`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L115)

Create an error for embedding failure.

#### Parameters

##### retrieverName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RetrieverError`

***

### storeError()

> `static` **storeError**(`retrieverName`, `reason`, `cause?`): `RetrieverError`

Defined in: [rag/src/retrieval/errors.ts:131](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/retrieval/errors.ts#L131)

Create an error for underlying store failure.

#### Parameters

##### retrieverName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RetrieverError`
