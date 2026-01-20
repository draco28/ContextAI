# @contextai/provider-openai

OpenAI GPT provider for the ContextAI SDK.

## Installation

```bash
npm install @contextai/provider-openai openai
# or
pnpm add @contextai/provider-openai openai
```

> **Note**: The `openai` package is a peer dependency - you must install it separately.

## Quick Start

```typescript
import { OpenAIProvider } from '@contextai/provider-openai';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

// Non-streaming
const response = await provider.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]);

console.log(response.content);

// Streaming
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Tell me a story' },
])) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content!);
  }
}
```

## Configuration

```typescript
interface OpenAIProviderConfig {
  // Required
  apiKey: string;
  model: string; // e.g., 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'

  // Optional
  organization?: string;
  baseURL?: string; // For OpenRouter, Azure, etc.
  timeout?: number; // Request timeout in ms (default: 60000)
  maxRetries?: number; // Max retries (default: 2)
  headers?: Record<string, string>;
  defaultOptions?: Partial<GenerateOptions>;
}
```

## Features

- **Streaming**: True token-by-token streaming via async generators
- **Tool Calling**: Full function/tool calling support
- **Multimodal**: Image inputs via URL or base64
- **Structured Output**: JSON mode and JSON schema support
- **OpenAI-Compatible**: Works with OpenRouter, Azure OpenAI, and other compatible APIs

## Using with OpenRouter

```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-3-opus',
  headers: {
    'HTTP-Referer': 'https://your-app.com',
  },
});
```

## Using with ContextAI Agent

```typescript
import { Agent } from '@contextai/core';
import { OpenAIProvider } from '@contextai/provider-openai';

const agent = new Agent({
  llm: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
  }),
  tools: [/* your tools */],
});

const result = await agent.run('What is the weather in Tokyo?');
```

## Using with Z.AI GLM

```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.ZAI_API_KEY!,
  baseURL: 'https://api.z.ai/api/coding/paas/v4/',
  model: 'glm-4.7',
});
```

### Note on Reasoning Models

GLM-4.7 and similar reasoning models (like o1) use tokens for internal chain-of-thought reasoning BEFORE generating visible content. When using these models:

```typescript
// Use higher maxTokens to give the model enough budget for reasoning + content
const response = await provider.chat(messages, {
  maxTokens: 500, // Not 20-50!
});
```

With low `maxTokens` values (e.g., 20), the model may exhaust its budget on reasoning and return empty content.

## Error Handling

```typescript
import { OpenAIProviderError } from '@contextai/provider-openai';

try {
  await provider.chat(messages);
} catch (error) {
  if (error instanceof OpenAIProviderError) {
    if (error.code === 'OPENAI_RATE_LIMIT' && error.isRetryable) {
      // Wait and retry
    }
  }
}
```

## Development

### Running Tests

```bash
# Unit tests only
pnpm test

# Integration tests (requires real API key)
OPENAI_API_KEY=sk-xxx pnpm vitest run test/integration.test.ts

# Or with Z.AI
ZAI_API_KEY=xxx pnpm vitest run test/integration.test.ts
```

Integration tests hit real APIs and cost money. They're excluded from normal `pnpm test` runs.

## License

MIT
