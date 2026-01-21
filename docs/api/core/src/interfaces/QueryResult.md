[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / QueryResult

# Interface: QueryResult

Defined in: [core/src/security/sql-safety.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L30)

Result of building a query

## Properties

### text

> **text**: `string`

Defined in: [core/src/security/sql-safety.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L32)

The SQL text with $1, $2, etc. placeholders

***

### values

> **values**: `unknown`[]

Defined in: [core/src/security/sql-safety.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L34)

The values to bind to the placeholders
