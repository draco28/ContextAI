[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / validatePath

# Function: validatePath()

> **validatePath**(`inputPath`, `options`): `Promise`\<[`PathValidationResult`](../interfaces/PathValidationResult.md)\>

Defined in: [core/src/security/path-validator.ts:319](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/path-validator.ts#L319)

Validate a path against the given options.
Convenience function for one-off validation.

## Parameters

### inputPath

`string`

### options

[`PathValidatorOptions`](../interfaces/PathValidatorOptions.md)

## Returns

`Promise`\<[`PathValidationResult`](../interfaces/PathValidationResult.md)\>

## Example

```ts
const result = await validatePath('/uploads/file.txt', {
  allowedDirectories: ['/uploads'],
});
```
