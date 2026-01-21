# Tools

Building type-safe tools that agents can use to interact with the world.

## What are Tools?

Tools extend what an agent can do beyond generating text. They allow agents to:

- **Search** databases, APIs, or the web
- **Calculate** math, dates, or statistics
- **Create** files, records, or resources
- **Read** documents, code, or data
- **Execute** commands or workflows

## Defining Tools

### Basic Tool

```typescript
import { defineTool } from '@contextai/core';
import { z } from 'zod';

const searchTool = defineTool({
  name: 'search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    const results = await searchAPI(query);
    return { results };
  },
});
```

### Tool Configuration

```typescript
interface ToolConfig<T extends z.ZodObject<any>> {
  // Required
  name: string;                    // Unique identifier
  description: string;             // What this tool does (shown to LLM)
  parameters: T;                   // Zod schema for input validation
  execute: (input: z.infer<T>, context: ToolContext) => Promise<ToolResult>;

  // Optional
  timeout?: number;                // Max execution time (default: 30000ms)
  retries?: number;                // Retry attempts (default: 0)
  outputSchema?: z.ZodType;        // Validate output shape
}
```

## Zod Schema Patterns

### Required vs Optional Parameters

```typescript
const tool = defineTool({
  name: 'weather',
  parameters: z.object({
    city: z.string(),                              // Required
    unit: z.enum(['celsius', 'fahrenheit'])        // Required enum
      .default('celsius'),                         // With default
    detailed: z.boolean().optional(),              // Optional
  }),
  // ...
});
```

### Complex Types

```typescript
const tool = defineTool({
  name: 'create_event',
  parameters: z.object({
    title: z.string().min(1).max(100),
    date: z.string().datetime(),
    attendees: z.array(z.string().email()).max(50),
    location: z.object({
      name: z.string(),
      address: z.string().optional(),
    }).optional(),
    priority: z.enum(['low', 'medium', 'high']),
  }),
  // ...
});
```

### Descriptions for LLM Understanding

```typescript
const tool = defineTool({
  name: 'database_query',
  parameters: z.object({
    table: z.string()
      .describe('Database table name (users, orders, products)'),
    filters: z.record(z.string(), z.unknown())
      .describe('Key-value pairs for WHERE clause'),
    limit: z.number().int().positive().max(100)
      .describe('Maximum rows to return')
      .default(10),
  }),
  // ...
});
```

## Tool Execution

### Basic Execution

```typescript
const tool = defineTool({
  name: 'calculator',
  parameters: z.object({
    expression: z.string(),
  }),
  execute: async ({ expression }) => {
    const result = evaluate(expression);
    return { result };
  },
});
```

### With Context

Access runtime context:

```typescript
const tool = defineTool({
  name: 'user_action',
  parameters: z.object({
    action: z.string(),
  }),
  execute: async ({ action }, context) => {
    // Access injected context
    const userId = context.sessionId;
    const metadata = context.metadata;

    return { performed: action, user: userId };
  },
});
```

### Error Handling

Return structured errors:

```typescript
const tool = defineTool({
  name: 'file_read',
  parameters: z.object({
    path: z.string(),
  }),
  execute: async ({ path }) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return { content };
    } catch (error) {
      // Return error info - don't throw
      return {
        error: 'FILE_NOT_FOUND',
        message: `File not found: ${path}`,
        suggestion: 'Check if the file path is correct',
      };
    }
  },
});
```

### Timeout Handling

```typescript
const tool = defineTool({
  name: 'slow_api',
  parameters: z.object({ query: z.string() }),
  timeout: 60000, // 60 seconds
  execute: async ({ query }) => {
    // Long-running operation
    return await slowExternalAPI(query);
  },
});
```

If timeout is exceeded, a `ToolTimeoutError` is thrown.

### Retries

```typescript
const tool = defineTool({
  name: 'flaky_api',
  parameters: z.object({ id: z.string() }),
  retries: 3,
  execute: async ({ id }) => {
    // Will retry up to 3 times on failure
    return await sometimesFailsAPI(id);
  },
});
```

## Output Validation

Validate tool output:

```typescript
const tool = defineTool({
  name: 'get_user',
  parameters: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  execute: async ({ userId }) => {
    const user = await db.getUser(userId);
    return user; // Validated against outputSchema
  },
});
```

## Tool Categories

### Information Retrieval

