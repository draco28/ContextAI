# OpenAI Provider Integration

Complete guide to using OpenAI models with ContextAI.

## Installation

```bash
pnpm add @contextai/provider-openai openai
```

## Quick Start

```typescript
import { OpenAIProvider } from '@contextai/provider-openai';
import { Agent } from '@contextai/core';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: provider,
});

const response = await agent.run('Hello!');
```

## Configuration

### Basic Options

```typescript
const provider = new OpenAIProvider({
  // Required
  apiKey: process.env.OPENAI_API_KEY!,

  // Model selection
  model: 'gpt-4o', // Default

  // Optional
  organization: 'org-xxx', // OpenAI organization ID
  timeout: 60000, // Request timeout (ms)
  maxRetries: 2, // Retry attempts on failure
});
```

### Available Models

```typescript
import { OpenAIModels } from '@contextai/provider-openai';

// GPT-4o (recommended)
OpenAIModels.GPT_4O // 'gpt-4o'
OpenAIModels.GPT_4O_MINI // 'gpt-4o-mini'

// GPT-4 Turbo
OpenAIModels.GPT_4_TURBO // 'gpt-4-turbo'

// GPT-3.5
OpenAIModels.GPT_3_5_TURBO // 'gpt-3.5-turbo'

// O1 (reasoning)
OpenAIModels.O1 // 'o1'
OpenAIModels.O1_MINI // 'o1-mini'
OpenAIModels.O1_PREVIEW // 'o1-preview'
```

## Streaming

### Basic Streaming

```typescript
for await (const chunk of provider.streamChat(messages)) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.text);
  }
}
```

### With Agent

```typescript
for await (const event of agent.stream('Tell me a story')) {
  if (event.type === 'text') {
    process.stdout.write(event.text);
  } else if (event.type === 'thought') {
    console.log('Thinking:', event.content);
  }
}
```

## Tool Calling

OpenAI has excellent native tool support:

```typescript
import { defineTool } from '@contextai/core';
import { z } from 'zod';

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    return { temperature: 72, condition: 'sunny' };
  },
});

const agent = new Agent({
  name: 'Weather Assistant',
  systemPrompt: 'Help users with weather queries.',
  llm: provider,
  tools: [weatherTool],
});
```

## OpenRouter Integration

Use any model via OpenRouter:

```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'anthropic/claude-3-opus', // Any OpenRouter model
});
```

## Azure OpenAI

```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseURL: `https://${RESOURCE_NAME}.openai.azure.com/openai/deployments/${DEPLOYMENT_NAME}`,
  // Azure uses deployment names instead of model names
  model: 'gpt-4', // Your deployment's base model
});
```

## Rate Limiting

### Check Limits

```typescript
const limits = await provider.getRateLimits();
console.log('Requests remaining:', limits.requestsRemaining);
console.log('Tokens remaining:', limits.tokensRemaining);
console.log('Resets at:', limits.resetsAt);
```

### Handle Rate Limits

```typescript
import { ProviderError } from '@contextai/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ProviderError && error.code === 'RATE_LIMITED') {
    const retryAfter = error.metadata?.retryAfterMs || 60000;
    console.log(`Rate limited. Retry after ${retryAfter}ms`);
    await new Promise((r) => setTimeout(r, retryAfter));
    // Retry...
  }
}
```

## Error Handling

```typescript
import { ProviderError } from '@contextai/core';

try {
  const response = await provider.chat(messages);
} catch (error) {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'AUTH_ERROR':
        console.error('Invalid API key');
        break;
      case 'RATE_LIMITED':
        console.error('Rate limited, retry later');
        break;
      case 'CONTEXT_LENGTH_EXCEEDED':
        console.error('Message too long for model');
        break;
      case 'MODEL_NOT_FOUND':
        console.error('Model not available');
        break;
      default:
        console.error('Provider error:', error.message);
    }
  }
}
```

## Best Practices

### 1. Model Selection

| Use Case | Recommended Model |
|----------|-------------------|
| General tasks | `gpt-4o-mini` |
| Complex reasoning | `gpt-4o` |
| Cost-sensitive | `gpt-3.5-turbo` |
| Long context | `gpt-4o` (128K) |

### 2. Token Management

```typescript
const agent = new Agent({
  llm: provider,
  maxContextTokens: 4000, // Limit context size
});
```

### 3. Streaming for UX

Always stream for user-facing applications:

```typescript
// Good: Immediate feedback
for await (const event of agent.stream(input)) {
  displayToUser(event);
}

// Avoid: Long wait for complete response
const response = await agent.run(input);
```

## Troubleshooting

### "Invalid API Key"

```bash
# Check your key is set
echo $OPENAI_API_KEY

# Verify it works
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Context Length Exceeded"

Reduce input size or use a larger context model:

```typescript
const provider = new OpenAIProvider({
  model: 'gpt-4o', // 128K context
});
```

### Slow Responses

1. Use streaming for perceived speed
2. Consider `gpt-4o-mini` for faster responses
3. Check network latency to OpenAI

## Next Steps

- [Anthropic Provider](./anthropic.md) - Claude models
- [Ollama Provider](./ollama.md) - Local models
- [Create Agent](../../how-to/agents/create-agent.md) - Agent setup
