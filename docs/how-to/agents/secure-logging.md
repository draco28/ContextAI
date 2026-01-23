# How to Secure Logging

Prevent sensitive data from being logged with built-in secret redaction utilities.

## Why Secure Logging Matters

When building AI agents, logs often contain:

- **API keys** passed to providers or tools
- **Authorization headers** from HTTP requests
- **User credentials** captured in inputs
- **PII** from documents being processed

Accidentally logging these creates security risks. ContextAI provides built-in utilities to automatically redact sensitive information before it reaches your logs.

> **NFR-301 Compliance**: SDK shall never log API keys, authorization headers, user credentials, or PII from documents.

## Quick Start

Wrap any logger with `createSafeLogger()`:

```typescript
import { createSafeLogger, consoleLogger } from '@contextaisdk/core';

// Create a safe logger that auto-redacts secrets
const logger = createSafeLogger(consoleLogger);

// Secrets are automatically redacted
logger.info('User authenticated', {
  userId: '12345',
  password: 'secret123',        // Will be '[REDACTED]'
  apiKey: 'sk-abc123def456...',  // Will be '[REDACTED]'
});

// Output: "User authenticated" { userId: '12345', password: '[REDACTED]', apiKey: '[REDACTED]' }
```

## Core Functions

### createSafeLogger

Wraps any `Logger` to automatically redact secrets from metadata:

```typescript
import { createSafeLogger, consoleLogger } from '@contextaisdk/core';

const logger = createSafeLogger(consoleLogger);

// All log levels are wrapped
logger.debug('Debug message', { token: 'Bearer eyJ...' });  // token redacted
logger.info('Info message', { password: 'secret' });         // password redacted
logger.warn('Warning', { apiKey: 'sk-test123456789' });      // apiKey redacted
logger.error('Error', { credentials: { user: 'a', pass: 'b' } }); // credentials redacted
```

**Important**: Only metadata objects are redacted. Message strings are passed through unchanged.

### redactObject

Recursively redact secrets from any object:

```typescript
import { redactObject } from '@contextaisdk/core';

const config = {
  database: {
    host: 'localhost',
    password: 'db_secret_123',
  },
  api: {
    key: 'sk-prod-abc123def456ghi789',
    baseUrl: 'https://api.example.com',
  },
};

const { data, redactedCount } = redactObject(config);

console.log(data);
// {
//   database: { host: 'localhost', password: '[REDACTED]' },
//   api: { key: '[REDACTED]', baseUrl: 'https://api.example.com' }
// }

console.log(redactedCount); // 2
```

### redactSecrets

Redact secrets from a single string value:

```typescript
import { redactSecrets } from '@contextaisdk/core';

redactSecrets('sk-abc123def456ghi789'); // '[REDACTED]' (API key pattern)
redactSecrets('Bearer eyJhbGciOiJ...');  // '[REDACTED]' (Bearer token)
redactSecrets('hello world');            // 'hello world' (not a secret)
```

### Utility Functions

Check if values look like secrets:

```typescript
import { isSecretKey, isSecretValue } from '@contextaisdk/core';

// Check key names
isSecretKey('password');     // true
isSecretKey('api_key');      // true
isSecretKey('username');     // false

// Check values
isSecretValue('sk-abc123def456789012345');  // true (API key pattern)
isSecretValue('Bearer eyJhbGciOi...');       // true (Bearer token)
isSecretValue('normal text');                // false
```

## What Gets Redacted

### By Key Name

These keys are always redacted regardless of value:

| Pattern | Examples |
|---------|----------|
| Passwords | `password`, `passwd`, `pwd` |
| Secrets | `secret`, `client_secret`, `app_secret` |
| Tokens | `token`, `access_token`, `refresh_token`, `auth_token` |
| API Keys | `api_key`, `apikey`, `api-key` |
| Auth | `authorization`, `bearer` |
| Private Keys | `private_key`, `signing_key` |
| Connections | `connection_string`, `database_url`, `db_url` |
| Credentials | `credentials`, `creds` |

### By Value Pattern

Values matching these patterns are redacted regardless of key:

| Pattern | Example |
|---------|---------|
| OpenAI keys | `sk-abc123...` |
| Anthropic keys | `sk-ant-api...` |
| Stripe keys | `sk_live_...`, `pk_test_...` |
| Bearer tokens | `Bearer eyJ...` |
| MongoDB URIs | `mongodb://user:pass@host` |
| PostgreSQL URIs | `postgres://user:pass@host` |
| AWS keys | `AKIAIOSFODNN7EXAMPLE` |
| JWTs | `eyJhbGciOiJIUzI1NiJ9.eyJ...` |

## Configuration

### Custom Replacement String

```typescript
import { createSafeLogger, redactObject, consoleLogger } from '@contextaisdk/core';

// Use custom replacement
const logger = createSafeLogger(consoleLogger, {
  replacement: '***HIDDEN***',
});

const result = redactObject(data, {
  replacement: '[CLASSIFIED]',
});
```

### Additional Sensitive Keys

Add custom keys to always redact:

```typescript
const logger = createSafeLogger(consoleLogger, {
  sensitiveKeys: ['ssn', 'social_security', 'credit_card'],
});

logger.info('User data', {
  name: 'John',
  ssn: '123-45-6789',  // Will be redacted
});
```

### Allowed Keys (Bypass Redaction)

