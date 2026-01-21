# @contextai/provider-ollama

> Local LLM provider for ContextAI SDK via Ollama

[![npm version](https://img.shields.io/npm/v/@contextai/provider-ollama.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/provider-ollama)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @contextai/provider-ollama
# or
pnpm add @contextai/provider-ollama
```

**No peer dependencies!** This package has no external dependencies beyond `@contextai/core`.

## Prerequisites

Install and run Ollama:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start the server
ollama serve

# Pull a model
ollama pull llama3.2
```

## Quick Start

```typescript
import { OllamaProvider, OllamaModels } from '@contextai/provider-ollama';
import { Agent } from '@contextai/core';

// Create the provider (no API key needed!)
const ollama = new OllamaProvider({
  model: OllamaModels.LLAMA_3_2,
  host: 'http://localhost:11434', // default
});

// Check if Ollama is running
if (await ollama.isAvailable()) {
  const agent = new Agent({
    name: 'Local Assistant',
    systemPrompt: 'You are a helpful assistant.',
    llm: ollama,
  });

  const response = await agent.run('Hello!');
  console.log(response.output);
} else {
  console.log('Start Ollama with: ollama serve');
}
```

## Configuration

```typescript
const provider = new OllamaProvider({
  // Required
  model: string;               // e.g., 'llama3.2', 'mistral', 'codellama'

  // Optional settings
  host?: string;               // Server URL (default: 'http://localhost:11434')
  timeout?: number;            // Request timeout (default: 120000ms - 2 min)
  headers?: Record<string, string>;  // Custom headers
  keepAlive?: string;          // Memory management (e.g., '5m', '0')

  // Default generation options
  defaultOptions?: {
    temperature?: number;      // 0-2 (default: 0.8)
    maxTokens?: number;        // Max response tokens
    topP?: number;             // Nucleus sampling
    topK?: number;             // Top-K sampling
    stopSequences?: string[];  // Stop generation triggers
  };
});
```

## Available Models

```typescript
import { OllamaModels } from '@contextai/provider-ollama';

// Llama 3.2
OllamaModels.LLAMA_3_2        // 'llama3.2' (default size)
OllamaModels.LLAMA_3_2_1B    // 'llama3.2:1b' (small, fast)
OllamaModels.LLAMA_3_2_3B    // 'llama3.2:3b' (balanced)

// Llama 3.1
OllamaModels.LLAMA_3_1_8B    // 'llama3.1:8b'
OllamaModels.LLAMA_3_1_70B   // 'llama3.1:70b' (requires 64GB+ RAM)

// Mistral
OllamaModels.MISTRAL          // 'mistral'
OllamaModels.MISTRAL_NEMO     // 'mistral-nemo'

// Code Models
OllamaModels.CODELLAMA        // 'codellama'
OllamaModels.DEEPSEEK_CODER   // 'deepseek-coder'
OllamaModels.QWEN_CODER       // 'qwen2.5-coder'

// Small Models
OllamaModels.PHI3             // 'phi3' (Microsoft)
OllamaModels.GEMMA2           // 'gemma2' (Google)
```

Or use any model string: `'llama3.2:latest'`, `'mixtral:8x7b'`, etc.

## Features

### Streaming Responses

Ollama uses NDJSON (newline-delimited JSON) for streaming:

```typescript
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Write a story about a robot' }
])) {
  process.stdout.write(chunk.content);
}
```

### Tool Calling

Ollama supports function calling with compatible models:

```typescript
import { defineTool } from '@contextai/core';
import { z } from 'zod';

const calculatorTool = defineTool({
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    // Simple eval (use a proper math parser in production)
    return { result: eval(expression) };
  },
});

const agent = new Agent({
  name: 'Math Assistant',
  systemPrompt: 'Help users with calculations.',
  llm: ollama,
  tools: [calculatorTool],
});
```

**Note:** Tool calling works best with Llama 3.1+, Mistral, and newer models.

### List Available Models

```typescript
const models = await provider.listModels();

for (const model of models) {
  console.log(`${model.name} - ${model.details.parameter_size}`);
}
// Output:
// llama3.2:latest - 3B
// mistral:latest - 7B
// codellama:latest - 7B
```

### Multimodal (Vision Models)

```typescript
import { OllamaProvider } from '@contextai/provider-ollama';

const provider = new OllamaProvider({
  model: 'llava', // Vision model
});

// Send images as base64
const response = await provider.chat([
  {
    role: 'user',
    content: 'What is in this image?',
    images: [base64ImageString],
  },
]);
```

### Memory Management (keepAlive)

Control how long models stay loaded in memory:

```typescript
// Keep model loaded for 5 minutes (default Ollama behavior)
const provider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '5m',
});

// Unload immediately after request (saves RAM)
const lowMemoryProvider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '0',
});

// Keep loaded indefinitely
const alwaysReadyProvider = new OllamaProvider({
  model: 'llama3.2',
  keepAlive: '-1',
});
```

## Direct Chat API

Use the provider directly without an agent:

```typescript
// Non-streaming
const response = await provider.chat([
  { role: 'system', content: 'You are a coding assistant.' },
  { role: 'user', content: 'Write a TypeScript function' },
], {
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.content);

// Response includes timing metrics
console.log('Generation speed:', response.metrics?.tokensPerSecond, 'tokens/s');

// Streaming
for await (const chunk of provider.streamChat(messages)) {
  process.stdout.write(chunk.content);
}
```

## Error Handling

```typescript
import { OllamaProviderError } from '@contextai/provider-ollama';

try {
  const response = await provider.chat(messages);
} catch (error) {
  if (error instanceof OllamaProviderError) {
    switch (error.code) {
      case 'CONNECTION_REFUSED':
        console.log('Ollama not running. Start with: ollama serve');
        break;
      case 'MODEL_NOT_FOUND':
        console.log('Model not installed. Run: ollama pull', error.details.model);
        break;
      case 'MODEL_LOADING':
        console.log('Model still loading, please wait...');
        break;
      case 'OUT_OF_MEMORY':
        console.log('Not enough RAM. Try a smaller model.');
        break;
      case 'TIMEOUT':
        console.log('Request timed out. Local inference can be slow.');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `CONNECTION_REFUSED` | Ollama server not running |
| `MODEL_NOT_FOUND` | Model not pulled locally |
| `MODEL_LOADING` | Model still loading into memory |
| `OUT_OF_MEMORY` | Insufficient RAM for model |
| `CONTEXT_LENGTH_EXCEEDED` | Input too long for model |
| `TIMEOUT` | Request timed out |
| `INVALID_RESPONSE` | Malformed response from Ollama |

## Performance Tips

### 1. Choose the Right Model Size

| RAM | Recommended Models |
|-----|-------------------|
| 8GB | llama3.2:1b, phi3, gemma2:2b |
| 16GB | llama3.2:3b, mistral, codellama:7b |
| 32GB | llama3.1:8b, mixtral:8x7b |
| 64GB+ | llama3.1:70b |

### 2. Use Quantized Models

```bash
# 4-bit quantization (smaller, faster, slightly lower quality)
ollama pull llama3.2:3b-q4_0

# 8-bit quantization (balanced)
ollama pull llama3.2:3b-q8_0
```

### 3. Pre-load Models

```bash
# Load model into memory before use
curl http://localhost:11434/api/generate -d '{"model": "llama3.2", "keep_alive": "10m"}'
```

### 4. Increase Timeout for Large Models

```typescript
const provider = new OllamaProvider({
  model: 'llama3.1:70b',
  timeout: 300000, // 5 minutes for large models
});
```

## Troubleshooting

### "Connection refused"

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### "Model not found"

```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.2
```

### Slow Generation

1. Use a smaller model or quantized version
2. Reduce `maxTokens` in generation options
3. Close other memory-intensive applications
4. Consider GPU acceleration if available

### Using a Remote Ollama Server

```typescript
const provider = new OllamaProvider({
  model: 'llama3.2',
  host: 'http://192.168.1.100:11434', // Remote server
});
```

## Comparison: Local vs Cloud

| Aspect | Ollama (Local) | Cloud Providers |
|--------|---------------|-----------------|
| Privacy | Data stays local | Data sent to API |
| Cost | Free (hardware only) | Per-token pricing |
| Speed | Depends on hardware | Consistent |
| Models | Open-source only | Proprietary available |
| Internet | Not required | Required |
| Setup | Requires Ollama | API key only |

## License

MIT
