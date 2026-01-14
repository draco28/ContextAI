import { describe, it, expect } from 'vitest';
import {
  isValidIdentifier,
  escapeIdentifier,
  SafeQueryBuilder,
  SQLSafetyError,
} from '../src';

describe('SQL Safety', () => {
  // ==========================================================================
  // isValidIdentifier
  // ==========================================================================
  describe('isValidIdentifier', () => {
    describe('valid identifiers', () => {
      it('accepts simple lowercase names', () => {
        expect(isValidIdentifier('users')).toBe(true);
        expect(isValidIdentifier('documents')).toBe(true);
      });

      it('accepts names with underscores', () => {
        expect(isValidIdentifier('user_profiles')).toBe(true);
        expect(isValidIdentifier('_private')).toBe(true);
        expect(isValidIdentifier('__dunder__')).toBe(true);
      });

      it('accepts names with numbers (not leading)', () => {
        expect(isValidIdentifier('table1')).toBe(true);
        expect(isValidIdentifier('v2_users')).toBe(true);
      });

      it('accepts uppercase and mixed case', () => {
        expect(isValidIdentifier('Users')).toBe(true);
        expect(isValidIdentifier('USER_PROFILES')).toBe(true);
        expect(isValidIdentifier('userProfile')).toBe(true);
      });
    });

    describe('invalid identifiers', () => {
      it('rejects empty string', () => {
        expect(isValidIdentifier('')).toBe(false);
      });

      it('rejects names starting with numbers', () => {
        expect(isValidIdentifier('1users')).toBe(false);
        expect(isValidIdentifier('123')).toBe(false);
      });

      it('rejects names with spaces', () => {
        expect(isValidIdentifier('user profiles')).toBe(false);
        expect(isValidIdentifier(' users')).toBe(false);
      });

      it('rejects names with special characters', () => {
        expect(isValidIdentifier('users;')).toBe(false);
        expect(isValidIdentifier('users--')).toBe(false);
        expect(isValidIdentifier("users'")).toBe(false);
        expect(isValidIdentifier('users"')).toBe(false);
        expect(isValidIdentifier('users$')).toBe(false);
      });

      it('rejects names exceeding max length (63 chars)', () => {
        const longName = 'a'.repeat(64);
        expect(isValidIdentifier(longName)).toBe(false);
        // But 63 chars is OK
        expect(isValidIdentifier('a'.repeat(63))).toBe(true);
      });

      // SQL INJECTION PATTERNS - These MUST fail validation
      it('rejects SQL injection patterns', () => {
        expect(isValidIdentifier("'; DROP TABLE users; --")).toBe(false);
        expect(isValidIdentifier("' OR '1'='1")).toBe(false);
        expect(isValidIdentifier('users; DELETE FROM users')).toBe(false);
        expect(isValidIdentifier('1; SELECT * FROM passwords')).toBe(false);
      });
    });
  });

  // ==========================================================================
  // escapeIdentifier
  // ==========================================================================
  describe('escapeIdentifier', () => {
    describe('basic escaping', () => {
      it('wraps simple names in double quotes', () => {
        expect(escapeIdentifier('users')).toBe('"users"');
        expect(escapeIdentifier('documents')).toBe('"documents"');
      });

      it('preserves case inside quotes', () => {
        expect(escapeIdentifier('Users')).toBe('"Users"');
        expect(escapeIdentifier('USER_PROFILES')).toBe('"USER_PROFILES"');
      });

      it('handles reserved words safely', () => {
        expect(escapeIdentifier('SELECT')).toBe('"SELECT"');
        expect(escapeIdentifier('FROM')).toBe('"FROM"');
        expect(escapeIdentifier('WHERE')).toBe('"WHERE"');
        expect(escapeIdentifier('TABLE')).toBe('"TABLE"');
      });
    });

    describe('quote escaping', () => {
      it('doubles internal double quotes', () => {
        expect(escapeIdentifier('user"name')).toBe('"user""name"');
        expect(escapeIdentifier('a"b"c')).toBe('"a""b""c"');
      });

      it('handles multiple quotes', () => {
        // Input: """ (3 quotes)
        // Each " becomes "" = 6 quotes
        // Wrapped in quotes = " + 6 + " = 8 total
        expect(escapeIdentifier('"""')).toBe('""""""""');
      });
    });

    describe('error cases', () => {
      it('throws SQLSafetyError for empty string', () => {
        expect(() => escapeIdentifier('')).toThrow(SQLSafetyError);
        expect(() => escapeIdentifier('')).toThrow(
          'Identifier cannot be empty'
        );
      });

      it('throws SQLSafetyError for too long names', () => {
        const longName = 'a'.repeat(64);
        expect(() => escapeIdentifier(longName)).toThrow(SQLSafetyError);
        expect(() => escapeIdentifier(longName)).toThrow(
          'exceeds maximum length'
        );
      });
    });

    // Even with malicious input, escaping makes it safe
    describe('injection attempts become safe strings', () => {
      it('escapes SQL injection in identifier', () => {
        // This becomes a LITERAL string, not executable SQL
        const escaped = escapeIdentifier("users'; DROP TABLE users; --");
        expect(escaped).toBe('"users\'; DROP TABLE users; --"');
        // The semicolon and -- are just characters in a quoted identifier
      });

      it('escapes quote-based injection', () => {
        const escaped = escapeIdentifier('users" OR "1"="1');
        expect(escaped).toBe('"users"" OR ""1""=""1"');
        // The injected quotes are escaped (doubled)
      });
    });
  });

  // ==========================================================================
  // SafeQueryBuilder
  // ==========================================================================
  describe('SafeQueryBuilder', () => {
    describe('basic query building', () => {
      it('builds simple SELECT query', () => {
        const query = new SafeQueryBuilder()
          .select(['id', 'name'])
          .from('users')
          .build();

        expect(query.text).toBe('SELECT "id", "name" FROM "users"');
        expect(query.values).toEqual([]);
      });

      it('handles SELECT * correctly', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .build();

        expect(query.text).toBe('SELECT * FROM "users"');
      });

      it('mixes * with other columns', () => {
        const query = new SafeQueryBuilder()
          .select(['*', 'extra_col'])
          .from('users')
          .build();

        expect(query.text).toBe('SELECT *, "extra_col" FROM "users"');
      });
    });

    describe('WHERE clause', () => {
      it('builds single condition with parameterized value', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'id', operator: '=', value: 42 }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "id" = $1');
        expect(query.values).toEqual([42]);
      });

      it('builds multiple conditions with AND', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([
            { column: 'status', operator: '=', value: 'active' },
            { column: 'role', operator: '=', value: 'admin' },
          ])
          .build();

        expect(query.text).toBe(
          'SELECT * FROM "users" WHERE "status" = $1 AND "role" = $2'
        );
        expect(query.values).toEqual(['active', 'admin']);
      });

      it('handles comparison operators', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('products')
          .where([
            { column: 'price', operator: '>', value: 100 },
            { column: 'stock', operator: '<=', value: 50 },
          ])
          .build();

        expect(query.text).toBe(
          'SELECT * FROM "products" WHERE "price" > $1 AND "stock" <= $2'
        );
        expect(query.values).toEqual([100, 50]);
      });

      it('handles LIKE operator', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'name', operator: 'LIKE', value: '%john%' }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "name" LIKE $1');
        expect(query.values).toEqual(['%john%']);
      });

      it('handles IN operator with array', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([
            { column: 'status', operator: 'IN', value: ['active', 'pending'] },
          ])
          .build();

        expect(query.text).toBe(
          'SELECT * FROM "users" WHERE "status" IN ($1, $2)'
        );
        expect(query.values).toEqual(['active', 'pending']);
      });

      it('handles IN operator with single value', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'id', operator: 'IN', value: 1 }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "id" IN ($1)');
        expect(query.values).toEqual([1]);
      });
    });

    describe('ORDER BY clause', () => {
      it('adds ORDER BY with default ASC', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .orderBy('created_at')
          .build();

        expect(query.text).toBe(
          'SELECT * FROM "users" ORDER BY "created_at" ASC'
        );
      });

      it('adds ORDER BY DESC', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .orderBy('created_at', 'DESC')
          .build();

        expect(query.text).toBe(
          'SELECT * FROM "users" ORDER BY "created_at" DESC'
        );
      });
    });

    describe('LIMIT and OFFSET', () => {
      it('adds parameterized LIMIT', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .limit(10)
          .build();

        expect(query.text).toBe('SELECT * FROM "users" LIMIT $1');
        expect(query.values).toEqual([10]);
      });

      it('adds parameterized OFFSET', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .offset(20)
          .build();

        expect(query.text).toBe('SELECT * FROM "users" OFFSET $1');
        expect(query.values).toEqual([20]);
      });

      it('combines LIMIT and OFFSET for pagination', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .limit(10)
          .offset(20)
          .build();

        expect(query.text).toBe('SELECT * FROM "users" LIMIT $1 OFFSET $2');
        expect(query.values).toEqual([10, 20]);
      });
    });

    describe('complete query', () => {
      it('builds complex query with all clauses', () => {
        const query = new SafeQueryBuilder()
          .select(['id', 'name', 'email'])
          .from('users')
          .where([
            { column: 'status', operator: '=', value: 'active' },
            { column: 'age', operator: '>=', value: 18 },
          ])
          .orderBy('created_at', 'DESC')
          .limit(10)
          .offset(0)
          .build();

        expect(query.text).toBe(
          'SELECT "id", "name", "email" FROM "users" WHERE "status" = $1 AND "age" >= $2 ORDER BY "created_at" DESC LIMIT $3 OFFSET $4'
        );
        expect(query.values).toEqual(['active', 18, 10, 0]);
      });
    });

    describe('error handling', () => {
      it('throws when table not specified', () => {
        expect(() => {
          new SafeQueryBuilder().select(['*']).build();
        }).toThrow(SQLSafetyError);
        expect(() => {
          new SafeQueryBuilder().select(['*']).build();
        }).toThrow('Table name is required');
      });

      it('throws when columns not specified', () => {
        expect(() => {
          new SafeQueryBuilder().from('users').build();
        }).toThrow(SQLSafetyError);
        expect(() => {
          new SafeQueryBuilder().from('users').build();
        }).toThrow('Columns are required');
      });
    });

    // ========================================================================
    // SQL INJECTION ATTACK TESTS - THE CRITICAL SECURITY TESTS
    // ========================================================================
    describe('SQL injection prevention', () => {
      it('prevents injection via column values', () => {
        // Classic SQL injection attempt
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([
            { column: 'name', operator: '=', value: "'; DROP TABLE users; --" },
          ])
          .build();

        // The malicious payload is PARAMETERIZED, not in the SQL string
        expect(query.text).toBe('SELECT * FROM "users" WHERE "name" = $1');
        expect(query.values).toEqual(["'; DROP TABLE users; --"]);
        // The actual value goes to the DB driver as a parameter, NOT executed as SQL
      });

      it('prevents injection via OR 1=1 attack', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'password', operator: '=', value: "' OR '1'='1" }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "password" = $1');
        expect(query.values).toEqual(["' OR '1'='1"]);
        // Attack string is just a value, not SQL logic
      });

      it('prevents injection via UNION attack', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([
            {
              column: 'id',
              operator: '=',
              value: '1 UNION SELECT * FROM passwords',
            },
          ])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "id" = $1');
        expect(query.values).toEqual(['1 UNION SELECT * FROM passwords']);
      });

      it('prevents injection via comment attack', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'name', operator: '=', value: "admin'--" }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "name" = $1');
        expect(query.values).toEqual(["admin'--"]);
      });

      it('escapes malicious table names', () => {
        // Even if someone tries to inject via table name
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users"; DROP TABLE users; --')
          .build();

        // The table name is escaped with doubled quotes
        expect(query.text).toBe(
          'SELECT * FROM "users""; DROP TABLE users; --"'
        );
        // This is now a literal table name (which won't exist), not an injection
      });

      it('escapes malicious column names', () => {
        const query = new SafeQueryBuilder()
          .select(['id"; DELETE FROM users; --'])
          .from('users')
          .build();

        expect(query.text).toBe(
          'SELECT "id""; DELETE FROM users; --" FROM "users"'
        );
      });

      it('handles null byte injection attempts', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([{ column: 'name', operator: '=', value: 'admin\x00' }])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "name" = $1');
        expect(query.values).toEqual(['admin\x00']);
        // Null byte is just part of the parameterized value
      });

      it('prevents batch query injection', () => {
        const query = new SafeQueryBuilder()
          .select(['*'])
          .from('users')
          .where([
            { column: 'id', operator: '=', value: '1; DROP TABLE users;' },
          ])
          .build();

        expect(query.text).toBe('SELECT * FROM "users" WHERE "id" = $1');
        expect(query.values).toEqual(['1; DROP TABLE users;']);
      });
    });
  });
});
