import { describe, it, expect } from 'vitest';
import {
  redactSecrets,
  redactObject,
  createSafeLogger,
  isSecretKey,
  isSecretValue,
} from '../src';
import type { Logger, RedactionConfig } from '../src';

describe('Secret Redaction', () => {
  // ==========================================================================
  // isSecretKey
  // ==========================================================================
  describe('isSecretKey', () => {
    describe('built-in patterns', () => {
      it('identifies password variations', () => {
        expect(isSecretKey('password')).toBe(true);
        expect(isSecretKey('PASSWORD')).toBe(true);
        expect(isSecretKey('passwd')).toBe(true);
        expect(isSecretKey('pwd')).toBe(true);
      });

      it('identifies token variations', () => {
        expect(isSecretKey('token')).toBe(true);
        expect(isSecretKey('access_token')).toBe(true);
        expect(isSecretKey('refresh_token')).toBe(true);
        expect(isSecretKey('auth_token')).toBe(true);
        expect(isSecretKey('id_token')).toBe(true);
      });

      it('identifies API key variations', () => {
        expect(isSecretKey('api_key')).toBe(true);
        expect(isSecretKey('apikey')).toBe(true);
        expect(isSecretKey('API_KEY')).toBe(true);
        expect(isSecretKey('api-key')).toBe(true);
        expect(isSecretKey('api_secret')).toBe(true);
      });

      it('identifies authorization headers', () => {
        expect(isSecretKey('authorization')).toBe(true);
        expect(isSecretKey('Authorization')).toBe(true);
        expect(isSecretKey('auth')).toBe(true);
        expect(isSecretKey('bearer')).toBe(true);
      });

      it('identifies secret variations', () => {
        expect(isSecretKey('secret')).toBe(true);
        expect(isSecretKey('client_secret')).toBe(true);
        expect(isSecretKey('app_secret')).toBe(true);
      });

      it('identifies private keys', () => {
        expect(isSecretKey('private_key')).toBe(true);
        expect(isSecretKey('privatekey')).toBe(true);
        expect(isSecretKey('signing_key')).toBe(true);
      });

      it('identifies connection strings', () => {
        expect(isSecretKey('connection_string')).toBe(true);
        expect(isSecretKey('database_url')).toBe(true);
        expect(isSecretKey('db_url')).toBe(true);
      });

      it('does NOT identify non-sensitive keys', () => {
        expect(isSecretKey('username')).toBe(false);
        expect(isSecretKey('email')).toBe(false);
        expect(isSecretKey('name')).toBe(false);
        expect(isSecretKey('id')).toBe(false);
        expect(isSecretKey('status')).toBe(false);
        expect(isSecretKey('data')).toBe(false);
      });
    });

    describe('config: sensitiveKeys', () => {
      it('identifies custom sensitive keys', () => {
        const config: RedactionConfig = {
          sensitiveKeys: ['myCustomSecret', 'anotherKey'],
        };
        expect(isSecretKey('myCustomSecret', config)).toBe(true);
        expect(isSecretKey('mycustomsecret', config)).toBe(true); // case insensitive
        expect(isSecretKey('anotherKey', config)).toBe(true);
        expect(isSecretKey('randomKey', config)).toBe(false);
      });
    });

    describe('config: allowedKeys', () => {
      it('bypasses redaction for allowed keys', () => {
        const config: RedactionConfig = {
          allowedKeys: ['password'],
        };
        // Even though 'password' is normally sensitive, it's in allowedKeys
        expect(isSecretKey('password', config)).toBe(false);
      });

      it('allowedKeys takes precedence over sensitiveKeys', () => {
        const config: RedactionConfig = {
          sensitiveKeys: ['myField'],
          allowedKeys: ['myField'],
        };
        // allowedKeys wins
        expect(isSecretKey('myField', config)).toBe(false);
      });
    });

    describe('config: customPatterns', () => {
      it('matches custom key patterns', () => {
        const config: RedactionConfig = {
          customPatterns: [{ name: 'custom', keyPattern: /^custom_/ }],
        };
        expect(isSecretKey('custom_field', config)).toBe(true);
        expect(isSecretKey('custom_data', config)).toBe(true);
        expect(isSecretKey('other_field', config)).toBe(false);
      });
    });
  });

  // ==========================================================================
  // isSecretValue
  // ==========================================================================
  describe('isSecretValue', () => {
    describe('API key prefixes', () => {
      it('detects OpenAI-style sk- keys', () => {
        // Using obviously fake test values to avoid GitHub secret scanning
        expect(isSecretValue('sk-TESTKEY1234567890abcdef')).toBe(true);
        expect(isSecretValue('sk_FAKEKEY1234567890abcdef')).toBe(true);
      });

      it('detects Anthropic-style sk-ant- keys', () => {
        expect(isSecretValue('sk-ant-TESTKEY1234567890')).toBe(true);
      });

      it('detects pk- prefixed keys', () => {
        expect(isSecretValue('pk-TESTKEY1234567890abcdef')).toBe(true);
        expect(isSecretValue('pk_FAKEKEY1234567890abcdef')).toBe(true);
      });

      it('detects ak- prefixed keys', () => {
        expect(isSecretValue('ak-TESTKEY1234567890abcdef')).toBe(true);
      });
    });

    describe('Bearer tokens', () => {
      it('detects Bearer token pattern', () => {
        expect(isSecretValue('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc')).toBe(true);
        expect(isSecretValue('bearer token123456789')).toBe(true);
      });
    });

    describe('connection strings', () => {
      it('detects MongoDB URIs with credentials', () => {
        expect(isSecretValue('mongodb://user:password@host:27017/db')).toBe(true);
        expect(isSecretValue('mongodb+srv://user:pass@cluster.mongodb.net/db')).toBe(true);
      });

      it('detects PostgreSQL URIs with credentials', () => {
        expect(isSecretValue('postgresql://user:password@localhost:5432/db')).toBe(true);
        expect(isSecretValue('postgres://user:pass@host/db')).toBe(true);
      });

      it('detects MySQL URIs with credentials', () => {
        expect(isSecretValue('mysql://root:secret@localhost:3306/mydb')).toBe(true);
      });

      it('detects Redis URIs with credentials', () => {
        expect(isSecretValue('redis://user:password@localhost:6379')).toBe(true);
        expect(isSecretValue('rediss://user:pass@host:6380')).toBe(true);
      });
    });

    describe('AWS credentials', () => {
      it('detects AWS access key IDs', () => {
        expect(isSecretValue('AKIAIOSFODNN7EXAMPLE')).toBe(true);
        expect(isSecretValue('AKIA1234567890123456')).toBe(true);
      });
    });

    describe('JWT tokens', () => {
      it('detects JWT pattern', () => {
        const jwt =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
        expect(isSecretValue(jwt)).toBe(true);
      });
    });

    describe('long hex strings', () => {
      it('detects 40+ character hex strings', () => {
        const hexString = 'a'.repeat(40);
        expect(isSecretValue(hexString)).toBe(true);
      });

      it('does not detect shorter hex strings', () => {
        const shortHex = 'abcdef1234567890'; // 16 chars
        expect(isSecretValue(shortHex)).toBe(false);
      });
    });

    describe('non-secrets', () => {
      it('does NOT detect normal strings', () => {
        expect(isSecretValue('hello world')).toBe(false);
        expect(isSecretValue('user@example.com')).toBe(false);
        expect(isSecretValue('John Doe')).toBe(false);
      });

      it('does NOT detect short strings', () => {
        expect(isSecretValue('sk-abc')).toBe(false); // too short
        expect(isSecretValue('1234567')).toBe(false); // 7 chars, below default min
      });
    });

    describe('config: minSecretLength', () => {
      it('respects custom minimum length', () => {
        const config: RedactionConfig = { minSecretLength: 5 };
        expect(isSecretValue('sk-ab', config)).toBe(false); // still too short for pattern
        expect(isSecretValue('abcd', config)).toBe(false); // 4 chars, below minLength
      });
    });

    describe('config: customPatterns', () => {
      it('matches custom value patterns', () => {
        const config: RedactionConfig = {
          customPatterns: [{ name: 'custom', valuePattern: /^CUSTOM-[A-Z0-9]+$/ }],
        };
        expect(isSecretValue('CUSTOM-ABC123DEF456', config)).toBe(true);
        expect(isSecretValue('OTHER-ABC123', config)).toBe(false);
      });
    });
  });

  // ==========================================================================
  // redactSecrets (string)
  // ==========================================================================
  describe('redactSecrets', () => {
    it('redacts API keys', () => {
      expect(redactSecrets('sk-TESTKEY1234567890abcdef')).toBe('[REDACTED]');
    });

    it('redacts Bearer tokens', () => {
      expect(redactSecrets('Bearer eyJhbGciOiJIUzI1NiJ9.abc.xyz')).toBe('[REDACTED]');
    });

    it('redacts connection strings', () => {
      expect(redactSecrets('mongodb://user:pass@host/db')).toBe('[REDACTED]');
    });

    it('does not redact normal strings', () => {
      expect(redactSecrets('hello world')).toBe('hello world');
      expect(redactSecrets('username')).toBe('username');
    });

    it('uses custom replacement string', () => {
      expect(redactSecrets('sk-TESTKEY1234567890abcdef', { replacement: '***' })).toBe('***');
    });

    it('respects redactByValue: false', () => {
      const config: RedactionConfig = { redactByValue: false };
      // Even though this looks like a secret, value-based redaction is disabled
      expect(redactSecrets('sk-TESTKEY1234567890abcdef', config)).toBe(
        'sk-TESTKEY1234567890abcdef'
      );
    });
  });

  // ==========================================================================
  // redactObject
  // ==========================================================================
  describe('redactObject', () => {
    describe('key-based redaction', () => {
      it('redacts password fields', () => {
        const input = { username: 'john', password: 'secret123' };
        const result = redactObject(input);
        expect(result.data).toEqual({
          username: 'john',
          password: '[REDACTED]',
        });
        expect(result.redactedCount).toBe(1);
      });

      it('redacts api_key variations', () => {
        expect(redactObject({ apiKey: 'test' }).data.apiKey).toBe('[REDACTED]');
        expect(redactObject({ api_key: 'test' }).data.api_key).toBe('[REDACTED]');
        expect(redactObject({ API_KEY: 'test' }).data.API_KEY).toBe('[REDACTED]');
      });

      it('redacts authorization headers', () => {
        const input = { headers: { authorization: 'Bearer token' } };
        const result = redactObject(input);
        expect((result.data.headers as Record<string, unknown>).authorization).toBe('[REDACTED]');
      });

      it('redacts multiple fields', () => {
        const input = {
          password: 'a',
          api_key: 'b',
          token: 'c',
          name: 'visible',
        };
        const result = redactObject(input);
        expect(result.redactedCount).toBe(3);
        expect(result.data.name).toBe('visible');
      });
    });

    describe('value-based redaction', () => {
      it('redacts sk- prefixed values regardless of key', () => {
        const input = { myField: 'sk-TESTKEY1234567890abcdef' };
        const result = redactObject(input);
        expect(result.data.myField).toBe('[REDACTED]');
      });

      it('redacts JWT tokens regardless of key', () => {
        const jwt =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
        const input = { data: jwt };
        const result = redactObject(input);
        expect(result.data.data).toBe('[REDACTED]');
      });

      it('does not redact short values', () => {
        const input = { code: 'ABC123' };
        const result = redactObject(input);
        expect(result.data.code).toBe('ABC123');
      });
    });

    describe('nested objects', () => {
      it('recursively redacts nested objects', () => {
        // Use 'settings' instead of 'credentials' because 'credentials' is itself a sensitive key
        // and would cause the entire object to be redacted
        const input = {
          user: {
            settings: {
              password: 'secret',
            },
          },
        };
        const result = redactObject(input);
        const userSettings = (result.data.user as { settings: { password: string } }).settings;
        expect(userSettings.password).toBe('[REDACTED]');
      });

      it('handles deeply nested structures', () => {
        const input = {
          level1: {
            level2: {
              level3: {
                apiKey: 'secret',
                data: 'visible',
              },
            },
          },
        };
        const result = redactObject(input);
        const deep = (
          result.data.level1 as {
            level2: { level3: { apiKey: string; data: string } };
          }
        ).level2.level3;
        expect(deep.apiKey).toBe('[REDACTED]');
        expect(deep.data).toBe('visible');
      });
    });

    describe('arrays', () => {
      it('redacts secrets in array elements', () => {
        const input = { keys: ['sk-FAKEKEY12345678901', 'normal', 'sk-FAKEKEY23456789012'] };
        const result = redactObject(input);
        expect(result.data.keys).toEqual(['[REDACTED]', 'normal', '[REDACTED]']);
      });

      it('redacts objects inside arrays', () => {
        const input = {
          users: [
            { name: 'Alice', password: 'secret1' },
            { name: 'Bob', password: 'secret2' },
          ],
        };
        const result = redactObject(input);
        const users = result.data.users as Array<{ name: string; password: string }>;
        expect(users[0].name).toBe('Alice');
        expect(users[0].password).toBe('[REDACTED]');
        expect(users[1].password).toBe('[REDACTED]');
      });
    });

    describe('safety features', () => {
      it('handles circular references', () => {
        const obj: { name: string; self?: unknown } = { name: 'test' };
        obj.self = obj;
        expect(() => redactObject(obj)).not.toThrow();
        const result = redactObject(obj);
        expect(result.data.self).toBe('[CIRCULAR]');
        expect(result.data.name).toBe('test');
      });

      it('handles mutual circular references', () => {
        const a: { name: string; ref?: unknown } = { name: 'a' };
        const b: { name: string; ref?: unknown } = { name: 'b' };
        a.ref = b;
        b.ref = a;
        expect(() => redactObject(a)).not.toThrow();
        const result = redactObject(a);
        expect(result.data.name).toBe('a');
        expect((result.data.ref as { name: string; ref: unknown }).name).toBe('b');
        expect((result.data.ref as { ref: unknown }).ref).toBe('[CIRCULAR]');
      });

      it('respects maxDepth', () => {
        const deep = {
          a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'deep' } } } } } } } } } },
        };
        const result = redactObject(deep, { maxDepth: 3 });
        // At depth 3, the entire subtree is redacted
        expect(
          (result.data.a as { b: { c: unknown } }).b.c
        ).toBe('[REDACTED]');
      });

      it('handles null values', () => {
        const input = { name: null, password: null };
        const result = redactObject(input);
        expect(result.data.name).toBeNull();
        // Key-based redaction still applies even though value is null
        expect(result.data.password).toBe('[REDACTED]');
      });

      it('handles undefined values', () => {
        const input = { name: undefined, data: 'visible' };
        const result = redactObject(input);
        expect(result.data.name).toBeUndefined();
        expect(result.data.data).toBe('visible');
      });

      it('handles empty objects', () => {
        const result = redactObject({});
        expect(result.data).toEqual({});
        expect(result.redactedCount).toBe(0);
      });

      it('handles empty arrays', () => {
        const input = { items: [] };
        const result = redactObject(input);
        expect(result.data.items).toEqual([]);
      });
    });

    describe('config: allowedKeys', () => {
      it('skips redaction for allowed keys', () => {
        const input = { password: 'secret', api_key: 'key123' };
        const result = redactObject(input, { allowedKeys: ['password'] });
        expect(result.data.password).toBe('secret');
        expect(result.data.api_key).toBe('[REDACTED]');
      });
    });

    describe('config: customPatterns', () => {
      it('supports custom key patterns', () => {
        const input = { mySecretField: 'value', normalField: 'value' };
        const result = redactObject(input, {
          customPatterns: [{ name: 'custom', keyPattern: /^mySecret/ }],
        });
        expect(result.data.mySecretField).toBe('[REDACTED]');
        expect(result.data.normalField).toBe('value');
      });
    });

    describe('config: replacement', () => {
      it('uses custom replacement string', () => {
        const input = { password: 'secret' };
        const result = redactObject(input, { replacement: '***HIDDEN***' });
        expect(result.data.password).toBe('***HIDDEN***');
      });
    });

    describe('primitive inputs', () => {
      it('handles null input', () => {
        const result = redactObject(null);
        expect(result.data).toBeNull();
        expect(result.redactedCount).toBe(0);
      });

      it('handles undefined input', () => {
        const result = redactObject(undefined);
        expect(result.data).toBeUndefined();
        expect(result.redactedCount).toBe(0);
      });

      it('handles string input with secret', () => {
        const result = redactObject('sk-TESTKEY1234567890abcdef');
        expect(result.data).toBe('[REDACTED]');
        expect(result.redactedCount).toBe(1);
      });

      it('handles string input without secret', () => {
        const result = redactObject('hello world');
        expect(result.data).toBe('hello world');
        expect(result.redactedCount).toBe(0);
      });

      it('handles number input', () => {
        const result = redactObject(42);
        expect(result.data).toBe(42);
        expect(result.redactedCount).toBe(0);
      });

      it('handles boolean input', () => {
        const result = redactObject(true);
        expect(result.data).toBe(true);
        expect(result.redactedCount).toBe(0);
      });
    });
  });

  // ==========================================================================
  // createSafeLogger
  // ==========================================================================
  describe('createSafeLogger', () => {
    it('redacts secrets from metadata', () => {
      const logs: Array<{ level: string; message: string; meta?: unknown }> = [];
      const mockLogger: Logger = {
        debug: (msg, meta) => logs.push({ level: 'debug', message: msg, meta }),
        info: (msg, meta) => logs.push({ level: 'info', message: msg, meta }),
        warn: (msg, meta) => logs.push({ level: 'warn', message: msg, meta }),
        error: (msg, meta) => logs.push({ level: 'error', message: msg, meta }),
      };

      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Test', { password: 'secret' });

      expect(logs[0].meta).toEqual({ password: '[REDACTED]' });
    });

    it('preserves message content (does not redact message)', () => {
      const logs: string[] = [];
      const mockLogger: Logger = {
        debug: (msg) => logs.push(msg),
        info: (msg) => logs.push(msg),
        warn: (msg) => logs.push(msg),
        error: (msg) => logs.push(msg),
      };

      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Password is secret123');

      // Message is NOT redacted - only metadata is filtered
      expect(logs[0]).toBe('Password is secret123');
    });

    it('handles undefined metadata', () => {
      const logs: Array<{ message: string; meta?: unknown }> = [];
      const mockLogger: Logger = {
        debug: (msg, meta) => logs.push({ message: msg, meta }),
        info: (msg, meta) => logs.push({ message: msg, meta }),
        warn: (msg, meta) => logs.push({ message: msg, meta }),
        error: (msg, meta) => logs.push({ message: msg, meta }),
      };

      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.info('Test');

      expect(logs[0].meta).toBeUndefined();
    });

    it('works with all log levels', () => {
      const logs: Array<{ level: string; meta?: unknown }> = [];
      const mockLogger: Logger = {
        debug: (_, meta) => logs.push({ level: 'debug', meta }),
        info: (_, meta) => logs.push({ level: 'info', meta }),
        warn: (_, meta) => logs.push({ level: 'warn', meta }),
        error: (_, meta) => logs.push({ level: 'error', meta }),
      };

      const safeLogger = createSafeLogger(mockLogger);
      safeLogger.debug('D', { apiKey: 'k1' });
      safeLogger.info('I', { apiKey: 'k2' });
      safeLogger.warn('W', { apiKey: 'k3' });
      safeLogger.error('E', { apiKey: 'k4' });

      expect(logs).toHaveLength(4);
      expect(logs[0].meta).toEqual({ apiKey: '[REDACTED]' });
      expect(logs[1].meta).toEqual({ apiKey: '[REDACTED]' });
      expect(logs[2].meta).toEqual({ apiKey: '[REDACTED]' });
      expect(logs[3].meta).toEqual({ apiKey: '[REDACTED]' });
    });

    it('redacts nested metadata', () => {
      const logs: Array<{ meta?: unknown }> = [];
      const mockLogger: Logger = {
        debug: (_, meta) => logs.push({ meta }),
        info: (_, meta) => logs.push({ meta }),
        warn: (_, meta) => logs.push({ meta }),
        error: (_, meta) => logs.push({ meta }),
      };

      const safeLogger = createSafeLogger(mockLogger);
      // Use 'settings' instead of 'credentials' because 'credentials' is itself a sensitive key
      safeLogger.info('Test', {
        user: { settings: { password: 'secret' } },
        visible: 'data',
      });

      const meta = logs[0].meta as { user: { settings: { password: string } }; visible: string };
      expect(meta.user.settings.password).toBe('[REDACTED]');
      expect(meta.visible).toBe('data');
    });

    it('uses custom config', () => {
      const logs: Array<{ meta?: unknown }> = [];
      const mockLogger: Logger = {
        debug: (_, meta) => logs.push({ meta }),
        info: (_, meta) => logs.push({ meta }),
        warn: (_, meta) => logs.push({ meta }),
        error: (_, meta) => logs.push({ meta }),
      };

      const safeLogger = createSafeLogger(mockLogger, { replacement: '***' });
      safeLogger.info('Test', { password: 'secret' });

      expect(logs[0].meta).toEqual({ password: '***' });
    });
  });

  // ==========================================================================
  // Edge Cases and Attack Vectors
  // ==========================================================================
  describe('edge cases', () => {
    it('handles prototype pollution attempts', () => {
      // JSON.parse with __proto__ creates a special case - it doesn't set it as
      // an enumerable property, which is actually the safe behavior we want.
      // Object.entries won't enumerate __proto__, preventing pollution.
      const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}');
      expect(() => redactObject(malicious)).not.toThrow();
      const result = redactObject(malicious);
      // __proto__ is NOT enumerated by Object.entries - this is expected & safe
      expect(result.data).toEqual({});
      // The original object's prototype is not modified
      expect(Object.prototype.hasOwnProperty.call(result.data, 'isAdmin')).toBe(false);
    });

    it('handles objects with only symbol keys (ignores symbols)', () => {
      const sym = Symbol('secret');
      const obj = { [sym]: 'value', password: 'secret' };
      const result = redactObject(obj);
      // Symbol keys are not enumerable via Object.entries, so not processed
      // Only the string key is in the result
      expect(result.data.password).toBe('[REDACTED]');
    });

    it('handles Date objects', () => {
      const input = { created: new Date('2024-01-01'), password: 'secret' };
      const result = redactObject(input);
      // Date becomes an empty object when processed via Object.entries
      expect(result.data.password).toBe('[REDACTED]');
    });

    it('handles arrays at top level', () => {
      const input = [
        { password: 'a' },
        { password: 'b' },
        'sk-TESTKEY1234567890abcdef',
      ];
      const result = redactObject(input);
      const data = result.data as Array<unknown>;
      expect((data[0] as { password: string }).password).toBe('[REDACTED]');
      expect((data[1] as { password: string }).password).toBe('[REDACTED]');
      expect(data[2]).toBe('[REDACTED]');
    });

    it('preserves object structure', () => {
      const input = {
        id: 1,
        name: 'Test',
        nested: { foo: 'bar', password: 'secret' },
        list: [1, 2, 3],
      };
      const result = redactObject(input);
      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe('Test');
      expect((result.data.nested as { foo: string }).foo).toBe('bar');
      expect(result.data.list).toEqual([1, 2, 3]);
    });
  });

  // ==========================================================================
  // Real-World Scenarios
  // ==========================================================================
  describe('real-world scenarios', () => {
    it('redacts tool arguments with API keys', () => {
      const toolArgs = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        apiKey: 'sk-proj-FAKEKEY1234567890abc',
      };
      const result = redactObject(toolArgs);
      expect(result.data.model).toBe('gpt-4');
      expect(result.data.apiKey).toBe('[REDACTED]');
    });

    it('redacts database connection config', () => {
      const dbConfig = {
        host: 'localhost',
        port: 5432,
        database: 'myapp',
        password: 'super-secret-password',
        connectionString: 'postgresql://user:pass@localhost:5432/db',
      };
      const result = redactObject(dbConfig);
      expect(result.data.host).toBe('localhost');
      expect(result.data.password).toBe('[REDACTED]');
      expect(result.data.connectionString).toBe('[REDACTED]');
    });

    it('redacts HTTP headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.abc.xyz',
        'X-Api-Key': 'secret-api-key-here',
      };
      const result = redactObject(headers);
      expect(result.data['Content-Type']).toBe('application/json');
      expect(result.data['Authorization']).toBe('[REDACTED]');
      expect(result.data['X-Api-Key']).toBe('[REDACTED]');
    });

    it('redacts error context with sensitive data', () => {
      const errorContext = {
        error: 'Authentication failed',
        request: {
          url: '/api/auth',
          headers: { Authorization: 'Bearer token123' },
          body: { password: 'user-password' },
        },
        timestamp: '2024-01-01T00:00:00Z',
      };
      const result = redactObject(errorContext);
      expect(result.data.error).toBe('Authentication failed');
      const request = result.data.request as {
        headers: { Authorization: string };
        body: { password: string };
      };
      expect(request.headers.Authorization).toBe('[REDACTED]');
      expect(request.body.password).toBe('[REDACTED]');
    });

    it('redacts ReAct trace tool inputs', () => {
      const traceStep = {
        type: 'action',
        tool: 'search_database',
        input: {
          query: 'SELECT * FROM users',
          connectionString: 'postgres://admin:password@db.example.com/prod',
        },
        timestamp: Date.now(),
      };
      const result = redactObject(traceStep);
      const input = result.data.input as { query: string; connectionString: string };
      expect(input.query).toBe('SELECT * FROM users');
      expect(input.connectionString).toBe('[REDACTED]');
    });
  });
});
