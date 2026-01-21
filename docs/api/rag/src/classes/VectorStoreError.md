[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / VectorStoreError

# Class: VectorStoreError

Defined in: [rag/src/vector-store/errors.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L25)

Error thrown when vector store operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw VectorStoreError.dimensionMismatch('MyStore', 1536, 768);

// Direct construction
throw new VectorStoreError(
  'Custom error message',
  'STORE_ERROR',
  'MyStore',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new VectorStoreError**(`message`, `code`, `storeName`, `cause?`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L33)

#### Parameters

##### message

`string`

##### code

[`VectorStoreErrorCode`](../type-aliases/VectorStoreErrorCode.md)

##### storeName

`string`

##### cause?

`Error`

#### Returns

`VectorStoreError`

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

> `readonly` **code**: [`VectorStoreErrorCode`](../type-aliases/VectorStoreErrorCode.md)

Defined in: [rag/src/vector-store/errors.ts:27](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L27)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### storeName

> `readonly` **storeName**: `string`

Defined in: [rag/src/vector-store/errors.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L29)

Name of the store that failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/vector-store/errors.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L31)

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

> **toDetails**(): [`VectorStoreErrorDetails`](../interfaces/VectorStoreErrorDetails.md)

Defined in: [rag/src/vector-store/errors.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L49)

Get error details as a structured object.

#### Returns

[`VectorStoreErrorDetails`](../interfaces/VectorStoreErrorDetails.md)

***

### dimensionMismatch()

> `static` **dimensionMismatch**(`storeName`, `expected`, `received`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L60)

Create an error for dimension mismatch.

#### Parameters

##### storeName

`string`

##### expected

`number`

##### received

`number`

#### Returns

`VectorStoreError`

***

### chunkNotFound()

> `static` **chunkNotFound**(`storeName`, `ids`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:75](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L75)

Create an error for chunk not found.

#### Parameters

##### storeName

`string`

##### ids

`string`[]

#### Returns

`VectorStoreError`

***

### storeUnavailable()

> `static` **storeUnavailable**(`storeName`, `reason`, `cause?`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:88](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L88)

Create an error for store unavailable.

#### Parameters

##### storeName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`VectorStoreError`

***

### invalidQuery()

> `static` **invalidQuery**(`storeName`, `reason`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:104](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L104)

Create an error for invalid query.

#### Parameters

##### storeName

`string`

##### reason

`string`

#### Returns

`VectorStoreError`

***

### invalidFilter()

> `static` **invalidFilter**(`storeName`, `reason`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L115)

Create an error for invalid filter.

#### Parameters

##### storeName

`string`

##### reason

`string`

#### Returns

`VectorStoreError`

***

### insertFailed()

> `static` **insertFailed**(`storeName`, `reason`, `cause?`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L126)

Create an error for insert failure.

#### Parameters

##### storeName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`VectorStoreError`

***

### deleteFailed()

> `static` **deleteFailed**(`storeName`, `reason`, `cause?`): `VectorStoreError`

Defined in: [rag/src/vector-store/errors.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/errors.ts#L142)

Create an error for delete failure.

#### Parameters

##### storeName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`VectorStoreError`
