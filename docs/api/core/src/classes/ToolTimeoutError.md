[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ToolTimeoutError

# Class: ToolTimeoutError

Defined in: [core/src/errors/errors.ts:172](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L172)

Tool timeout error

Thrown when:
- Tool execution exceeds configured timeout

## Extends

- [`ToolError`](ToolError.md)

## Constructors

### Constructor

> **new ToolTimeoutError**(`toolName`, `timeoutMs`): `ToolTimeoutError`

Defined in: [core/src/errors/errors.ts:175](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L175)

#### Parameters

##### toolName

`string`

##### timeoutMs

`number`

#### Returns

`ToolTimeoutError`

#### Overrides

[`ToolError`](ToolError.md).[`constructor`](ToolError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/errors.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L63)

Machine-readable error code for programmatic handling

#### Inherited from

[`ToolError`](ToolError.md).[`code`](ToolError.md#code)

***

### severity

> `readonly` **severity**: `ErrorSeverity`

Defined in: [core/src/errors/errors.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L66)

Error severity level

#### Inherited from

[`ToolError`](ToolError.md).[`severity`](ToolError.md#severity)

***

### docsUrl?

> `readonly` `optional` **docsUrl**: `string`

Defined in: [core/src/errors/errors.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L69)

URL to documentation for this error

#### Inherited from

[`ToolError`](ToolError.md).[`docsUrl`](ToolError.md#docsurl)

***

### toolName

> `readonly` **toolName**: `string`

Defined in: [core/src/errors/errors.ts:149](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L149)

#### Inherited from

[`ToolError`](ToolError.md).[`toolName`](ToolError.md#toolname)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [core/src/errors/errors.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L150)

Underlying error that caused this one (for error chaining)

#### Inherited from

[`ToolError`](ToolError.md).[`cause`](ToolError.md#cause)

***

### timeoutMs

> `readonly` **timeoutMs**: `number`

Defined in: [core/src/errors/errors.ts:173](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L173)

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: [core/src/errors/errors.ts:189](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L189)

Timeouts are typically retryable.

##### Returns

`boolean`

#### Overrides

[`ToolError`](ToolError.md).[`isRetryable`](ToolError.md#isretryable)

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: [core/src/errors/errors.ts:196](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L196)

Wait the same duration as the timeout before retrying.

##### Returns

`number`

#### Overrides

[`ToolError`](ToolError.md).[`retryAfterMs`](ToolError.md#retryafterms)

***

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: [core/src/errors/errors.ts:203](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L203)

Provide actionable guidance for timeout errors.

##### Returns

`string`

#### Overrides

[`ToolError`](ToolError.md).[`troubleshootingHint`](ToolError.md#troubleshootinghint)
