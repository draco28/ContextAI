# @contextaisdk/core

> TypeScript-first AI Agent SDK with ReAct reasoning

## Installation

```bash
npm install @contextaisdk/core zod
# or
pnpm add @contextaisdk/core zod
```

## Quick Start

```typescript
import { Agent, defineTool } from '@contextaisdk/core';
import { z } from 'zod';

// Define a tool with Zod validation
const searchTool = defineTool({
  name: 'search',
  description: 'Search for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    // Your search implementation
    return { success: true, data: `Results for: ${query}` };
  },
});

// Create an agent
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: yourLLMProvider, // Implement LLMProvider interface
  tools: [searchTool],
});

// Run the agent
const response = await agent.run('Search for TypeScript tutorials');
console.log(response.output);
console.log(response.trace); // ReAct reasoning trace
```

## Features

- **ReAct Reasoning**: Transparent Thought → Action → Observation loops
- **Type-Safe Tools**: Zod-validated tool definitions
- **Provider Agnostic**: Works with any LLM via the `LLMProvider` interface
- **Streaming Support**: Real-time responses via `agent.stream()`
- **Full Tracing**: Debug agent reasoning with detailed traces
- **Security Utilities**: Built-in secret redaction, path validation, SQL safety

## Sub-Entry Points

For optimal startup performance, import only what you need:

| Path | Exports | Use Case |
|------|---------|----------|
| `@contextaisdk/core` | Everything | Full package (convenience) |
| `@contextaisdk/core/agent` | `Agent`, types | Agent creation only |
| `@contextaisdk/core/tool` | `defineTool`, `Tool`, types | Tool definitions only |
| `@contextaisdk/core/provider` | `LLMProvider`, types | Provider interfaces |
| `@contextaisdk/core/errors` | Error classes | Error handling |
| `@contextaisdk/core/security` | Security utilities | Secret redaction, validation |
| `@contextaisdk/core/tools` | Built-in tools | Pre-built tool library |

### Example: Selective Import

```typescript
// Instead of importing everything:
import { Agent, defineTool, LLMProvider } from '@contextaisdk/core';

// Import only what you need:
import { Agent } from '@contextaisdk/core/agent';
import { defineTool } from '@contextaisdk/core/tool';
import type { LLMProvider } from '@contextaisdk/core/provider';
```

**Benefit**: Up to 59% faster imports when using specific sub-paths vs full package import.

## Startup Optimization

The agent is designed for fast cold starts:

- **Agent initialization**: 0.67ms (target <500ms per NFR-104)
- **741x faster** than requirement threshold

This makes `@contextaisdk/core` suitable for serverless environments where cold start latency matters.

## API Reference

### Agent

```typescript
const agent = new Agent({
  name: string;
  systemPrompt: string;
  llm: LLMProvider;
  tools?: Tool[];
  maxIterations?: number; // default: 10
});

// Non-streaming
const response = await agent.run(input, options?);

// Streaming
for await (const event of agent.stream(input, options?)) {
  // Handle events: thought, action, observation, text, done
}
```

### defineTool

```typescript
const tool = defineTool({
  name: string;
  description: string;
  parameters: ZodSchema;
  execute: (input, context) => Promise<ToolResult>;
});
```

### LLMProvider Interface

Implement this interface to connect any LLM:

```typescript
interface LLMProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: ChatMessage[], options?: GenerateOptions): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], options?: GenerateOptions): AsyncGenerator<StreamChunk>;
  isAvailable(): Promise<boolean>;
}
```

### Security Utilities

Prevent secrets from leaking into logs:

```typescript
import { createSafeLogger, redactObject, consoleLogger } from '@contextaisdk/core';

// Wrap any logger to auto-redact secrets
const logger = createSafeLogger(consoleLogger);
logger.info('Config', { apiKey: 'sk-secret' }); // apiKey becomes '[REDACTED]'

// Or redact objects manually
const { data } = redactObject({ password: 'secret123' });
// data.password === '[REDACTED]'
```

Also includes:
- `PathValidator` - Prevent path traversal attacks
- `SafeQueryBuilder` - Build SQL queries safely

## License

MIT
