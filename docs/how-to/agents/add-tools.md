# How to Add Custom Tools

Extend your agent's capabilities with custom tools.

## What Are Tools?

Tools let agents perform actions beyond text generation:
- Search databases or APIs
- Execute calculations
- Create or modify data
- Interact with external services

## Basic Tool Creation

### Step 1: Define the Tool

```typescript
import { defineTool } from '@contextai/core';
import { z } from 'zod';

const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression like "2 + 2"'),
  }),
  execute: async ({ expression }) => {
    const result = Function(`"use strict"; return (${expression})`)();
    return { result, expression };
  },
});
```

### Step 2: Add to Agent

```typescript
import { Agent } from '@contextai/core';

const agent = new Agent({
  name: 'Math Assistant',
  systemPrompt: 'Help with math. Use calculator for calculations.',
  llm: provider,
  tools: [calculatorTool],
});
```

### Step 3: Run

```typescript
const response = await agent.run('What is 15% of 250?');
console.log(response.output); // "15% of 250 is 37.5"

// See tool usage in trace
console.log(response.trace.steps);
// [
//   { type: 'thought', content: 'I need to calculate...' },
//   { type: 'action', tool: 'calculator', input: { expression: '250 * 0.15' } },
//   { type: 'observation', content: { result: 37.5 } },
// ]
```

## Tool Structure

```typescript
interface ToolConfig {
  name: string;           // Unique identifier
  description: string;    // What the tool does (shown to LLM)
  parameters: z.ZodObject; // Input schema (Zod)
  execute: (input, context) => Promise<any>; // Implementation
  timeout?: number;       // Max execution time (ms)
  retries?: number;       // Retry attempts on failure
}
```

## Zod Schema Patterns

### Required Parameters

```typescript
const tool = defineTool({
  parameters: z.object({
    query: z.string(),
    limit: z.number(),
  }),
  // ...
});
```

### Optional Parameters

```typescript
const tool = defineTool({
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional(),       // Optional
    format: z.string().default('json'), // With default
  }),
  // ...
});
```

### Enums and Unions

```typescript
const tool = defineTool({
  parameters: z.object({
    unit: z.enum(['celsius', 'fahrenheit']),
    priority: z.union([z.literal('low'), z.literal('high')]),
  }),
  // ...
});
```

### Complex Objects

```typescript
const tool = defineTool({
  parameters: z.object({
    filters: z.object({
      category: z.string(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
    }),
    sort: z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    }).optional(),
  }),
  // ...
});
```

### Arrays

```typescript
const tool = defineTool({
  parameters: z.object({
    tags: z.array(z.string()),
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number(),
    })),
  }),
  // ...
});
```

### Descriptions

Add `.describe()` to help the LLM understand parameters:

```typescript
const tool = defineTool({
  parameters: z.object({
    query: z.string()
      .min(1)
      .describe('Search keywords, e.g., "TypeScript tutorial"'),
    limit: z.number()
      .int()
      .min(1)
      .max(50)
      .describe('Number of results (1-50)')
      .default(10),
  }),
  // ...
});
```

## Tool Implementations

