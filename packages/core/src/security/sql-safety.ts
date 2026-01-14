import { SQLSafetyError } from './errors';

// ============================================================================
// Types
// ============================================================================

/** Supported comparison operators for WHERE clauses */
export type WhereOperator =
  | '='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | 'LIKE'
  | 'ILIKE'
  | 'IN';

/** Sort direction for ORDER BY */
export type OrderDirection = 'ASC' | 'DESC';

/** A single WHERE condition */
export interface WhereCondition {
  column: string;
  operator: WhereOperator;
  value: unknown;
}

/** Result of building a query */
export interface QueryResult {
  /** The SQL text with $1, $2, etc. placeholders */
  text: string;
  /** The values to bind to the placeholders */
  values: unknown[];
}

// ============================================================================
// Identifier Validation & Escaping
// ============================================================================

/**
 * PostgreSQL identifier rules:
 * - Must start with letter (a-z) or underscore
 * - Can contain letters, digits, underscores
 * - Max length 63 bytes (we use 63 chars for simplicity)
 * - Cannot be empty
 */
const VALID_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const MAX_IDENTIFIER_LENGTH = 63;

/**
 * Validates that a string is a safe SQL identifier.
 *
 * Returns true if the identifier:
 * - Starts with a letter or underscore
 * - Contains only letters, digits, underscores
 * - Is not empty and not too long
 *
 * @example
 * isValidIdentifier('users')        // true
 * isValidIdentifier('user_table')   // true
 * isValidIdentifier('123users')     // false (starts with digit)
 * isValidIdentifier('users; DROP')  // false (contains invalid chars)
 */
export function isValidIdentifier(name: string): boolean {
  if (!name || name.length > MAX_IDENTIFIER_LENGTH) {
    return false;
  }
  return VALID_IDENTIFIER_PATTERN.test(name);
}

/**
 * Escapes an identifier for safe use in SQL queries.
 *
 * PostgreSQL uses double-quote escaping:
 * - Wrap identifier in double quotes
 * - Double any internal quotes: " -> ""
 *
 * @throws {SQLSafetyError} If identifier is empty or too long
 *
 * @example
 * escapeIdentifier('users')        // '"users"'
 * escapeIdentifier('user"name')    // '"user""name"'
 * escapeIdentifier('SELECT')       // '"SELECT"' (safe even for reserved words)
 */
export function escapeIdentifier(name: string): string {
  if (!name) {
    throw new SQLSafetyError('Identifier cannot be empty', name);
  }
  if (name.length > MAX_IDENTIFIER_LENGTH) {
    throw new SQLSafetyError(
      `Identifier exceeds maximum length of ${MAX_IDENTIFIER_LENGTH} characters`,
      name
    );
  }

  // Double any internal quotes and wrap in double quotes
  const escaped = name.replace(/"/g, '""');
  return `"${escaped}"`;
}

// ============================================================================
// Safe Query Builder
// ============================================================================

/**
 * Builds SQL queries using ONLY parameterized statements.
 *
 * This class enforces SQL safety by:
 * 1. Never interpolating values into SQL text
 * 2. Using $1, $2, etc. placeholders for all values
 * 3. Escaping all identifiers (table/column names)
 *
 * @example
 * const query = new SafeQueryBuilder()
 *   .select(['id', 'name', 'email'])
 *   .from('users')
 *   .where([{ column: 'status', operator: '=', value: 'active' }])
 *   .orderBy('created_at', 'DESC')
 *   .limit(10)
 *   .build();
 *
 * // query.text: 'SELECT "id", "name", "email" FROM "users" WHERE "status" = $1 ORDER BY "created_at" DESC LIMIT $2'
 * // query.values: ['active', 10]
 */
export class SafeQueryBuilder {
  private _columns: string[] = [];
  private _table: string = '';
  private _conditions: WhereCondition[] = [];
  private _orderColumn: string | null = null;
  private _orderDirection: OrderDirection = 'ASC';
  private _limitValue: number | null = null;
  private _offsetValue: number | null = null;

  /**
   * Specify columns to select.
   * Use ['*'] for all columns (though explicit columns are preferred).
   */
  select = (columns: string[]): this => {
    this._columns = columns;
    return this;
  };

  /**
   * Specify the table to query from.
   */
  from = (table: string): this => {
    this._table = table;
    return this;
  };

  /**
   * Add WHERE conditions (combined with AND).
   */
  where = (conditions: WhereCondition[]): this => {
    this._conditions = conditions;
    return this;
  };

  /**
   * Add ORDER BY clause.
   */
  orderBy = (column: string, direction: OrderDirection = 'ASC'): this => {
    this._orderColumn = column;
    this._orderDirection = direction;
    return this;
  };

  /**
   * Add LIMIT clause.
   */
  limit = (n: number): this => {
    this._limitValue = n;
    return this;
  };

  /**
   * Add OFFSET clause.
   */
  offset = (n: number): this => {
    this._offsetValue = n;
    return this;
  };

  /**
   * Build the final query with parameterized values.
   *
   * @throws {SQLSafetyError} If table or columns not specified
   * @returns Object with `text` (SQL string) and `values` (parameters)
   */
  build = (): QueryResult => {
    if (!this._table) {
      throw new SQLSafetyError(
        'Table name is required. Call .from() before .build()'
      );
    }
    if (this._columns.length === 0) {
      throw new SQLSafetyError(
        'Columns are required. Call .select() before .build()'
      );
    }

    const values: unknown[] = [];
    let paramIndex = 1;

    // SELECT clause - escape all column names (except *)
    const columnList = this._columns
      .map((col) => (col === '*' ? '*' : escapeIdentifier(col)))
      .join(', ');

    // FROM clause - escape table name
    const tableEscaped = escapeIdentifier(this._table);

    let text = `SELECT ${columnList} FROM ${tableEscaped}`;

    // WHERE clause - parameterize all values
    if (this._conditions.length > 0) {
      const whereClauses = this._conditions.map((cond) => {
        const colEscaped = escapeIdentifier(cond.column);

        if (cond.operator === 'IN') {
          // IN operator: value must be an array
          const arr = Array.isArray(cond.value) ? cond.value : [cond.value];
          const placeholders = arr.map(() => `$${paramIndex++}`).join(', ');
          values.push(...arr);
          return `${colEscaped} IN (${placeholders})`;
        }

        // Standard operators
        values.push(cond.value);
        return `${colEscaped} ${cond.operator} $${paramIndex++}`;
      });

      text += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // ORDER BY clause - escape column name, direction is type-safe
    if (this._orderColumn) {
      text += ` ORDER BY ${escapeIdentifier(this._orderColumn)} ${this._orderDirection}`;
    }

    // LIMIT clause - parameterized
    if (this._limitValue !== null) {
      values.push(this._limitValue);
      text += ` LIMIT $${paramIndex++}`;
    }

    // OFFSET clause - parameterized
    if (this._offsetValue !== null) {
      values.push(this._offsetValue);
      text += ` OFFSET $${paramIndex++}`;
    }

    return { text, values };
  };
}
