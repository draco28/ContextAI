[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / isValidIdentifier

# Function: isValidIdentifier()

> **isValidIdentifier**(`name`): `boolean`

Defined in: [core/src/security/sql-safety.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L65)

Validates that a string is a safe SQL identifier.

Returns true if the identifier:
- Starts with a letter or underscore
- Contains only letters, digits, underscores
- Is not empty and not too long

## Parameters

### name

`string`

## Returns

`boolean`

## Example

```ts
isValidIdentifier('users')        // true
isValidIdentifier('user_table')   // true
isValidIdentifier('123users')     // false (starts with digit)
isValidIdentifier('users; DROP')  // false (contains invalid chars)
```
