# Security

Built-in security utilities to protect against common vulnerabilities in AI applications.

## Security Philosophy

ContextAI follows a **defense-in-depth** approach:

1. **Prevent** - Block common attack patterns at the SDK level
2. **Detect** - Identify sensitive data before it leaks
3. **Redact** - Automatically remove secrets from logs and outputs
4. **Validate** - Ensure inputs conform to expected shapes

## Security Utilities Overview

| Utility | Purpose | Protection Against |
|---------|---------|-------------------|
| [Secret Redaction](#secret-redaction) | Remove secrets from logs | Credential leakage |
| [Path Validation](#path-validation) | Validate file paths | Path traversal attacks |
| [SQL Safety](#sql-safety) | Safe query building | SQL injection |
| [Input Validation](#input-validation) | Zod schema validation | Invalid/malicious input |

## Secret Redaction

**NFR-301**: SDK shall never log API keys, authorization headers, user credentials, or PII from documents.

### The Problem

AI agents handle sensitive data:

```typescript
// Dangerous: Secrets logged in plain text
logger.info('Config loaded', {
  openaiKey: 'sk-abc123...',
  dbPassword: 'secret123',
});
```

### The Solution

```typescript
import { createSafeLogger, consoleLogger } from '@contextaisdk/core';

const logger = createSafeLogger(consoleLogger);

// Safe: Secrets automatically redacted
logger.info('Config loaded', {
  openaiKey: 'sk-abc123...',  // Becomes '[REDACTED]'
  dbPassword: 'secret123',     // Becomes '[REDACTED]'
});
```

### How It Works

Secret redaction uses two detection strategies:

**1. Key-Based Detection** - Checks if the key name indicates a secret:
- `password`, `secret`, `token`, `api_key`, `authorization`, etc.

**2. Value-Based Detection** - Checks if the value matches secret patterns:
- API keys: `sk-...`, `pk-...`, `sk-ant-...`
- Bearer tokens: `Bearer eyJ...`
- Connection strings: `mongodb://user:pass@host`
- JWTs: `eyJhbGciOiJ...`

### When to Use

```typescript
import { createSafeLogger, redactObject } from '@contextaisdk/core';

// 1. Wrap all loggers in production
const logger = createSafeLogger(productionLogger);

// 2. Redact before sending to external services
const { data: safeContext } = redactObject(errorContext);
errorTracker.capture(error, { extra: safeContext });

// 3. Redact tool outputs that may contain secrets
const { data: safeResponse } = redactObject(apiResponse);
return safeResponse;
```

See [Secure Logging Guide](../how-to/agents/secure-logging.md) for complete documentation.

## Path Validation

Prevent path traversal attacks when agents read/write files.

### The Problem

```typescript
// Dangerous: User can escape the sandbox
const path = `/data/${userInput}`;  // userInput = "../../../etc/passwd"
await fs.readFile(path);            // Reads /etc/passwd!
```

### The Solution

```typescript
import { PathValidator } from '@contextaisdk/core';

const validator = new PathValidator({
  allowedPaths: ['/data/uploads'],
  blockedPatterns: [/\.env$/],
});

// Safe: Validates before use
const result = await validator.validate(userInput);
if (!result.valid) {
  throw new Error(`Blocked: ${result.reason}`);
}
```

### Features

- **Allowed paths**: Restrict to specific directories
- **Blocked patterns**: Reject dangerous filenames (`.env`, `.git/`)
- **Symlink resolution**: Detect symlink escapes
- **Traversal detection**: Block `../` sequences

### When to Use

```typescript
// In file-reading tools
const fileTool = defineTool({
  name: 'read_file',
  execute: async ({ path }) => {
    // Validate before reading
    const result = await validatePath(path, {
      allowedPaths: [process.cwd()],
    });
    if (!result.valid) {
      return { error: 'PATH_BLOCKED', reason: result.reason };
    }
    return { content: await fs.readFile(path, 'utf-8') };
  },
});
```

## SQL Safety

Build SQL queries safely without injection vulnerabilities.

### The Problem

```typescript
// Dangerous: SQL injection
const query = `SELECT * FROM users WHERE name = '${userInput}'`;
// userInput = "'; DROP TABLE users; --"
```

### The Solution

```typescript
import { SafeQueryBuilder, isValidIdentifier } from '@contextaisdk/core';

// Safe: Parameterized queries
const builder = new SafeQueryBuilder('users');
const { query, params } = builder
  .select(['id', 'name', 'email'])
  .where({ name: userInput })  // Parameterized
  .build();

// query: "SELECT id, name, email FROM users WHERE name = ?"
// params: [userInput]
```

### Features

- **Identifier validation**: Ensures table/column names are safe
- **Parameterized values**: All values become query parameters
- **Escape functions**: Safe escaping for dynamic identifiers
- **Type safety**: TypeScript support for query building

### When to Use

```typescript
// In database tools
const dbTool = defineTool({
  name: 'query_db',
  execute: async ({ table, filters }) => {
    // Validate table name
    if (!isValidIdentifier(table)) {
      return { error: 'INVALID_TABLE' };
    }

    // Build safe query
    const builder = new SafeQueryBuilder(table);
    const { query, params } = builder
      .where(filters)
      .limit(100)
      .build();

    return await db.query(query, params);
  },
});
```

## Input Validation

Validate all inputs using Zod schemas.

### The Problem

```typescript
// Dangerous: Trusting unvalidated input
const tool = {
  execute: async (input) => {
    // input.command could be anything!
    await exec(input.command);
  },
};
```

### The Solution

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';

const tool = defineTool({
  name: 'safe_tool',
  parameters: z.object({
    command: z.enum(['list', 'status', 'help']),  // Restricted
    target: z.string().max(100).regex(/^[a-z0-9-]+$/),  // Validated
  }),
  execute: async ({ command, target }) => {
    // Input is guaranteed to match schema
  },
});
```

### Features

- **Type coercion**: Automatic type conversion
- **Constraints**: min, max, regex, enum restrictions
- **Custom validation**: refine() for complex logic
- **Error messages**: Clear validation failure reasons

### Best Practices

```typescript
// 1. Be restrictive with enums
z.enum(['read', 'write', 'delete'])  // Not z.string()

// 2. Limit lengths
z.string().max(1000)  // Prevent DoS

// 3. Use patterns for IDs
z.string().uuid()  // Or custom regex

// 4. Validate nested objects
z.object({
  user: z.object({
    id: z.string().uuid(),
    role: z.enum(['user', 'admin']),
  }),
})
```

## Error Handling Security

Handle errors without leaking sensitive information.

### The Problem

```typescript
// Dangerous: Full error details exposed
catch (error) {
  return { error: error.message, stack: error.stack };
}
```

### The Solution

```typescript
import { ContextAIError, redactObject } from '@contextaisdk/core';

catch (error) {
  if (error instanceof ContextAIError) {
    // Return safe, structured error
    return {
      code: error.code,
      message: error.message,
      hint: error.troubleshootingHint,
      isRetryable: error.isRetryable,
    };
  }

  // Redact any sensitive data in error context
  const { data: safeContext } = redactObject(errorContext);
  logger.error('Unexpected error', { context: safeContext });

  return { code: 'UNKNOWN_ERROR', message: 'An error occurred' };
}
```

## Security Checklist

### Agent Development

- [ ] Use `createSafeLogger()` for all logging
- [ ] Validate all tool inputs with Zod schemas
- [ ] Use `PathValidator` for file operations
- [ ] Use `SafeQueryBuilder` for database queries
- [ ] Redact errors before returning to users

### Production Deployment

- [ ] Rotate API keys regularly
- [ ] Use environment variables for secrets
- [ ] Enable audit logging
- [ ] Monitor for unusual patterns
- [ ] Review tool permissions

### Code Review

- [ ] No secrets in source code
- [ ] No `eval()` or `Function()` with user input
- [ ] No string concatenation for SQL/commands
- [ ] All external input validated
- [ ] Error messages don't leak internals

## Related Topics

- [Secure Logging](../how-to/agents/secure-logging.md) - Complete secure logging guide
- [Error Handling](../how-to/agents/error-handling.md) - Safe error patterns
- [Tools](./tools.md) - Secure tool development
