[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / escapeIdentifier

# Function: escapeIdentifier()

> **escapeIdentifier**(`name`): `string`

Defined in: [core/src/security/sql-safety.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L86)

Escapes an identifier for safe use in SQL queries.

PostgreSQL uses double-quote escaping:
- Wrap identifier in double quotes
- Double any internal quotes: " -> ""

## Parameters

### name

`string`

## Returns

`string`

## Throws

If identifier is empty or too long

## Example

```ts
escapeIdentifier('users')        // '"users"'
escapeIdentifier('user"name')    // '"user""name"'
escapeIdentifier('SELECT')       // '"SELECT"' (safe even for reserved words)
```
