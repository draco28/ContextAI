[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / QueryEnhancementError

# Class: QueryEnhancementError

Defined in: [rag/src/query-enhancement/errors.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L31)

Error thrown when query enhancement operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw QueryEnhancementError.llmError('QueryRewriter', 'API rate limit');

// Direct construction
throw new QueryEnhancementError(
  'Custom error message',
  'LLM_ERROR',
  'MyEnhancer',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new QueryEnhancementError**(`message`, `code`, `enhancerName`, `cause?`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L39)

#### Parameters

##### message

`string`

##### code

[`QueryEnhancementErrorCode`](../type-aliases/QueryEnhancementErrorCode.md)

##### enhancerName

`string`

##### cause?

`Error`

#### Returns

`QueryEnhancementError`

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

> `readonly` **code**: [`QueryEnhancementErrorCode`](../type-aliases/QueryEnhancementErrorCode.md)

Defined in: [rag/src/query-enhancement/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L33)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### enhancerName

> `readonly` **enhancerName**: `string`

Defined in: [rag/src/query-enhancement/errors.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L35)

Name of the enhancer that failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/query-enhancement/errors.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L37)

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

> **toDetails**(): [`QueryEnhancementErrorDetails`](../interfaces/QueryEnhancementErrorDetails.md)

Defined in: [rag/src/query-enhancement/errors.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L55)

Get error details as a structured object.

#### Returns

[`QueryEnhancementErrorDetails`](../interfaces/QueryEnhancementErrorDetails.md)

***

### llmError()

> `static` **llmError**(`enhancerName`, `reason`, `cause?`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L71)

Create an error for LLM-related failures.
Used when the underlying LLM call fails.

#### Parameters

##### enhancerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`QueryEnhancementError`

***

### embeddingError()

> `static` **embeddingError**(`enhancerName`, `reason`, `cause?`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:88](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L88)

Create an error for embedding-related failures.
Used when embedding generation fails (HyDE).

#### Parameters

##### enhancerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`QueryEnhancementError`

***

### invalidInput()

> `static` **invalidInput**(`enhancerName`, `reason`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:105](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L105)

Create an error for invalid input.
Used when query validation fails.

#### Parameters

##### enhancerName

`string`

##### reason

`string`

#### Returns

`QueryEnhancementError`

***

### configError()

> `static` **configError**(`enhancerName`, `reason`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:120](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L120)

Create an error for configuration issues.
Used when enhancer is misconfigured.

#### Parameters

##### enhancerName

`string`

##### reason

`string`

#### Returns

`QueryEnhancementError`

***

### parseError()

> `static` **parseError**(`enhancerName`, `reason`, `cause?`): `QueryEnhancementError`

Defined in: [rag/src/query-enhancement/errors.ts:135](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/errors.ts#L135)

Create an error for response parsing failures.
Used when LLM response cannot be parsed.

#### Parameters

##### enhancerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`QueryEnhancementError`
