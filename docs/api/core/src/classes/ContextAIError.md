[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ContextAIError

# Class: ContextAIError

Defined in: [core/src/errors/errors.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L61)

Base error class for ContextAI SDK.

All ContextAI errors extend this class and provide:
- **code**: Machine-readable error code for programmatic handling
- **severity**: Error categorization (fatal, error, warning, info)
- **troubleshootingHint**: Actionable guidance for developers
- **isRetryable**: Whether the operation might succeed on retry
- **retryAfterMs**: Suggested delay before retrying

## Example

```typescript
try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ContextAIError) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.troubleshootingHint) {
      console.error(`Hint: ${error.troubleshootingHint}`);
    }
    if (error.isRetryable) {
      await delay(error.retryAfterMs ?? 1000);
      // retry...
    }
  }
}
```

## Extends

- `Error`

## Extended by

- [`AgentError`](AgentError.md)
- [`ToolError`](ToolError.md)
- [`ProviderError`](ProviderError.md)
- [`ValidationError`](ValidationError.md)
- [`SQLSafetyError`](SQLSafetyError.md)
- [`PathTraversalError`](PathTraversalError.md)

## Constructors

### Constructor

> **new ContextAIError**(`message`, `code`, `options?`): `ContextAIError`

Defined in: [core/src/errors/errors.ts:74](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L74)

#### Parameters

##### message

`string`

##### code

`string` = `'CONTEXTAI_ERROR'`

##### options?

`ContextAIErrorOptions`

#### Returns

`ContextAIError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: `string`

Defined in: [core/src/errors/errors.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L63)

Machine-readable error code for programmatic handling

***

### severity

> `readonly` **severity**: `ErrorSeverity`

Defined in: [core/src/errors/errors.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L66)

Error severity level

***

### docsUrl?

> `readonly` `optional` **docsUrl**: `string`

Defined in: [core/src/errors/errors.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L69)

URL to documentation for this error

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [core/src/errors/errors.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/errors/errors.ts#L72)

Underlying error that caused this one (for error chaining)

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