### API Integration

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('City name'),
    country: z.string().optional().describe('Country code (e.g., US)'),
  }),
  timeout: 10000,
  execute: async ({ city, country }) => {
    const url = `https://api.weather.com/v1/current?city=${city}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { error: 'WEATHER_API_ERROR', status: response.status };
    }

    return response.json();
  },
});
```

### Database Query

```typescript
const searchTool = defineTool({
  name: 'search_products',
  description: 'Search product catalog',
  parameters: z.object({
    query: z.string(),
    category: z.string().optional(),
    limit: z.number().default(10),
  }),
  execute: async ({ query, category, limit }) => {
    const results = await db.products.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
        ...(category && { category }),
      },
      take: limit,
    });

    return { results, count: results.length };
  },
});
```

### File Operations

```typescript
const readFileTool = defineTool({
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: z.object({
    path: z.string().describe('File path relative to project root'),
  }),
  execute: async ({ path }) => {
    try {
      // Validate path for security
      if (path.includes('..') || path.startsWith('/')) {
        return { error: 'INVALID_PATH', message: 'Path traversal not allowed' };
      }

      const content = await fs.readFile(path, 'utf-8');
      return { content, path };
    } catch (error) {
      return { error: 'FILE_NOT_FOUND', path };
    }
  },
});
```

### External Service

```typescript
const sendEmailTool = defineTool({
  name: 'send_email',
  description: 'Send an email to a recipient',
  parameters: z.object({
    to: z.string().email(),
    subject: z.string().max(200),
    body: z.string().max(10000),
  }),
  timeout: 30000,
  execute: async ({ to, subject, body }) => {
    try {
      await emailService.send({ to, subject, body });
      return { success: true, to, subject };
    } catch (error) {
      return { error: 'EMAIL_FAILED', message: error.message };
    }
  },
});
```

## Error Handling

### Return Errors (Preferred)

Let the agent see and handle errors:

```typescript
const tool = defineTool({
  execute: async (input) => {
    try {
      const result = await riskyOperation(input);
      return { success: true, result };
    } catch (error) {
      // Return error info - agent can see this
      return {
        error: error.code || 'UNKNOWN',
        message: error.message,
        suggestion: 'Try a different input',
      };
    }
  },
});
```

### Throw Errors (Stop Execution)

For fatal errors that should stop the agent:

```typescript
import { ToolError } from '@contextai/core';

const tool = defineTool({
  execute: async (input) => {
    if (!input.required) {
      throw new ToolError(
        'Required parameter missing',
        'my_tool',
        new Error('Missing required')
      );
    }
    // ...
  },
});
```

## Tool Context

Access runtime context in your tool:

```typescript
const tool = defineTool({
  execute: async (input, context) => {
    // Session identifier
    const sessionId = context.sessionId;

    // Custom metadata
    const userId = context.metadata?.userId;

    // Use in your logic
    return { result: 'done', session: sessionId };
  },
});

// Provide context when running
const agent = new Agent({
  tools: [tool],
  sessionId: 'session-123',
});
```

## Multiple Tools

```typescript
const agent = new Agent({
  name: 'Full-Stack Assistant',
  systemPrompt: `You can:
    - search: Find information
    - calculate: Do math
    - send_email: Send emails

    Use the appropriate tool for each task.`,
  llm: provider,
  tools: [searchTool, calculatorTool, sendEmailTool],
});
```

## Tool Timeouts

```typescript
const slowTool = defineTool({
  name: 'slow_operation',
  timeout: 60000, // 60 seconds
  execute: async (input) => {
    // Long-running operation
    return await longProcess(input);
  },
});
```

If exceeded, a `ToolTimeoutError` is thrown.

## Tool Retries

```typescript
const flakyTool = defineTool({
  name: 'flaky_api',
  retries: 3, // Retry up to 3 times
  execute: async (input) => {
    return await sometimesFailsAPI(input);
  },
});
```

## Testing Tools

```typescript
import { describe, it, expect } from 'vitest';

describe('calculator tool', () => {
  it('calculates expressions', async () => {
    const result = await calculatorTool.execute(
      { expression: '2 + 2' },
      { sessionId: 'test' }
    );

    expect(result).toEqual({
      result: 4,
      expression: '2 + 2',
    });
  });

  it('handles invalid expressions', async () => {
    const result = await calculatorTool.execute(
      { expression: 'invalid' },
      { sessionId: 'test' }
    );

    expect(result.error).toBeDefined();
  });
});
```

## Best Practices

### 1. Clear Descriptions

```typescript
// Good
defineTool({
  name: 'search_docs',
  description: 'Search technical documentation by keyword. Returns up to 5 matching docs with titles and summaries.',
});

// Bad
defineTool({
  name: 'search',
  description: 'Search stuff',
});
```

### 2. Validate Inputs

```typescript
defineTool({
  parameters: z.object({
    email: z.string().email(),           // Validates format
    age: z.number().int().min(0).max(150), // Validates range
    url: z.string().url(),               // Validates URL
  }),
});
```

### 3. Return Structured Data

```typescript
// Good
return {
  success: true,
  results: [...],
  count: 5,
  query: input.query,
};

// Bad
return results; // No context
```

### 4. Handle Errors Gracefully

```typescript
// Good
return {
  error: 'NOT_FOUND',
  message: 'Product not found',
  suggestion: 'Check the product ID and try again',
};

// Bad
throw new Error('Not found'); // Agent can't recover
```

## Next Steps

- [Streaming Responses](./streaming-agent.md)
- [Error Handling](./error-handling.md)
- [Tools Concept](../../concepts/tools.md) - Deep dive
