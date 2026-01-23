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
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';

const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression like "2 + 2"'),
  }),
  execute: async ({ expression }, context) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return { success: true, data: { result, expression } };
    } catch (error) {
      return { success: false, error: 'Invalid expression' };
    }
  },
});
```

### Step 2: Add to Agent

```typescript
import { Agent } from '@contextaisdk/core';

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
//   { type: 'thought', content: 'I need to calculate...', timestamp: 1234567890 },
//   { type: 'action', tool: 'calculator', input: { expression: '250 * 0.15' }, timestamp: 1234567891 },
//   { type: 'observation', result: { result: 37.5, expression: '250 * 0.15' }, success: true, timestamp: 1234567892 },
// ]
```

## Tool Structure

```typescript
interface ToolConfig<TInput, TOutput> {
  name: string;           // Unique identifier
  description: string;    // What the tool does (shown to LLM)
  parameters: z.ZodType<TInput>; // Input schema (Zod)
  execute: (input: TInput, context: ToolExecuteContext) => Promise<ToolResult<TOutput>>;
  timeout?: number;       // Max execution time (ms, default: 30000)
  outputSchema?: z.ZodType<TOutput>; // Optional output validation
}

// Tool must return this structure
interface ToolResult<T = unknown> {
  success: boolean;       // Did the tool execute successfully?
  data?: T;               // Result data (when success: true)
  error?: string;         // Error message (when success: false)
}

// Context passed to execute function
interface ToolExecuteContext {
  signal?: AbortSignal;   // For cancellation
  metadata?: Record<string, unknown>; // Additional metadata
  timeout?: number;       // Runtime timeout override
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
  execute: async ({ city, country }, context) => {
    const url = `https://api.weather.com/v1/current?city=${city}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `WEATHER_API_ERROR: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
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
  execute: async ({ query, category, limit }, context) => {
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

    return { success: true, data: { results, count: results.length } };
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
  execute: async ({ path }, context) => {
    // Validate path for security
    if (path.includes('..') || path.startsWith('/')) {
      return { success: false, error: 'INVALID_PATH: Path traversal not allowed' };
    }

    try {
      const content = await fs.readFile(path, 'utf-8');
      return { success: true, data: { content, path } };
    } catch (error) {
      return { success: false, error: 'FILE_NOT_FOUND' };
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
  execute: async ({ to, subject, body }, context) => {
    try {
      await emailService.send({ to, subject, body });
      return { success: true, data: { to, subject } };
    } catch (error) {
      return { success: false, error: `EMAIL_FAILED: ${error.message}` };
    }
  },
});
```

## Error Handling

### Return Errors (Preferred)

Let the agent see and handle errors by using the `ToolResult` pattern:

```typescript
const tool = defineTool({
  execute: async (input, context) => {
    try {
      const result = await riskyOperation(input);
      // Success: return data
      return { success: true, data: result };
    } catch (error) {
      // Failure: return error string - agent can see this and adapt
      return {
        success: false,
        error: `${error.code || 'UNKNOWN'}: ${error.message}`,
      };
    }
  },
});
```

### Throw Errors (Stop Execution)

For fatal errors that should stop the agent:

```typescript
import { ToolError } from '@contextaisdk/core';

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
    // Custom metadata (passed via agent config or run options)
    const userId = context.metadata?.userId;

    // Use in your logic
    return { success: true, data: { result: 'done', userId } };
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
  execute: async (input, context) => {
    // Long-running operation
    const result = await longProcess(input);
    return { success: true, data: result };
  },
});
```

If exceeded, a `ToolTimeoutError` is thrown.

## Tool Retries

```typescript
const flakyTool = defineTool({
  name: 'flaky_api',
  retries: 3, // Retry up to 3 times
  execute: async (input, context) => {
    const result = await sometimesFailsAPI(input);
    return { success: true, data: result };
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
      {} // ToolExecuteContext (optional fields)
    );

    expect(result).toEqual({
      success: true,
      data: { result: 4, expression: '2 + 2' },
    });
  });

  it('handles invalid expressions', async () => {
    const result = await calculatorTool.execute(
      { expression: 'invalid' },
      {}
    );

    expect(result.success).toBe(false);
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
// Good - ToolResult with structured data
return {
  success: true,
  data: {
    results: [...],
    count: 5,
    query: input.query,
  },
};

// Bad - Missing ToolResult wrapper
return { results }; // Agent can't tell if this succeeded
```

### 4. Handle Errors Gracefully

```typescript
// Good - ToolResult with error info
return {
  success: false,
  error: 'NOT_FOUND: Product not found. Try a different product ID.',
};

// Bad - Throwing stops the agent entirely
throw new Error('Not found'); // Agent can't recover
```

## Next Steps

- [Streaming Responses](./streaming-agent.md)
- [Error Handling](./error-handling.md)
- [Tools Concept](../../concepts/tools.md) - Deep dive
