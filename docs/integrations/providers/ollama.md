# Ollama Provider Integration

Run LLMs locally with zero API costs using Ollama.

## Prerequisites

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows - download from ollama.com
```

### Start Ollama

```bash
# Start the Ollama server
ollama serve

# Pull a model
ollama pull llama3.2
```

## Installation

```bash
pnpm add @contextaisdk/provider-ollama
# No peer dependencies required!
```

## Quick Start

```typescript
import { OllamaProvider } from '@contextaisdk/provider-ollama';
import { Agent } from '@contextaisdk/core';

const provider = new OllamaProvider({
  model: 'llama3.2',
});

const agent = new Agent({
  name: 'Local Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: provider,
});

const response = await agent.run('Hello!');
```

## Configuration

### Basic Options

```typescript
const provider = new OllamaProvider({
  // Model to use
  model: 'llama3.2',

  // Ollama server URL (default: localhost:11434)
  host: 'http://localhost:11434',

  // Keep model loaded (default: '5m')
  keepAlive: '5m',

  // Request timeout (default: 120000ms)
  timeout: 120000,
});
```

### Available Models

```typescript
import { OllamaModels } from '@contextaisdk/provider-ollama';

// Llama models
OllamaModels.LLAMA_3_2 // 'llama3.2'
OllamaModels.LLAMA_3_1 // 'llama3.1'
OllamaModels.LLAMA_3 // 'llama3'

// Other popular models
OllamaModels.MISTRAL // 'mistral'
OllamaModels.CODELLAMA // 'codellama'
OllamaModels.MIXTRAL // 'mixtral'
OllamaModels.PHI // 'phi'
OllamaModels.GEMMA // 'gemma'
OllamaModels.QWEN // 'qwen'
```

### List Available Models

```typescript
const models = await provider.listModels();
console.log('Installed models:', models);
// ['llama3.2', 'mistral', 'codellama']
```

## Streaming

Ollama uses NDJSON streaming:

```typescript
for await (const chunk of provider.streamChat(messages)) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.text);
  }
}
```

### With Agent

```typescript
for await (const event of agent.stream('Write a haiku')) {
  if (event.type === 'text') {
    process.stdout.write(event.text);
  }
}
```

## Tool Calling

Ollama supports tool calling with compatible models:

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';

const searchTool = defineTool({
  name: 'search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }, context) => {
    return { success: true, data: { results: ['Result 1', 'Result 2'] } };
  },
});

const agent = new Agent({
  name: 'Search Assistant',
  systemPrompt: 'Help users search for information.',
  llm: provider,
  tools: [searchTool],
});
```

**Note**: Tool calling quality varies by model. Llama 3.2 and Mistral have good support.

## Model Management

### Pull Models

```bash
# Pull a model
ollama pull llama3.2

# Pull specific size
ollama pull llama3.2:3b
ollama pull llama3.2:1b

# Pull with quantization
ollama pull llama3.2:3b-q4_0
```

### Memory Management

```typescript
// Keep model loaded for 30 minutes
const provider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '30m',
});

// Unload immediately after each request (save memory)
const provider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '0',
});

// Keep loaded indefinitely
const provider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '-1',
});
```

## Performance Tuning

### GPU Acceleration

Ollama automatically uses GPU if available:

```bash
# Check GPU usage
ollama ps
```

### Model Selection by Hardware

| VRAM | Recommended |
|------|-------------|
| 4GB | llama3.2:1b, phi |
| 8GB | llama3.2:3b, mistral:7b |
| 16GB | llama3.1:8b, mixtral |
| 24GB+ | llama3.1:70b |

### Timeout for Large Models

```typescript
// Increase timeout for larger models
const provider = new OllamaProvider({
  model: 'llama3.1:70b',
  timeout: 300000, // 5 minutes
});
```

## Remote Ollama Server

### Connect to Remote

```typescript
const provider = new OllamaProvider({
  model: 'llama3.2',
  host: 'http://192.168.1.100:11434',
});
```

### Docker Setup

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

## Error Handling

```typescript
import { ProviderError } from '@contextaisdk/core';

try {
  const response = await provider.chat(messages);
} catch (error) {
  if (error instanceof ProviderError) {
    switch (error.code) {
      case 'MODEL_NOT_FOUND':
        console.error('Model not installed. Run: ollama pull MODEL');
        break;
      case 'TIMEOUT':
        console.error('Request timed out - model may be loading');
        break;
      case 'CONNECTION_ERROR':
        console.error('Cannot connect to Ollama. Is it running?');
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
| General chat | llama3.2 |
| Coding | codellama |
| Fast responses | phi, llama3.2:1b |
| Quality | llama3.1:8b |

### 2. Warm Up Models

First request loads the model (can be slow):

```typescript
// Warm up on app start
await provider.chat([{ role: 'user', content: 'hi' }]);
```

### 3. Keep Model Loaded

For production, keep models loaded:

```typescript
const provider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '1h', // Stay loaded for an hour
});
```

## Troubleshooting

### "Connection Refused"

```bash
# Check if Ollama is running
curl http://localhost:11434

# Start Ollama
ollama serve
```

### "Model Not Found"

```bash
# List installed models
ollama list

# Pull the model
ollama pull llama3.2
```

### Slow First Response

The first request loads the model into memory:

```bash
# Pre-load model
curl http://localhost:11434/api/generate \
  -d '{"model": "llama3.2", "prompt": "hi"}'
```

### Out of Memory

```bash
# Use smaller model
ollama pull llama3.2:1b

# Or use quantized version
ollama pull llama3.2:3b-q4_0
```

### Tool Calling Not Working

Not all models support tools. Use:
- llama3.2 (3b or larger)
- mistral
- mixtral

## Comparison: Local vs Cloud

| Aspect | Ollama (Local) | Cloud (OpenAI/Anthropic) |
|--------|----------------|--------------------------|
| Cost | Free | Pay per token |
| Privacy | Data stays local | Data sent to API |
| Speed | Depends on hardware | Consistent |
| Quality | Good (varies) | Excellent |
| Setup | Install required | Just API key |

## Next Steps

- [OpenAI Provider](./openai.md) - Cloud alternative
- [Anthropic Provider](./anthropic.md) - Claude models
- [Create Agent](../../how-to/agents/create-agent.md) - Agent setup
