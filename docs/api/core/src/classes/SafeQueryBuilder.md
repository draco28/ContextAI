[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / SafeQueryBuilder

# Class: SafeQueryBuilder

Defined in: [core/src/security/sql-safety.ts:126](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L126)

Builds SQL queries using ONLY parameterized statements.

This class enforces SQL safety by:
1. Never interpolating values into SQL text
2. Using $1, $2, etc. placeholders for all values
3. Escaping all identifiers (table/column names)

## Example

```ts
const query = new SafeQueryBuilder()
  .select(['id', 'name', 'email'])
  .from('users')
  .where([{ column: 'status', operator: '=', value: 'active' }])
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

// query.text: 'SELECT "id", "name", "email" FROM "users" WHERE "status" = $1 ORDER BY "created_at" DESC LIMIT $2'
// query.values: ['active', 10]
```

## Constructors

### Constructor

> **new SafeQueryBuilder**(): `SafeQueryBuilder`

#### Returns

`SafeQueryBuilder`

## Methods

### select()

> **select**(`columns`): `this`

Defined in: [core/src/security/sql-safety.ts:139](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L139)

Specify columns to select.
Use ['*'] for all columns (though explicit columns are preferred).

#### Parameters

##### columns

`string`[]

#### Returns

`this`

***

### from()

> **from**(`table`): `this`

Defined in: [core/src/security/sql-safety.ts:147](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L147)

Specify the table to query from.

#### Parameters

##### table

`string`

#### Returns

`this`

***

### where()

> **where**(`conditions`): `this`

Defined in: [core/src/security/sql-safety.ts:155](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L155)

Add WHERE conditions (combined with AND).

#### Parameters

##### conditions

[`WhereCondition`](../interfaces/WhereCondition.md)[]

#### Returns

`this`

***

### orderBy()

> **orderBy**(`column`, `direction`): `this`

Defined in: [core/src/security/sql-safety.ts:163](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L163)

Add ORDER BY clause.

#### Parameters

##### column

`string`

##### direction

[`OrderDirection`](../type-aliases/OrderDirection.md) = `'ASC'`

#### Returns

`this`

***

### limit()

> **limit**(`n`): `this`

Defined in: [core/src/security/sql-safety.ts:172](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L172)

Add LIMIT clause.

#### Parameters

##### n

`number`

#### Returns

`this`

***

### offset()

> **offset**(`n`): `this`

Defined in: [core/src/security/sql-safety.ts:180](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L180)

Add OFFSET clause.

#### Parameters

##### n

`number`

#### Returns

`this`

***

### build()

> **build**(): [`QueryResult`](../interfaces/QueryResult.md)

Defined in: [core/src/security/sql-safety.ts:191](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/security/sql-safety.ts#L191)

Build the final query with parameterized values.

#### Returns

[`QueryResult`](../interfaces/QueryResult.md)

Object with `text` (SQL string) and `values` (parameters)

#### Throws

If table or columns not specified