Allow specific keys to bypass redaction:

```typescript
const logger = createSafeLogger(consoleLogger, {
  allowedKeys: ['debug_token'],  // Never redact this key
});

logger.info('Debug', {
  debug_token: 'test-token-123',  // Will NOT be redacted
  api_key: 'sk-real-key',         // Will be redacted
});
```

### Custom Patterns

Add custom detection patterns:

```typescript
import type { SecretPattern, RedactionConfig } from '@contextaisdk/core';

const config: RedactionConfig = {
  customPatterns: [
    // Match keys containing 'internal_id'
    {
      name: 'internal_id',
      keyPattern: /internal[_-]?id/i,
    },
    // Match values starting with 'PRIV-'
    {
      name: 'private_prefix',
      valuePattern: /^PRIV-[A-Z0-9]+$/,
    },
  ],
};

const logger = createSafeLogger(consoleLogger, config);
```

### Disable Value-Based Detection

Only redact by key name (faster, but less secure):

```typescript
const logger = createSafeLogger(consoleLogger, {
  redactByValue: false,  // Only check key names
});
```

## Agent Integration

### With Custom Logger

```typescript
import { Agent, createSafeLogger, consoleLogger } from '@contextaisdk/core';

const safeLogger = createSafeLogger(consoleLogger);

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are helpful.',
  llm: provider,
  logger: safeLogger,  // All agent logs are now safe
});
```

### In Tool Implementations

Redact sensitive data before returning from tools:

```typescript
import { defineTool, redactObject } from '@contextaisdk/core';
import { z } from 'zod';

const apiTool = defineTool({
  name: 'call_api',
  parameters: z.object({
    endpoint: z.string(),
    headers: z.record(z.string()).optional(),
  }),
  execute: async ({ endpoint, headers }, context) => {
    const response = await fetch(endpoint, { headers });
    const data = await response.json();

    // Redact any secrets in the response before returning
    const { data: safeData } = redactObject(data);
    return safeData;
  },
});
```

### In Error Handling

Redact error contexts before logging:

```typescript
import { redactObject } from '@contextaisdk/core';

try {
  await riskyOperation(config);
} catch (error) {
  // Redact config before logging
  const { data: safeConfig } = redactObject(config);

  logger.error('Operation failed', {
    error: error.message,
    config: safeConfig,  // Safe to log
  });
}
```

## Safety Features

### Circular Reference Protection

Objects with circular references are safely handled:

```typescript
const obj: any = { name: 'test' };
obj.self = obj;  // Circular reference

const { data } = redactObject(obj);
// { name: 'test', self: '[CIRCULAR]' }
```

### Depth Limiting

Prevents stack overflow on deeply nested objects:

```typescript
const logger = createSafeLogger(consoleLogger, {
  maxDepth: 5,  // Stop at depth 5 (default: 10)
});
```

### Type Safety

The redaction preserves TypeScript types:

```typescript
interface UserConfig {
  name: string;
  apiKey: string;
}

const config: UserConfig = {
  name: 'Test',
  apiKey: 'sk-secret',
};

const { data } = redactObject(config);
// data is still typed as UserConfig
```

## Best Practices

### 1. Always Use Safe Loggers in Production

```typescript
// Development: May want full visibility
const logger = process.env.NODE_ENV === 'production'
  ? createSafeLogger(consoleLogger)
  : consoleLogger;
```

### 2. Redact Before External Services

```typescript
// Before sending to error tracking
const { data: safeContext } = redactObject(errorContext);
errorTracker.captureException(error, { extra: safeContext });

// Before analytics
const { data: safeEvent } = redactObject(eventData);
analytics.track('event', safeEvent);
```

### 3. Use Structured Logging

```typescript
// Good: Metadata is redacted
logger.info('User login', { userId, token });

// Bad: Secrets in message string are NOT redacted
logger.info(`User ${userId} logged in with token ${token}`);
```

### 4. Test Redaction in Your CI

```typescript
import { describe, it, expect } from 'vitest';
import { redactObject } from '@contextaisdk/core';

describe('logging security', () => {
  it('should redact API keys', () => {
    const { data } = redactObject({
      key: 'sk-test123456789012345678901234',
    });
    expect(data.key).toBe('[REDACTED]');
  });
});
```

## Full Configuration Reference

```typescript
interface RedactionConfig {
  /** Replacement string (default: '[REDACTED]') */
  replacement?: string;

  /** Custom detection patterns */
  customPatterns?: SecretPattern[];

  /** Additional keys to always redact */
  sensitiveKeys?: string[];

  /** Keys to never redact */
  allowedKeys?: string[];

  /** Max recursion depth (default: 10) */
  maxDepth?: number;

  /** Detect secrets by value patterns (default: true) */
  redactByValue?: boolean;

  /** Minimum value length for detection (default: 8) */
  minSecretLength?: number;
}

interface SecretPattern {
  /** Pattern name for debugging */
  name: string;

  /** Match against key names */
  keyPattern?: RegExp;

  /** Match against values */
  valuePattern?: RegExp;

  /** Require both patterns to match */
  requireBoth?: boolean;
}
```

## Related Topics

- [Error Handling](./error-handling.md) - Secure error logging patterns
- [Security Concepts](../../concepts/security.md) - SDK security philosophy
- [Create Agent](./create-agent.md) - Setting up agents with loggers
