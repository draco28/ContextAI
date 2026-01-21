[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / PathValidationResult

# Interface: PathValidationResult

Defined in: [core/src/security/path-validator.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L48)

Result of path validation

## Properties

### valid

> **valid**: `boolean`

Defined in: [core/src/security/path-validator.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L50)

Whether the path is valid and safe

***

### normalizedPath?

> `optional` **normalizedPath**: `string`

Defined in: [core/src/security/path-validator.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L52)

The normalized, resolved path (only if valid)

***

### error?

> `optional` **error**: `string`

Defined in: [core/src/security/path-validator.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L54)

Human-readable error message (only if invalid)

***

### blockedReason?

> `optional` **blockedReason**: [`BlockedReason`](../type-aliases/BlockedReason.md)

Defined in: [core/src/security/path-validator.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L56)

Machine-readable reason for blocking (only if invalid)