```typescript
const searchTool = defineTool({
  name: 'search_knowledge',
  description: 'Search the knowledge base for relevant information',
  parameters: z.object({
    query: z.string(),
    limit: z.number().default(5),
  }),
  execute: async ({ query, limit }) => {
    const results = await ragEngine.search(query, { topK: limit });
    return { results: results.chunks };
  },
});
```

### Data Manipulation

```typescript
const createRecordTool = defineTool({
  name: 'create_task',
  description: 'Create a new task in the task management system',
  parameters: z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  execute: async (input) => {
    const task = await taskService.create(input);
    return { taskId: task.id, status: 'created' };
  },
});
```

### Calculations

```typescript
const calculatorTool = defineTool({
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression like "2 + 2" or "sqrt(16)"'),
  }),
  execute: async ({ expression }) => {
    // Use a safe math parser (not eval!)
    const result = mathjs.evaluate(expression);
    return { result, expression };
  },
});
```

### External APIs

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    city: z.string(),
    country: z.string().optional(),
  }),
  timeout: 10000,
  execute: async ({ city, country }) => {
    const response = await fetch(
      `https://api.weather.com/current?city=${city}&country=${country || ''}`
    );
    if (!response.ok) {
      return { error: 'WEATHER_API_ERROR', status: response.status };
    }
    return response.json();
  },
});
```

## Using Tools with Agents

```typescript
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: `You help users with various tasks.

    Available tools:
    - search: Find information
    - calculate: Do math
    - create_task: Create tasks

    Use tools when appropriate.`,
  llm: provider,
  tools: [searchTool, calculatorTool, createTaskTool],
});
```

## Tool Best Practices

### 1. Write Clear Descriptions

```typescript
// Good: Specific, actionable
defineTool({
  name: 'search_products',
  description: 'Search the product catalog by name, category, or SKU. Returns up to 10 matching products with prices.',
});

// Bad: Vague
defineTool({
  name: 'search',
  description: 'Search for things',
});
```

### 2. Use Descriptive Parameter Names

```typescript
// Good
z.object({
  searchQuery: z.string().describe('Keywords to search for'),
  maxResults: z.number().describe('Maximum products to return (1-50)'),
});

// Bad
z.object({
  q: z.string(),
  n: z.number(),
});
```

### 3. Return Structured Data

```typescript
// Good: Consistent structure
execute: async ({ query }) => {
  return {
    success: true,
    results: [...],
    count: 5,
    query,
  };
};

// Bad: Inconsistent
execute: async ({ query }) => {
  return results.length > 0 ? results : 'No results';
};
```

### 4. Handle Errors Gracefully

```typescript
execute: async ({ id }) => {
  try {
    const data = await fetch(`/api/${id}`);
    return { data };
  } catch (error) {
    // Return error info, don't throw
    return {
      error: error.code || 'UNKNOWN',
      message: error.message,
      suggestion: 'Try a different ID or check the API status',
    };
  }
};
```

### 5. Set Appropriate Timeouts

```typescript
// Fast operations: 5-10s
defineTool({ timeout: 5000, /* ... */ });

// External APIs: 10-30s
defineTool({ timeout: 15000, /* ... */ });

// Long operations: 30-60s
defineTool({ timeout: 60000, /* ... */ });
```

## Error Types

```typescript
import { ToolError, ToolTimeoutError, ValidationError } from '@contextai/core';

// ToolError - General tool failure
throw new ToolError('Failed to process', 'my_tool', originalError);

// ToolTimeoutError - Exceeded timeout
throw new ToolTimeoutError('my_tool', 30000);

// ValidationError - Invalid input/output
throw new ValidationError('Invalid parameters', zodErrors);
```

## Testing Tools

```typescript
import { describe, it, expect } from 'vitest';

describe('calculator tool', () => {
  it('should calculate expressions', async () => {
    const result = await calculatorTool.execute(
      { expression: '2 + 2' },
      { sessionId: 'test' }
    );
    expect(result).toEqual({ result: 4, expression: '2 + 2' });
  });

  it('should handle invalid expressions', async () => {
    const result = await calculatorTool.execute(
      { expression: 'invalid' },
      { sessionId: 'test' }
    );
    expect(result.error).toBeDefined();
  });
});
```

## Related Topics

- [Agents](./agents.md) - Using tools with agents
- [ReAct Pattern](./react-pattern.md) - How tools fit into reasoning
- [Error Handling](../how-to/agents/error-handling.md) - Tool error patterns
