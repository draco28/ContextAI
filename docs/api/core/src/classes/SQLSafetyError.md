[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / SQLSafetyError

# Class: SQLSafetyError

Defined in: [core/src/security/errors.ts:11](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/errors.ts#L11)

SQL safety errors

Thrown when:
- Invalid SQL identifier detected (injection attempt)
- Query builder used incorrectly
- Unsafe input detected during validation

## Extends

- [`ContextAIError`](ContextAIError.md)

## Constructors

### Constructor

> **new SQLSafetyError**(`message`, `unsafeInput?`): `SQLSafetyError`

Defined in: [core/src/security/errors.ts:15](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/errors.ts#L15)

#### Parameters

##### message

`string`

##### unsafeInput?

`string`

#### Returns

`SQLSafetyError`

#### Overrides

[`ContextAIError`](ContextAIError.md).[`constructor`](ContextAIError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/errors.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L63)

Machine-readable error code for programmatic handling

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`code`](ContextAIError.md#code)

***

### severity

> `readonly` **severity**: `ErrorSeverity`

Defined in: [core/src/errors/errors.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L66)

Error severity level

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`severity`](ContextAIError.md#severity)

***

### docsUrl?

> `readonly` `optional` **docsUrl**: `string`

Defined in: [core/src/errors/errors.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L69)

URL to documentation for this error

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`docsUrl`](ContextAIError.md#docsurl)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [core/src/errors/errors.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L72)

Underlying error that caused this one (for error chaining)

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`cause`](ContextAIError.md#cause)

***

### unsafeInput?

> `readonly` `optional` **unsafeInput**: `string`

Defined in: [core/src/security/errors.ts:13](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/errors.ts#L13)

The unsafe input that triggered this error

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: [core/src/errors/errors.ts:96](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L96)

Whether this error is transient and the operation could succeed if retried.

Override in subclasses to provide specific retry logic.
Examples of retryable errors: rate limits, timeouts, network issues.

##### Returns

`boolean`

`true` if the error is retryable, `false` otherwise

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`isRetryable`](ContextAIError.md#isretryable)

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: [core/src/errors/errors.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L108)

Suggested delay in milliseconds before retrying the operation.

Override in subclasses to provide specific retry delays.
Only meaningful when `isRetryable` returns `true`.

##### Returns

`number`

Delay in ms, or `null` if not retryable

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`retryAfterMs`](ContextAIError.md#retryafterms)

***

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: [core/src/errors/errors.ts:120](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L120)

User-friendly troubleshooting hint with actionable guidance.

Override in subclasses to provide specific troubleshooting steps.
Should explain what went wrong and how to fix it.

##### Returns

`string`

Troubleshooting hint, or `null` if not available

#### Inherited from

[`ContextAIError`](ContextAIError.md).[`troubleshootingHint`](ContextAIError.md#troubleshootinghint)
