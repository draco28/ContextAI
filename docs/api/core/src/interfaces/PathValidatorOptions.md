[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / PathValidatorOptions

# Interface: PathValidatorOptions

Defined in: [core/src/security/path-validator.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L38)

Configuration options for path validation

## Properties

### allowedDirectories

> **allowedDirectories**: `string`[]

Defined in: [core/src/security/path-validator.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L40)

Whitelist of allowed base directories (must be absolute paths)

***

### followSymlinks?

> `optional` **followSymlinks**: `boolean`

Defined in: [core/src/security/path-validator.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L42)

Whether to follow and validate symlinks (default: false)

***

### maxPathLength?

> `optional` **maxPathLength**: `number`

Defined in: [core/src/security/path-validator.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L44)

Maximum allowed path length (default: 4096)
