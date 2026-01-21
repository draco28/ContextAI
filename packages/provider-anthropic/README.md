# @contextai/provider-anthropic

> Anthropic Claude LLM provider for ContextAI SDK

[![npm version](https://img.shields.io/npm/v/@contextai/provider-anthropic.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/provider-anthropic)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @contextai/provider-anthropic @anthropic-ai/sdk
# or
pnpm add @contextai/provider-anthropic @anthropic-ai/sdk
```

**Peer Dependencies:**
- @anthropic-ai/sdk ^0.25.0
- @contextai/core

## Quick Start

```typescript
import { AnthropicProvider, AnthropicModels } from '@contextai/provider-anthropic';
import { Agent } from '@contextai/core';

// Create the provider
const claude = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: AnthropicModels.CLAUDE_SONNET_4,
});

// Use with an agent
const agent = new Agent({
  name: 'Claude Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: claude,
});

const response = await agent.run('Explain quantum computing');
console.log(response.output);
```

## Configuration

```typescript
const provider = new AnthropicProvider({
  // Required
  apiKey: string;              // Your Anthropic API key

  // Model selection
  model: string;               // e.g., 'claude-sonnet-4-20250514'

  // Optional settings
  baseURL?: string;            // Custom API endpoint
  timeout?: number;            // Request timeout (default: 60000ms)
  maxRetries?: number;         // Retry attempts (default: 2)
  headers?: Record<string, string>;  // Custom headers

  // Beta features
  betaFeatures?: string[];     // Enable beta APIs

  // Default generation options
  defaultOptions?: {
    temperature?: number;      // 0-1 (default: 1)
    maxTokens?: number;        // Max response tokens
    topP?: number;             // Nucleus sampling
    stopSequences?: string[];  // Stop generation triggers
  };
});
```

## Available Models

```typescript
import { AnthropicModels } from '@contextai/provider-anthropic';

// Claude 4 (Latest)
AnthropicModels.CLAUDE_SONNET_4   // 'claude-sonnet-4-20250514'
AnthropicModels.CLAUDE_OPUS_4    // 'claude-opus-4-20250514'

// Claude 3.5
AnthropicModels.CLAUDE_3_5_SONNET  // 'claude-3-5-sonnet-20241022'
AnthropicModels.CLAUDE_3_5_HAIKU   // 'claude-3-5-haiku-20241022'

// Claude 3
AnthropicModels.CLAUDE_3_OPUS     // 'claude-3-opus-20240229'
AnthropicModels.CLAUDE_3_SONNET   // 'claude-3-sonnet-20240229'
AnthropicModels.CLAUDE_3_HAIKU    // 'claude-3-haiku-20240307'
```

## Features

### Streaming Responses

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});

// Stream tokens as they arrive
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Write a haiku about TypeScript' }
])) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content);
  }
}
```

### Tool Calling

```typescript
import { defineTool } from '@contextai/core';
import { z } from 'zod';

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ location, unit }) => {
    // Your weather API call
    return { temperature: 22, unit: unit ?? 'celsius', location };
  },
});

const agent = new Agent({
  name: 'Weather Assistant',
  systemPrompt: 'Help users check the weather.',
  llm: claude,
  tools: [weatherTool],
});

const response = await agent.run("What's the weather in Tokyo?");
```

### Extended Thinking (Claude 3.5+)

Enable Claude's extended thinking for complex reasoning:

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022',
});

// Extended thinking appears in stream as 'thinking' chunks
for await (const chunk of provider.streamChat(messages)) {
  switch (chunk.type) {
    case 'thinking':
      console.log('[Thinking]', chunk.content);
      break;
    case 'text':
      console.log('[Response]', chunk.content);
      break;
  }
}
```

### Beta Features

Enable experimental Anthropic features:

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
  betaFeatures: [
    'prompt-caching-2024-07-31',      // Prompt caching
    'max-tokens-3-5-sonnet-2024-07-15', // Extended token limits
  ],
});
```

### Rate Limit Monitoring

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});

// Check rate limits after requests
const limits = provider.getRateLimits();
console.log('Requests remaining:', limits.requestsRemaining);
console.log('Tokens remaining:', limits.tokensRemaining);
console.log('Resets at:', new Date(limits.requestsResetAt));
```

## Direct Chat API

Use the provider directly without an agent:

```typescript
// Non-streaming
const response = await provider.chat([
  { role: 'system', content: 'You are a coding assistant.' },
  { role: 'user', content: 'Write a TypeScript function to sort an array' },
], {
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
console.log('Tokens used:', response.usage);

// Streaming
for await (const chunk of provider.streamChat(messages)) {
  process.stdout.write(chunk.content);
}
```

## Error Handling

```typescript
import { AnthropicProviderError } from '@contextai/provider-anthropic';

try {
  const response = await provider.chat(messages);
} catch (error) {
  if (error instanceof AnthropicProviderError) {
    switch (error.code) {
      case 'RATE_LIMITED':
        console.log('Rate limited. Retry after:', error.retryAfter);
        break;
      case 'INVALID_API_KEY':
        console.log('Check your API key');
        break;
      case 'MODEL_NOT_FOUND':
        console.log('Invalid model:', error.details.model);
        break;
      case 'CONTEXT_LENGTH_EXCEEDED':
        console.log('Message too long');
        break;
      default:
        console.log('Error:', error.message);
    }

    // Check if retryable
    if (error.isRetryable) {
      // Implement retry logic
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMITED` | Too many requests (429) |
| `INVALID_API_KEY` | Invalid or missing API key (401) |
| `MODEL_NOT_FOUND` | Model doesn't exist (404) |
| `CONTEXT_LENGTH_EXCEEDED` | Input too long for model |
| `CONTENT_POLICY_VIOLATION` | Content blocked by safety filters |
| `SERVER_ERROR` | Anthropic server error (5xx) |
| `NETWORK_ERROR` | Connection failed |
| `TIMEOUT` | Request timed out |

## Advanced: Message Mapping

For fine-grained control over message formatting:

```typescript
import {
  mapMessages,
  extractSystemMessage,
  buildRequestParams
} from '@contextai/provider-anthropic';

// Extract system message from conversation
const { systemMessage, messages } = extractSystemMessage(conversation);

// Map to Anthropic format
const anthropicMessages = mapMessages(messages);

// Build complete request params
const params = buildRequestParams(messages, tools, options);
```

## Comparison with Direct SDK

| Feature | @contextai/provider-anthropic | @anthropic-ai/sdk |
|---------|------------------------------|-------------------|
| Agent Integration | Built-in | Manual |
| Tool Calling | Zod schemas | JSON Schema |
| Streaming | Unified interface | SDK-specific |
| Error Handling | Typed errors with hints | Raw errors |
| Rate Limits | Auto-tracked | Manual parsing |

## License

MIT
