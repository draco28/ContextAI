[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AssemblyError

# Class: AssemblyError

Defined in: [rag/src/assembly/errors.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L28)

Error thrown when context assembly operations fail.

## Example

```typescript
// Using factory methods (preferred)
throw AssemblyError.invalidInput('XMLAssembler', 'Results array is empty');

// Direct construction
throw new AssemblyError(
  'Custom error message',
  'FORMATTING_FAILED',
  'MarkdownAssembler',
  originalError
);
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new AssemblyError**(`message`, `code`, `assemblerName`, `cause?`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L36)

#### Parameters

##### message

`string`

##### code

[`AssemblyErrorCode`](../type-aliases/AssemblyErrorCode.md)

##### assemblerName

`string`

##### cause?

`Error`

#### Returns

`AssemblyError`

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

> `readonly` **code**: [`AssemblyErrorCode`](../type-aliases/AssemblyErrorCode.md)

Defined in: [rag/src/assembly/errors.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L30)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### assemblerName

> `readonly` **assemblerName**: `string`

Defined in: [rag/src/assembly/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L32)

Name of the assembler that failed

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/assembly/errors.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L34)

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

> **toDetails**(): [`AssemblyErrorDetails`](../interfaces/AssemblyErrorDetails.md)

Defined in: [rag/src/assembly/errors.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L52)

Get error details as a structured object.

#### Returns

[`AssemblyErrorDetails`](../interfaces/AssemblyErrorDetails.md)

***

### invalidInput()

> `static` **invalidInput**(`assemblerName`, `reason`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:68](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L68)

Create an error for invalid input.
Used when results array is malformed or empty.

#### Parameters

##### assemblerName

`string`

##### reason

`string`

#### Returns

`AssemblyError`

***

### tokenBudgetExceeded()

> `static` **tokenBudgetExceeded**(`assemblerName`, `reason`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:80](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L80)

Create an error when token budget cannot be satisfied.
Used when even a single chunk exceeds the budget.

#### Parameters

##### assemblerName

`string`

##### reason

`string`

#### Returns

`AssemblyError`

***

### formattingFailed()

> `static` **formattingFailed**(`assemblerName`, `reason`, `cause?`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L95)

Create an error for formatting failures.
Used when XML/Markdown generation fails.

#### Parameters

##### assemblerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`AssemblyError`

***

### configError()

> `static` **configError**(`assemblerName`, `reason`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:111](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L111)

Create an error for configuration issues.

#### Parameters

##### assemblerName

`string`

##### reason

`string`

#### Returns

`AssemblyError`

***

### deduplicationFailed()

> `static` **deduplicationFailed**(`assemblerName`, `reason`, `cause?`): `AssemblyError`

Defined in: [rag/src/assembly/errors.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/errors.ts#L122)

Create an error for deduplication failures.

#### Parameters

##### assemblerName

`string`

##### reason

`string`

##### cause?

`Error`

#### Returns

`AssemblyError`
