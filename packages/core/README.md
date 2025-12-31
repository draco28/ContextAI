# @contextai/core

> TypeScript-first AI Agent SDK with ReAct reasoning

## Installation

```bash
npm install @contextai/core zod
# or
pnpm add @contextai/core zod
```

## Quick Start

```typescript
import { Agent, defineTool } from '@contextai/core';
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

## License

MIT
