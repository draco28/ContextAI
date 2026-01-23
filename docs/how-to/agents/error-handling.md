# How to Handle Errors

Robust error handling patterns for ContextAI agents.

## Error Types

ContextAI provides typed errors with actionable information:

```typescript
import {
  ContextAIError,
  AgentError,
  ToolError,
  ToolTimeoutError,
  ProviderError,
  ValidationError,
} from '@contextaisdk/core';
```

### Error Hierarchy

```
ContextAIError (base)
├── AgentError
├── ToolError
│   └── ToolTimeoutError
├── ProviderError
└── ValidationError
```

## Basic Error Handling

### Try/Catch

```typescript
import { AgentError, ToolError, ProviderError } from '@contextaisdk/core';

try {
  const response = await agent.run('Do something');
  console.log(response.output);
} catch (error) {
  if (error instanceof ProviderError) {
    console.error('LLM provider error:', error.message);
  } else if (error instanceof ToolError) {
    console.error('Tool failed:', error.toolName, error.message);
  } else if (error instanceof AgentError) {
    console.error('Agent error:', error.code, error.message);
  } else {
    throw error; // Unknown error
  }
}
```

### Error Properties

All ContextAI errors include:

```typescript
interface ContextAIError extends Error {
  code: string;              // Error code (e.g., 'RATE_LIMITED')
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;      // Safe to retry?
  troubleshootingHint: string; // How to fix
  cause?: Error;             // Original error
}
```

### Using Error Properties

```typescript
try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ContextAIError) {
    console.log('Code:', error.code);
    console.log('Can retry:', error.isRetryable);
    console.log('Fix:', error.troubleshootingHint);

    if (error.isRetryable) {
      // Safe to retry
      await agent.run(input);
    }
  }
}
```

## Specific Error Handling

### Provider Errors

```typescript
import { ProviderError } from '@contextaisdk/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'RATE_LIMITED':
        console.log('Rate limited. Wait and retry.');
        await sleep(error.retryAfter || 5000);
        break;

      case 'INVALID_API_KEY':
        console.log('Check your API key');
        break;

      case 'MODEL_NOT_FOUND':
        console.log('Invalid model ID');
        break;

      case 'CONTEXT_LENGTH_EXCEEDED':
        console.log('Input too long. Reduce message size.');
        break;

      case 'CONTENT_POLICY_VIOLATION':
        console.log('Content blocked by safety filters');
        break;

      case 'SERVER_ERROR':
        console.log('Provider server error. Retry later.');
        break;

      case 'NETWORK_ERROR':
        console.log('Network issue. Check connection.');
        break;

      case 'TIMEOUT':
        console.log('Request timed out');
        break;
    }
  }
}
```

### Tool Errors

```typescript
import { ToolError, ToolTimeoutError } from '@contextaisdk/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ToolTimeoutError) {
    console.log(`Tool ${error.toolName} timed out after ${error.timeout}ms`);
    console.log('Hint:', error.troubleshootingHint);
  } else if (error instanceof ToolError) {
    console.log(`Tool ${error.toolName} failed:`, error.message);
    console.log('Original error:', error.cause);
  }
}
```

### Agent Errors

```typescript
import { AgentError } from '@contextaisdk/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof AgentError) {
    switch (error.code) {
      case 'MAX_ITERATIONS_EXCEEDED':
        console.log('Agent hit iteration limit');
        break;

      case 'NO_RESPONSE':
        console.log('Agent produced no response');
        break;

      case 'INVALID_TOOL_CALL':
        console.log('Agent tried invalid tool call');
        break;
    }
  }
}
```

### Validation Errors

```typescript
import { ValidationError } from '@contextaisdk/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
    console.log('Issues:', error.issues);
    // [{path: ['name'], message: 'Required'}]
  }
}
```

## Retry Patterns

### Simple Retry

```typescript
async function runWithRetry(agent: Agent, input: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.run(input);
    } catch (error) {
      if (error instanceof ContextAIError && error.isRetryable) {
        console.log(`Retry ${i + 1}/${maxRetries}`);
        await sleep(1000 * (i + 1)); // Exponential backoff
        continue;
      }
      throw error; // Not retryable
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Exponential Backoff

```typescript
async function runWithBackoff(
  agent: Agent,
  input: string,
  options = { maxRetries: 5, baseDelay: 1000, maxDelay: 30000 }
) {
  const { maxRetries, baseDelay, maxDelay } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.run(input);
    } catch (error) {
      if (!(error instanceof ContextAIError) || !error.isRetryable) {
        throw error;
      }

      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await sleep(delay + jitter);
    }
  }
}
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private resetTime = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTime) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
const response = await breaker.execute(() => agent.run(input));
```

## Tool Error Handling

### In Tool Implementation

Return errors instead of throwing:

```typescript
const apiTool = defineTool({
  name: 'call_api',
  execute: async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        return {
          error: 'API_ERROR',
          status: response.status,
          message: `API returned ${response.status}`,
          suggestion: 'Check if the endpoint is correct',
        };
      }
      return { data: await response.json() };
    } catch (error) {
      return {
        error: 'NETWORK_ERROR',
        message: error.message,
        suggestion: 'Check network connection',
      };
    }
  },
});
```

### Tool Timeouts

```typescript
const slowTool = defineTool({
  name: 'slow_operation',
  timeout: 30000, // 30 seconds
  execute: async (input) => {
    // If this takes > 30s, ToolTimeoutError is thrown
    return await slowOperation(input);
  },
});
```

## Graceful Degradation

### Partial Success

```typescript
const response = await agent.run(input);

