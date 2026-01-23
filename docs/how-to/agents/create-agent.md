# How to Create an Agent

Step-by-step guide to creating your first ContextAI agent.

## Prerequisites

- Node.js 18+
- An LLM provider API key (OpenAI, Anthropic, or local Ollama)

## Basic Agent

### Step 1: Install Dependencies

```bash
pnpm add @contextaisdk/core @contextaisdk/provider-openai zod
```

### Step 2: Create the Provider

```typescript
import { OpenAIProvider } from '@contextaisdk/provider-openai';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});
```

### Step 3: Create the Agent

```typescript
import { Agent } from '@contextaisdk/core';

const agent = new Agent({
  name: 'My Assistant',
  systemPrompt: 'You are a helpful assistant. Be concise and accurate.',
  llm: provider,
});
```

### Step 4: Run the Agent

```typescript
const response = await agent.run('What is TypeScript?');

console.log(response.output);
// "TypeScript is a typed superset of JavaScript..."

console.log(response.success);
// true
```

## Complete Example

```typescript
// agent.ts
import { Agent } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';

async function main() {
  // Create provider
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini', // Fast and cheap for testing
  });

  // Create agent
  const agent = new Agent({
    name: 'Assistant',
    systemPrompt: `You are a helpful assistant.
      - Be concise
      - Use bullet points for lists
      - Cite sources when relevant`,
    llm: provider,
  });

  // Run
  const response = await agent.run('Explain REST APIs in 3 sentences.');

  console.log('Output:', response.output);
  console.log('Tokens used:', response.trace.totalTokens);
  console.log('Duration:', response.trace.durationMs, 'ms');
}

main().catch(console.error);
```

Run with:

```bash
OPENAI_API_KEY=sk-... npx tsx agent.ts
```

## Configuration Options

### Essential Options

```typescript
const agent = new Agent({
  // Required
  name: 'Assistant',           // Identifier
  systemPrompt: '...',         // Instructions
  llm: provider,               // LLM provider

  // Optional
  tools: [],                   // Available tools
  maxIterations: 10,           // Max tool call loops
});
```

### With Tools

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';

const searchTool = defineTool({
  name: 'search',
  description: 'Search for information',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }, context) => {
    return { success: true, data: { results: ['result1', 'result2'] } };
  },
});

const agent = new Agent({
  name: 'Search Assistant',
  systemPrompt: 'Help users find information. Use search when needed.',
  llm: provider,
  tools: [searchTool],
});
```

### With Memory

```typescript
const agent = new Agent({
  name: 'Chat Assistant',
  systemPrompt: 'Remember what users tell you.',
  llm: provider,
  memory: true,
  sessionId: 'user-123',
});

// Conversation persists
await agent.run('My name is Alice');
await agent.run('What is my name?'); // "Your name is Alice"
```

### With Context Injection

```typescript
const agent = new Agent({
  name: 'Personal Assistant',
  systemPrompt: 'Help the user based on their profile.',
  llm: provider,
  context: `
    User Profile:
    - Name: Alice
    - Timezone: EST
    - Preferences: Dark mode, concise answers
  `,
});
```

## System Prompt Best Practices

### Be Specific

```typescript
// Good
const agent = new Agent({
  systemPrompt: `You are a customer support agent for TechCorp.

    Guidelines:
    - Answer questions about our products
    - Be polite and professional
    - If unsure, say "I don't know"
    - Never make up product features

    Products: Widget Pro, Widget Lite, Widget Enterprise`,
});

// Bad
const agent = new Agent({
  systemPrompt: 'Be helpful.',
});
```

### Include Constraints

```typescript
const agent = new Agent({
  systemPrompt: `You are a code reviewer.

    Rules:
    - Only review code, don't write new features
    - Focus on security, performance, readability
    - Give feedback as bullet points
    - Max 5 suggestions per review`,
});
```

### Define Response Format

```typescript
const agent = new Agent({
  systemPrompt: `You analyze data and provide insights.

    Always respond in this format:
    ## Summary
    [1-2 sentence overview]

    ## Key Findings
    - Finding 1
    - Finding 2

    ## Recommendations
    1. [Action item]`,
});
```

## Running Agents

### Async/Await

```typescript
const response = await agent.run('Hello');
console.log(response.output);
```

### With Options

```typescript
const response = await agent.run('Complex task', {
  maxIterations: 20,       // Override default
  context: 'Extra info',   // Additional context
});
```

### With Timeout

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await agent.run('Task', {
    signal: controller.signal,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
}
```

## Inspecting Results

### Response Structure

```typescript
const response = await agent.run('Question');

// The final answer
console.log(response.output);

// Success status
console.log(response.success); // true or false

// Error if failed
if (response.error) {
  console.error(response.error.message);
}

// Reasoning trace
console.log(response.trace.steps);      // All reasoning steps
console.log(response.trace.iterations); // Tool call count
console.log(response.trace.totalTokens);
console.log(response.trace.durationMs);
```

### Formatting Traces

```typescript
import { formatTrace } from '@contextaisdk/core';

const response = await agent.run('Calculate 15% of 200');
console.log(formatTrace(response.trace));
```

Output:
```
=== ReAct Trace ===
[Thought] I need to calculate 15% of 200
[Action] calculator({ expression: "200 * 0.15" })
[Observation] { result: 30 }
[Thought] The calculation is complete

=== Stats ===
Iterations: 1
Tokens: 185
Duration: 1.2s
```

## Common Patterns

### Multi-Provider Support

```typescript
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { OllamaProvider } from '@contextaisdk/provider-ollama';

const prodProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

const devProvider = new OllamaProvider({
  model: 'llama3.2',
});

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: '...',
  llm: process.env.NODE_ENV === 'production' ? prodProvider : devProvider,
});
```

### Specialized Agents

```typescript
// Code review agent
const codeReviewer = new Agent({
  name: 'Code Reviewer',
  systemPrompt: 'Review code for bugs, security issues, and style.',
  llm: provider,
});

// Documentation agent
const docWriter = new Agent({
  name: 'Doc Writer',
  systemPrompt: 'Write clear, concise documentation.',
  llm: provider,
});

// Use the right agent for the task
const review = await codeReviewer.run(`Review this: ${code}`);
const docs = await docWriter.run(`Document this: ${code}`);
```

## Troubleshooting

### "Agent not responding"

Check if the provider is available:

```typescript
if (await provider.isAvailable()) {
  const response = await agent.run(input);
} else {
  console.error('Provider not available');
}
```

### "Max iterations exceeded"

Increase the limit or simplify the task:

```typescript
const agent = new Agent({
  maxIterations: 20, // Increase from default 10
});
```

### "Token limit exceeded"

Use a model with larger context or reduce input:

```typescript
const agent = new Agent({
  llm: new OpenAIProvider({ model: 'gpt-4o' }), // 128K context
  maxContextTokens: 4000, // Limit context
});
```

## Next Steps

- [Add Custom Tools](./add-tools.md) - Extend agent capabilities
- [Streaming Responses](./streaming-agent.md) - Real-time output
- [Conversation Memory](./conversation-memory.md) - Multi-turn chats
