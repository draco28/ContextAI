# Anthropic Provider Integration

Complete guide to using Claude models with ContextAI.

## Installation

```bash
pnpm add @contextaisdk/provider-anthropic @anthropic-ai/sdk
```

## Quick Start

```typescript
import { AnthropicProvider } from '@contextaisdk/provider-anthropic';
import { Agent } from '@contextaisdk/core';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});

const agent = new Agent({
  name: 'Claude Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: provider,
});

const response = await agent.run('Hello!');
```

## Configuration

### Basic Options

```typescript
const provider = new AnthropicProvider({
  // Required
  apiKey: process.env.ANTHROPIC_API_KEY!,

  // Model selection
  model: 'claude-sonnet-4-20250514', // Default

  // Optional
  timeout: 60000, // Request timeout (ms)
  maxRetries: 2, // Retry attempts
  betaFeatures: [], // Enable beta features
});
```

### Available Models

```typescript
import { AnthropicModels } from '@contextaisdk/provider-anthropic';

// Claude 4 (Latest)
AnthropicModels.CLAUDE_OPUS_4 // 'claude-opus-4-20250514'
AnthropicModels.CLAUDE_SONNET_4 // 'claude-sonnet-4-20250514'

// Claude 3.5
AnthropicModels.CLAUDE_3_5_SONNET // 'claude-3-5-sonnet-20241022'
AnthropicModels.CLAUDE_3_5_HAIKU // 'claude-3-5-haiku-20241022'

// Claude 3
AnthropicModels.CLAUDE_3_OPUS // 'claude-3-opus-20240229'
AnthropicModels.CLAUDE_3_SONNET // 'claude-3-sonnet-20240229'
AnthropicModels.CLAUDE_3_HAIKU // 'claude-3-haiku-20240307'
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
for await (const event of agent.stream('Explain quantum computing')) {
  if (event.type === 'text') {
    process.stdout.write(event.text);
  } else if (event.type === 'thought') {
    console.log('Thinking:', event.content);
  }
}
```

## Extended Thinking

Claude can show its reasoning process:

```typescript
for await (const chunk of provider.streamChat(messages)) {
  switch (chunk.type) {
    case 'thinking':
      // Claude's internal reasoning
      console.log('[Thinking]', chunk.text);
      break;
    case 'text':
      // Final response
      process.stdout.write(chunk.text);
      break;
  }
}
```

## Tool Calling

Claude has excellent tool support:

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';

const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression to evaluate'),
  }),
  execute: async ({ expression }, context) => {
    return { success: true, data: { result: eval(expression) } };
  },
});

const agent = new Agent({
  name: 'Math Assistant',
  systemPrompt: 'Help users with calculations.',
  llm: provider,
  tools: [calculatorTool],
});
```

## Beta Features

### Prompt Caching

Reduce costs on repeated prompts:

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
  betaFeatures: ['prompt-caching-2024-07-31'],
});
```

### Enabling Beta Features

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  betaFeatures: [
    'prompt-caching-2024-07-31',
    // Add other beta features as available
  ],
});
```

## Rate Limiting

### Check Limits

```typescript
const limits = await provider.getRateLimits();
console.log('Requests remaining:', limits.requestsRemaining);
console.log('Tokens remaining:', limits.tokensRemaining);
```

### Handle Rate Limits

```typescript
import { ProviderError } from '@contextaisdk/core';

try {
  await agent.run(input);
} catch (error) {
  if (error instanceof ProviderError && error.code === 'RATE_LIMITED') {
    const retryAfter = error.metadata?.retryAfterMs || 60000;
    await new Promise((r) => setTimeout(r, retryAfter));
    // Retry...
  }
}
```

## Error Handling

```typescript
import { ProviderError } from '@contextaisdk/core';

try {
  const response = await provider.chat(messages);
} catch (error) {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'AUTH_ERROR':
        console.error('Invalid API key');
        break;
      case 'RATE_LIMITED':
        console.error('Rate limited');
        break;
      case 'CONTEXT_LENGTH_EXCEEDED':
        console.error('Message too long');
        break;
      case 'OVERLOADED':
        console.error('API overloaded, try again');
        break;
      default:
        console.error('Error:', error.message);
    }
  }
}
```

## Best Practices

### 1. Model Selection

| Use Case | Recommended Model |
|----------|-------------------|
| Complex tasks | Claude Opus 4 |
| Balanced | Claude Sonnet 4 |
| Fast/cheap | Claude 3.5 Haiku |
| Long context | Any (200K context) |

### 2. System Prompts

Claude responds well to clear, structured prompts:

```typescript
const agent = new Agent({
  systemPrompt: `You are a technical assistant.

Guidelines:
- Be concise and accurate
- Provide code examples when relevant
- Ask clarifying questions if needed

Your expertise: TypeScript, React, Node.js`,
  llm: provider,
});
```

### 3. Streaming for UX

```typescript
// Always stream for user-facing apps
for await (const event of agent.stream(input)) {
  displayToUser(event);
}
```

## Claude-Specific Features

### Long Context (200K tokens)

Claude supports up to 200K tokens of context:

```typescript
const agent = new Agent({
  llm: provider,
  maxContextTokens: 100000, // Use up to 100K
});
```

### XML-Friendly

Claude excels with structured XML:

```typescript
const agent = new Agent({
  systemPrompt: `Process user requests and respond with:

<response>
  <summary>Brief summary</summary>
  <details>Detailed explanation</details>
  <action>Recommended next step</action>
</response>`,
  llm: provider,
});
```

## Troubleshooting

### "Invalid API Key"

```bash
# Check your key is set
echo $ANTHROPIC_API_KEY

# Verify format (should start with sk-ant-)
```

### "Overloaded" Errors

Anthropic API can be overloaded during peak times:

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxRetries: 3, // Increase retries
  timeout: 120000, // Increase timeout
});
```

### Slow Responses

1. Use streaming for perceived speed
2. Consider Claude 3.5 Haiku for faster responses
3. Enable prompt caching for repeated contexts

## Next Steps

- [OpenAI Provider](./openai.md) - GPT models
- [Ollama Provider](./ollama.md) - Local models
- [Streaming Agent](../../how-to/agents/streaming-agent.md) - Stream setup