if (!response.success) {
  // Agent couldn't fully complete but has partial result
  console.log('Partial result:', response.output);

  if (response.error) {
    console.log('Error:', response.error.message);
  }

  // Check trace for what went wrong
  const failedStep = response.trace.steps.find(
    (s) => s.type === 'observation' && s.content?.error
  );
  if (failedStep) {
    console.log('Failed at:', failedStep);
  }
}
```

### Fallback Responses

```typescript
async function runWithFallback(agent: Agent, input: string) {
  try {
    return await agent.run(input);
  } catch (error) {
    if (error instanceof ProviderError && error.code === 'RATE_LIMITED') {
      // Fallback to simpler model
      const fallbackAgent = new Agent({
        ...agent.config,
        llm: fallbackProvider,
      });
      return await fallbackAgent.run(input);
    }
    throw error;
  }
}
```

## Logging Errors

```typescript
function logError(error: unknown, context: Record<string, unknown>) {
  if (error instanceof ContextAIError) {
    logger.error({
      type: error.constructor.name,
      code: error.code,
      message: error.message,
      severity: error.severity,
      isRetryable: error.isRetryable,
      hint: error.troubleshootingHint,
      cause: error.cause?.message,
      ...context,
    });
  } else if (error instanceof Error) {
    logger.error({
      type: 'UnknownError',
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
}

// Usage
try {
  await agent.run(input);
} catch (error) {
  logError(error, { input, userId, sessionId });
  throw error;
}
```

## Testing Error Handling

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ProviderError, ToolError } from '@contextaisdk/core';

describe('error handling', () => {
  it('handles provider rate limiting', async () => {
    const mockProvider = {
      chat: vi.fn().mockRejectedValue(
        new ProviderError('Rate limited', 'RATE_LIMITED')
      ),
    };

    const agent = new Agent({ llm: mockProvider });

    await expect(agent.run('test')).rejects.toThrow(ProviderError);
  });

  it('handles tool failures gracefully', async () => {
    const failingTool = defineTool({
      name: 'failing',
      execute: async () => {
        throw new Error('Tool failed');
      },
    });

    const agent = new Agent({ tools: [failingTool] });

    // Tool errors returned, not thrown
    const response = await agent.run('use failing tool');
    expect(response.trace.steps).toContainEqual(
      expect.objectContaining({
        type: 'observation',
        content: expect.objectContaining({ error: expect.anything() }),
      })
    );
  });
});
```

## Secure Error Logging

When logging errors, ensure sensitive data is redacted:

```typescript
import { createSafeLogger, redactObject, consoleLogger } from '@contextaisdk/core';

// Create a safe logger that auto-redacts secrets
const logger = createSafeLogger(consoleLogger);

function logError(error: unknown, context: Record<string, unknown>) {
  // Context is automatically redacted by safe logger
  if (error instanceof ContextAIError) {
    logger.error({
      type: error.constructor.name,
      code: error.code,
      message: error.message,
      severity: error.severity,
      isRetryable: error.isRetryable,
      hint: error.troubleshootingHint,
      ...context,  // Any secrets here will be redacted
    });
  } else if (error instanceof Error) {
    logger.error({
      type: 'UnknownError',
      message: error.message,
      ...context,
    });
  }
}

// Usage
try {
  await agent.run(input);
} catch (error) {
  logError(error, {
    input,
    userId,
    apiKey: config.apiKey,  // Will be '[REDACTED]'
  });
  throw error;
}
```

### Manual Redaction

For non-logger contexts:

```typescript
import { redactObject } from '@contextaisdk/core';

// Before sending to error tracking
const { data: safeContext } = redactObject({
  request: req.body,
  headers: req.headers,  // Authorization headers redacted
  config: appConfig,     // API keys redacted
});

errorTracker.captureException(error, { extra: safeContext });
```

See [Secure Logging Guide](./secure-logging.md) for complete documentation.

## Best Practices

### 1. Always Use Typed Errors

```typescript
// Good
if (error instanceof ProviderError) {
  // Handle provider-specific
}

// Bad
if (error.message.includes('rate')) {
  // Fragile
}
```

### 2. Check isRetryable

```typescript
// Good
if (error.isRetryable) {
  await retry();
}

// Bad
// Retrying non-retryable errors
```

### 3. Log with Context

```typescript
// Good
logger.error({ error, input, userId, sessionId });

// Bad
console.error(error);
```

### 4. Return Errors in Tools

```typescript
// Good
return { error: 'NOT_FOUND', message: '...' };

// Bad (unless truly fatal)
throw new Error('Not found');
```

## Next Steps

- [Secure Logging](./secure-logging.md) - Prevent secrets in logs
- [Security Concepts](../../concepts/security.md) - SDK security overview
- [Create Agent](./create-agent.md)
- [Add Tools](./add-tools.md)
