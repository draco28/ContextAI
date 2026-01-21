# ContextAI SDK Documentation

> TypeScript-first AI Agent SDK with ReAct reasoning and production-grade RAG

[![npm version](https://img.shields.io/npm/v/@contextai/core.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## What is ContextAI?

ContextAI SDK is a TypeScript-first framework for building AI agents with transparent reasoning and production-grade RAG (Retrieval-Augmented Generation). It's designed to be the "anti-LangChain" - focused, debuggable, and minimal.

```typescript
import { Agent, defineTool } from '@contextai/core';
import { OpenAIProvider } from '@contextai/provider-openai';
import { z } from 'zod';

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: new OpenAIProvider({ model: 'gpt-4o' }),
  tools: [
    defineTool({
      name: 'search',
      description: 'Search the web',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => searchWeb(query),
    }),
  ],
});

const response = await agent.run('What is the capital of France?');
console.log(response.output);
console.log(response.trace); // See exactly how the agent reasoned
```

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@contextai/core](./api/core/) | Agent framework with ReAct reasoning | [![npm](https://img.shields.io/npm/v/@contextai/core.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/core) |
| [@contextai/rag](./api/rag/) | 9-stage RAG pipeline | [![npm](https://img.shields.io/npm/v/@contextai/rag.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/rag) |
| [@contextai/react](./api/react/) | React components and hooks | [![npm](https://img.shields.io/npm/v/@contextai/react.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/react) |
| [@contextai/provider-openai](./integrations/providers/openai/) | OpenAI GPT provider | [![npm](https://img.shields.io/npm/v/@contextai/provider-openai.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/provider-openai) |
| [@contextai/provider-anthropic](./integrations/providers/anthropic/) | Anthropic Claude provider | [![npm](https://img.shields.io/npm/v/@contextai/provider-anthropic.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/provider-anthropic) |
| [@contextai/provider-ollama](./integrations/providers/ollama/) | Ollama local LLM provider | [![npm](https://img.shields.io/npm/v/@contextai/provider-ollama.svg?style=flat-square)](https://www.npmjs.com/package/@contextai/provider-ollama) |

## Documentation Sections

### Getting Started

- [Overview](./introduction/overview.md) - What is ContextAI and why use it
- [Why ContextAI?](./introduction/why-contextai.md) - Comparison with LangChain, Vercel AI SDK
- [Installation](./introduction/installation.md) - Setup guide for each package
- [Quickstart](./introduction/quickstart.md) - Build your first agent in 5 minutes

### Concepts

Deep-dive into core architecture:

- [Agents](./concepts/agents.md) - Agent architecture and configuration
- [ReAct Pattern](./concepts/react-pattern.md) - The reasoning loop explained
- [Tools](./concepts/tools.md) - Building tools with Zod schemas
- [Providers](./concepts/providers.md) - LLM provider abstraction
- [Streaming](./concepts/streaming.md) - Real-time responses
- [Memory](./concepts/memory.md) - Conversation context management

#### RAG Pipeline

- [RAG Overview](./concepts/rag/overview.md) - 9-stage pipeline architecture
- [Chunking](./concepts/rag/chunking.md) - Document splitting strategies
- [Retrieval](./concepts/rag/retrieval.md) - Dense, sparse, and hybrid search
- [Reranking](./concepts/rag/reranking.md) - Result optimization

### How-To Guides

Task-focused tutorials:

#### Agents
- [Create an Agent](./how-to/agents/create-agent.md)
- [Add Custom Tools](./how-to/agents/add-tools.md)
- [Stream Responses](./how-to/agents/streaming-agent.md)
- [Conversation Memory](./how-to/agents/conversation-memory.md)
- [Error Handling](./how-to/agents/error-handling.md)

#### RAG
- [Build a RAG Pipeline](./how-to/rag/build-rag-pipeline.md)
- [Hybrid Search](./how-to/rag/hybrid-search.md)
- [Agentic RAG](./how-to/rag/agentic-rag.md)

#### React
- [Build a Chat Interface](./how-to/react/chat-interface.md)
- [Streaming UI](./how-to/react/streaming-ui.md)

### Integrations

Connect to external services:

#### LLM Providers
- [OpenAI](./integrations/providers/openai.md)
- [Anthropic Claude](./integrations/providers/anthropic.md)
- [Ollama (Local)](./integrations/providers/ollama.md)

#### Vector Stores
- [pgvector (PostgreSQL)](./integrations/vector-stores/pgvector.md)

#### Embeddings
- [HuggingFace](./integrations/embeddings/huggingface.md)

### Tutorials

End-to-end projects:

- [Build a Q&A Chatbot](./tutorials/build-qa-chatbot.md)
- [Document Assistant](./tutorials/document-assistant.md)
- [Code Assistant](./tutorials/code-assistant.md)

### API Reference

Auto-generated TypeScript documentation:

- [Core API](./api/core/)
- [RAG API](./api/rag/)
- [React API](./api/react/)
- [Provider APIs](./api/providers/)

## Quick Links

- [GitHub Repository](https://github.com/contextai/contextai-sdk)
- [npm Organization](https://www.npmjs.com/org/contextai)
- [Changelog](https://github.com/contextai/contextai-sdk/blob/main/CHANGELOG.md)
- [Contributing Guide](https://github.com/contextai/contextai-sdk/blob/main/CONTRIBUTING.md)

## License

MIT
