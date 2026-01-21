# Installation

This guide covers installing ContextAI SDK packages for different use cases.

## Requirements

- **Node.js** 18+ (LTS recommended)
- **TypeScript** 5.0+ (for type safety)
- **Package Manager**: npm, pnpm, or yarn

## Quick Install

For most projects, start with core and a provider:

```bash
# Using npm
npm install @contextai/core @contextai/provider-openai zod

# Using pnpm (recommended)
pnpm add @contextai/core @contextai/provider-openai zod

# Using yarn
yarn add @contextai/core @contextai/provider-openai zod
```

## Package Guide

### Core Package (Required)

The foundation for all ContextAI functionality:

```bash
pnpm add @contextai/core zod
```

**Peer Dependencies:**
- `zod` ^3.23.0 - Required for tool parameter validation

**Provides:**
- `Agent` class
- `defineTool()` function
- `LLMProvider` interface
- Streaming utilities

### LLM Providers (Pick One or More)

#### OpenAI

```bash
pnpm add @contextai/provider-openai openai
```

**Peer Dependencies:**
- `openai` ^4.0.0 - Official OpenAI SDK

**Supports:** GPT-4, GPT-4o, GPT-3.5, o1, etc.

#### Anthropic Claude

```bash
pnpm add @contextai/provider-anthropic @anthropic-ai/sdk
```

**Peer Dependencies:**
- `@anthropic-ai/sdk` ^0.25.0 - Official Anthropic SDK

**Supports:** Claude 4, Claude 3.5, Claude 3

#### Ollama (Local)

```bash
pnpm add @contextai/provider-ollama
```

**No peer dependencies!** Communicates directly with Ollama server.

**Supports:** Llama, Mistral, CodeLlama, and any Ollama model

### RAG Package

For retrieval-augmented generation:

```bash
pnpm add @contextai/rag
```

**Provides:**
- `RAGEngineImpl` - Full pipeline orchestrator
- Chunkers: `FixedSizeChunker`, `RecursiveChunker`, `SentenceChunker`
- Retrievers: `DenseRetriever`, `BM25Retriever`, `HybridRetriever`
- Rerankers: `BGEReranker`, `MMRReranker`, `LLMReranker`
- Assemblers: `XMLAssembler`, `MarkdownAssembler`

### React Package

For building chat UIs:

```bash
pnpm add @contextai/react
```

**Peer Dependencies:**
- `react` ^18.0.0
- `@contextai/core`

**Provides:**
- Hooks: `useChat`, `useAgent`, `useAgentStream`
- Components: `ChatWindow`, `MessageList`, `MessageInput`, `ReasoningTrace`
- Accessibility utilities

## Installation by Use Case

### Basic Agent

Just need an agent with tools:

```bash
pnpm add @contextai/core @contextai/provider-openai zod
```

```typescript
import { Agent, defineTool } from '@contextai/core';
import { OpenAIProvider } from '@contextai/provider-openai';
```

### RAG Application

Build a document Q&A system:

```bash
pnpm add @contextai/core @contextai/rag @contextai/provider-openai zod
```

```typescript
import { Agent } from '@contextai/core';
import { RAGEngineImpl, HuggingFaceEmbeddingProvider } from '@contextai/rag';
import { OpenAIProvider } from '@contextai/provider-openai';
```

### React Chat Application

Build a chat interface:

```bash
pnpm add @contextai/core @contextai/react @contextai/provider-openai zod
```

```typescript
import { Agent } from '@contextai/core';
import { useChat, ChatWindow } from '@contextai/react';
import { OpenAIProvider } from '@contextai/provider-openai';
```

### Full Stack with Local LLM

Complete setup with local inference:

```bash
pnpm add @contextai/core @contextai/rag @contextai/react @contextai/provider-ollama zod
```

## TypeScript Configuration

Ensure your `tsconfig.json` is configured for modern TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

Key settings:
- `"strict": true` - Enables full type checking
- `"moduleResolution": "bundler"` - For modern bundlers (Vite, esbuild)
- `"target": "ES2022"` - Matches package output

## Environment Variables

Set up API keys for cloud providers:

```bash
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Load in your application:

```typescript
// Node.js
import 'dotenv/config';

// Or access directly
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});
```

## Verifying Installation

Test your setup:

```typescript
// test-install.ts
import { Agent } from '@contextai/core';
import { OpenAIProvider } from '@contextai/provider-openai';

const agent = new Agent({
  name: 'Test',
  systemPrompt: 'Say hello.',
  llm: new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
  }),
});

const response = await agent.run('Hello!');
console.log(response.output);
console.log('Installation successful!');
```

Run with:

```bash
npx tsx test-install.ts
```

## Common Issues

### "Cannot find module '@contextai/core'"

Ensure you're using a compatible Node.js version and module resolution:

```bash
node --version  # Should be 18+
```

### "Peer dependency not satisfied"

Install the required peer dependency:

```bash
# For OpenAI provider
pnpm add openai

# For Anthropic provider
pnpm add @anthropic-ai/sdk
```

### TypeScript Errors

Ensure `strict` mode and compatible TypeScript version:

```bash
npx tsc --version  # Should be 5.0+
```

## Next Steps

- [Quickstart](./quickstart.md) - Build your first agent
- [Concepts: Agents](../concepts/agents.md) - Understand the architecture
- [How-To: Create an Agent](../how-to/agents/create-agent.md) - Step-by-step guide
