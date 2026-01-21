[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / PathValidator

# Class: PathValidator

Defined in: [core/src/security/path-validator.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L92)

Validates file paths to prevent directory traversal attacks.

This class enforces path safety by:
1. Blocking ".." traversal sequences
2. Resolving symlinks (optional) and verifying targets
3. Ensuring paths stay within allowed directories
4. Checking path length limits
5. Detecting null bytes and other attack vectors

## Example

```ts
const validator = new PathValidator({
  allowedDirectories: ['/app/uploads', '/app/public'],
  followSymlinks: true,
  maxPathLength: 1024,
});

const result = await validator.validate('/app/uploads/user-file.txt');
if (result.valid) {
  // Safe to use result.normalizedPath
}
```

## Constructors

### Constructor

> **new PathValidator**(`options`): `PathValidator`

Defined in: [core/src/security/path-validator.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L97)

#### Parameters

##### options

[`PathValidatorOptions`](../interfaces/PathValidatorOptions.md)

#### Returns

`PathValidator`

## Methods

### normalize()

> **normalize**(`inputPath`): `string`

Defined in: [core/src/security/path-validator.ts:123](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L123)

Normalize a path without validation.
Resolves to absolute and removes redundant segments.

#### Parameters

##### inputPath

`string`

#### Returns

`string`

***

### isAllowed()

> **isAllowed**(`inputPath`): `boolean`

Defined in: [core/src/security/path-validator.ts:133](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L133)

Quick sync check if path MIGHT be allowed (no symlink resolution).
Use validate() for complete validation including symlinks.

#### Parameters

##### inputPath

`string`

#### Returns

`boolean`

***

### getBasePath()

> **getBasePath**(`inputPath`): `string`

Defined in: [core/src/security/path-validator.ts:145](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L145)

Get the allowed base directory that contains this path, or null.

#### Parameters

##### inputPath

`string`

#### Returns

`string`

***

### validateSync()

> **validateSync**(`inputPath`): [`PathValidationResult`](../interfaces/PathValidationResult.md)

Defined in: [core/src/security/path-validator.ts:165](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L165)

Synchronous validation (no symlink resolution).
Use this for fast checks when symlink verification isn't needed.

#### Parameters

##### inputPath

`string`

#### Returns

[`PathValidationResult`](../interfaces/PathValidationResult.md)

***

### validate()

> **validate**(`inputPath`): `Promise`\<[`PathValidationResult`](../interfaces/PathValidationResult.md)\>

Defined in: [core/src/security/path-validator.ts:241](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L241)

Full async validation including symlink resolution.

#### Parameters

##### inputPath

`string`

#### Returns

`Promise`\<[`PathValidationResult`](../interfaces/PathValidationResult.md)\>
