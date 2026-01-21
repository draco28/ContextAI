[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LoaderError

# Class: LoaderError

Defined in: [rag/src/loaders/errors.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L22)

Error thrown when document loading fails.

## Example

```typescript
throw new LoaderError(
  'Failed to parse markdown',
  'PARSE_ERROR',
  'MarkdownLoader',
  '/docs/readme.md',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new LoaderError**(`message`, `code`, `loaderName`, `source`, `cause?`): `LoaderError`

Defined in: [rag/src/loaders/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L32)

#### Parameters

##### message

`string`

##### code

[`LoaderErrorCode`](../type-aliases/LoaderErrorCode.md)

##### loaderName

`string`

##### source

`string`

##### cause?

`Error`

#### Returns

`LoaderError`

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

> `readonly` **code**: [`LoaderErrorCode`](../type-aliases/LoaderErrorCode.md)

Defined in: [rag/src/loaders/errors.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L24)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### loaderName

> `readonly` **loaderName**: `string`

Defined in: [rag/src/loaders/errors.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L26)

Name of the loader that failed

***

### source

> `readonly` **source**: `string`

Defined in: [rag/src/loaders/errors.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L28)

Source that was being loaded

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/loaders/errors.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L30)

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

> **toDetails**(): [`LoaderErrorDetails`](../interfaces/LoaderErrorDetails.md)

Defined in: [rag/src/loaders/errors.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/errors.ts#L50)

Get error details as a structured object.

#### Returns

[`LoaderErrorDetails`](../interfaces/LoaderErrorDetails.md)
