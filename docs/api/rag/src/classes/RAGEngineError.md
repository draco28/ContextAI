[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RAGEngineError

# Class: RAGEngineError

Defined in: [rag/src/engine/errors.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L29)

Error thrown when RAG engine operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw RAGEngineError.retrievalFailed('RAGEngine', 'No results found');

// Direct construction
throw new RAGEngineError(
  'Custom error message',
  'RETRIEVAL_FAILED',
  'MyEngine',
  'retrieval',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new RAGEngineError**(`message`, `code`, `engineName`, `stage?`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L44)

#### Parameters

##### message

`string`

##### code

[`RAGEngineErrorCode`](../type-aliases/RAGEngineErrorCode.md)

##### engineName

`string`

##### stage?

`"enhancement"` | `"retrieval"` | `"reranking"` | `"assembly"` | `"cache"`

##### cause?

`Error`

#### Returns

`RAGEngineError`

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

> `readonly` **code**: [`RAGEngineErrorCode`](../type-aliases/RAGEngineErrorCode.md)

Defined in: [rag/src/engine/errors.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L31)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### engineName

> `readonly` **engineName**: `string`

Defined in: [rag/src/engine/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L33)

Name of the engine that failed

***

### stage?

> `readonly` `optional` **stage**: `"enhancement"` \| `"retrieval"` \| `"reranking"` \| `"assembly"` \| `"cache"`

Defined in: [rag/src/engine/errors.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L35)

Which pipeline stage failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/engine/errors.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L42)

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

> **toDetails**(): [`RAGEngineErrorDetails`](../interfaces/RAGEngineErrorDetails.md)

Defined in: [rag/src/engine/errors.ts:62](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L62)

Get error details as a structured object.

#### Returns

[`RAGEngineErrorDetails`](../interfaces/RAGEngineErrorDetails.md)

***

### invalidQuery()

> `static` **invalidQuery**(`engineName`, `reason`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L78)

Create an error for invalid query input.

#### Parameters

##### engineName

`string`

##### reason

`string`

#### Returns

`RAGEngineError`

***

### enhancementFailed()

> `static` **enhancementFailed**(`engineName`, `reason`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:89](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L89)

Create an error for query enhancement failures.

#### Parameters

##### engineName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RAGEngineError`

***

### retrievalFailed()

> `static` **retrievalFailed**(`engineName`, `reason`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:106](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L106)

Create an error for retrieval failures.

#### Parameters

##### engineName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RAGEngineError`

***

### rerankingFailed()

> `static` **rerankingFailed**(`engineName`, `reason`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L123)

Create an error for reranking failures.

#### Parameters

##### engineName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RAGEngineError`

***

### assemblyFailed()

> `static` **assemblyFailed**(`engineName`, `reason`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L140)

Create an error for assembly failures.

#### Parameters

##### engineName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RAGEngineError`

***

### cacheError()

> `static` **cacheError**(`engineName`, `reason`, `cause?`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:157](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L157)

Create an error for cache-related failures.

#### Parameters

##### engineName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`RAGEngineError`

***

### configError()

> `static` **configError**(`engineName`, `reason`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:174](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L174)

Create an error for configuration issues.

#### Parameters

##### engineName

`string`

##### reason

`string`

#### Returns

`RAGEngineError`

***

### aborted()

> `static` **aborted**(`engineName`, `stage`): `RAGEngineError`

Defined in: [rag/src/engine/errors.ts:185](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/engine/errors.ts#L185)

Create an error for aborted operations.

#### Parameters

##### engineName

`string`

##### stage

`"enhancement"` | `"retrieval"` | `"reranking"` | `"assembly"`

#### Returns

`RAGEngineError`
