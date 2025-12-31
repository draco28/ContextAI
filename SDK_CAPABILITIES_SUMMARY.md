# ContextAI SDK - Capabilities Summary for Agent Evaluation

**Purpose**: This document summarizes ContextAI SDK capabilities to help agents decide if it fits their use case compared to alternatives like Claude Code SDK, OpenAI Agents SDK, LangGraph, and CrewAI.

---

## 1. What is ContextAI SDK?

ContextAI is a **TypeScript-first AI Agent SDK** that combines:
- **ReAct reasoning** (Thought → Action → Observation loops)
- **Production-grade RAG** (9-stage retrieval pipeline)
- **Provider-agnostic design** (swap LLMs without code changes)

**Tagline**: *"The anti-LangChain - focused, debuggable, minimal dependencies"*

---

## 2. Core Capabilities

### 2.1 Agent Runtime (ReAct Loop)

| Capability | Description |
|------------|-------------|
| **ReAct Pattern** | Explicit reasoning traces: Thought → Action → Observation |
| **Tool Calling** | Zod-validated function calling with type safety |
| **Streaming** | Real-time SSE streaming of reasoning + output |
| **Iteration Control** | Configurable max iterations (default: 10) |
| **Error Recovery** | Automatic retry with exponential backoff |
| **Debugging** | Full transparency - see exactly what the agent is thinking |

```typescript
// Example: ~50 lines for a working agent
const agent = new Agent({
  name: 'CodeAssistant',
  systemPrompt: '...',
  llm: new AnthropicProvider({ model: 'claude-sonnet-4-20250514' }),
  tools: [fileReadTool(), shellExecuteTool()],
  rag: ragPipeline
});

const response = await agent.run("How does auth work?");
console.log(response.reasoning); // See the thinking process
```

### 2.2 RAG Pipeline (9 Stages)

| Stage | Capability |
|-------|------------|
| 1. **Ingest** | PDF, DOCX, TXT, Markdown, Code (via Docling or JS fallbacks) |
| 2. **Chunk** | Fixed, Recursive, Semantic, Agentic chunking strategies |
| 3. **Embed** | HuggingFace BGE (local), Ollama embeddings |
| 4. **Store** | pgvector, ChromaDB, In-Memory |
| 5. **Enhance** | Query rewriting, HyDE, Multi-query expansion |
| 6. **Retrieve** | Hybrid search (Dense + Sparse with RRF fusion) |
| 7. **Rerank** | BGE cross-encoder, MMR diversity, LLM reranking |
| 8. **Assemble** | XML/Markdown context with citations, sandwich ordering |
| 9. **Adaptive** | Agent decides when/how to retrieve (Agentic RAG) |

**Key Differentiator**: RAG is a first-class citizen, not an add-on.

### 2.3 Provider Support

| Provider Type | Supported |
|---------------|-----------|
| **LLM** | Anthropic Claude, OpenAI GPT, Ollama (local), Any OpenAI-compatible |
| **Embeddings** | HuggingFace BGE (Transformers.js), Ollama |
| **Vector Stores** | PostgreSQL+pgvector, ChromaDB, In-Memory |
| **Document Loaders** | Docling (PDF/DOCX), native JS (TXT, MD, Code) |

**Key Differentiator**: Swap providers via interface, no code changes.

### 2.4 Developer Experience

| Feature | Implementation |
|---------|----------------|
| **TypeScript-first** | Strict mode, full type safety, no `any` |
| **Minimal bundle** | <50KB core package |
| **Tree-shakeable** | Import only what you use |
| **React components** | Optional `@contextai/react` with hooks |
| **Debuggability** | Reasoning traces, timing breakdowns, token usage |

---

## 3. Comparison Matrix

| Capability | ContextAI | Claude Code SDK | OpenAI Agents SDK | LangGraph | CrewAI |
|------------|-----------|-----------------|-------------------|-----------|--------|
| **Primary Focus** | RAG + Agents | Code interrogation | General agents | State machines | Multi-agent |
| **ReAct Agent** | First-class | Built-in | Basic | Manual | Via crews |
| **RAG Pipeline** | 9-stage production | Basic | External | External | External |
| **TypeScript DX** | Excellent | Good | Good | Medium | Python-first |
| **Debuggability** | Transparent traces | Good | Medium | Complex | Medium |
| **Provider Lock-in** | None | Anthropic | OpenAI | None | None |
| **Bundle Size** | <50KB | Medium | Light | Heavy | Heavy |
| **Local LLM** | Ollama supported | No | No | Yes | Yes |
| **Cost** | Your API costs | Per-repo pricing | API costs | Free + API | Free + API |
| **Multi-agent** | v2 roadmap | No | Yes | Yes | First-class |
| **Memory/State** | Interface only | Built-in | Basic | First-class | Basic |
| **Learning Curve** | Low | Low | Low | High | Medium |

---

## 4. Best Fit Use Cases

### ContextAI is IDEAL for:

| Use Case | Why ContextAI |
|----------|---------------|
| **Document Q&A** | Production RAG with hybrid search, reranking, citations |
| **Code assistants** | Tool calling + codebase RAG + reasoning traces |
| **Chatbots with knowledge** | RAG-native, not bolted-on |
| **TypeScript/Node.js apps** | First-class TS support, excellent DX |
| **Cost-conscious projects** | Local embeddings (BGE), Ollama for LLM |
| **Debugging AI behavior** | Full transparency into agent reasoning |
| **Provider flexibility** | Start with Ollama, switch to Claude/GPT in production |

### ContextAI may NOT be ideal for:

| Use Case | Better Alternative |
|----------|-------------------|
| **Multi-agent orchestration** | CrewAI (first-class), LangGraph |
| **Complex state machines** | LangGraph (built for this) |
| **Claude Code-specific features** | Claude Code SDK (tight integration) |
| **Python ecosystem** | LangChain, LlamaIndex |
| **Production memory persistence** | LangGraph (built-in), custom solution |
| **Multimodal (images/audio)** | v2 roadmap, use alternatives now |

---

## 5. Technical Specifications

### 5.1 Package Structure

```
@contextai/core           # Agent loop, interfaces (<50KB)
@contextai/rag            # RAG pipeline, chunking, retrieval
@contextai/react          # Optional React hooks + components
@contextai/providers      # LLM/embedding adapters
@contextai/loader-*       # Document loaders (PDF, DOCX, etc.)
@contextai/vectorstore-*  # Vector store adapters
@contextai/reranker-*     # Reranking adapters
```

### 5.2 Performance Targets

| Metric | Target |
|--------|--------|
| Bundle size (core) | <50KB |
| Vector search (10K docs) | <100ms |
| Embedding latency | <200ms (local BGE) |
| Memory baseline | <100MB |
| Cold start | <500ms |

### 5.3 Runtime Requirements

- Node.js 18+ (LTS)
- TypeScript 5.0+
- Browser: Chrome, Firefox, Safari, Edge (last 2 versions)

---

## 6. Architecture Highlights

### 6.1 ReAct Loop Flow

```
User Message
     │
     ▼
┌─────────────┐
│   START     │
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Generate: Thought + (Action | Answer)  │◄────────┐
└─────────────────┬───────────────────────┘         │
                  │                                  │
         ┌────────┴────────┐                        │
         ▼                 ▼                        │
    Is Answer?        Is Action?                    │
         │                 │                        │
         ▼                 ▼                        │
    ┌────────┐      ┌─────────────┐                │
    │ FINISH │      │ Execute Tool│                │
    └────────┘      └──────┬──────┘                │
                           │                        │
                           ▼                        │
                    ┌─────────────┐                │
                    │ Observation │────────────────┘
                    └─────────────┘
```

### 6.2 RAG Pipeline Flow

```
INDEXING (Offline):
Documents → Chunk → Embed → Store in Vector DB

QUERY (Online):
Query → Enhance → Retrieve (Hybrid) → Rerank → Assemble Context

ADAPTIVE:
Agent decides: Skip RAG | Full Pipeline | Retrieve as Tool
```

---

## 7. Roadmap

### v1.0 (Current Focus - 10 weeks)
- ReAct agent with tool calling
- Full 9-stage RAG pipeline
- Anthropic, OpenAI, Ollama providers
- pgvector, ChromaDB stores
- React components

### v1.1 (Post-launch)
- CRAG (web search fallback)
- Self-RAG evaluation
- Cohere Rerank API

### v2.0 (3 months post-launch)
- **Graph RAG**
- **Multi-agent orchestration**
- **Multimodal RAG** (images)

---

## 8. Decision Framework

### Choose ContextAI if:

- [ ] Building in TypeScript/Node.js
- [ ] Need production-grade RAG (not just vector search)
- [ ] Want to understand agent reasoning (debugging)
- [ ] Need provider flexibility (local → cloud)
- [ ] Prefer minimal dependencies over batteries-included
- [ ] Single-agent use case (or can wait for v2 multi-agent)

### Consider Alternatives if:

- [ ] Need multi-agent orchestration NOW → **CrewAI**
- [ ] Need complex state machines → **LangGraph**
- [ ] Tight Claude integration for code → **Claude Code SDK**
- [ ] Python ecosystem requirement → **LangChain/LlamaIndex**
- [ ] Need built-in memory persistence → **LangGraph** or custom

---

## 9. Quick Start (What 100 Lines Looks Like)

```typescript
import { Agent } from '@contextai/core';
import { RAGPipeline, PgVectorStore } from '@contextai/rag';
import { AnthropicProvider, HuggingFaceEmbedding } from '@contextai/providers';

// 1. Initialize providers
const llm = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514'
});

const embedding = new HuggingFaceEmbedding({
  model: 'BAAI/bge-large-en-v1.5'
});

const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL,
  hybridSearch: true
});

// 2. Create RAG pipeline
const rag = new RAGPipeline({
  embedding,
  vectorStore,
  chunking: { strategy: 'semantic', chunkSize: 512 },
  reranking: { enabled: true, method: 'bge' }
});

// 3. Ingest documents
await rag.ingest('./docs', { pattern: '**/*.md' });

// 4. Create agent
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are helpful. Use RAG context. Cite sources.',
  llm,
  rag
});

// 5. Run
const response = await agent.run("How does authentication work?");
console.log(response.output);
console.log(response.reasoning); // Full transparency
```

---

## 10. Summary for Agent Decision

| Question | ContextAI Answer |
|----------|------------------|
| **What is it?** | TypeScript AI Agent SDK with ReAct + production RAG |
| **What makes it different?** | RAG-native, debuggable, provider-agnostic, minimal |
| **Who is it for?** | TS/JS devs building knowledge-grounded AI apps |
| **What's the learning curve?** | Low - clean APIs, excellent DX |
| **What's missing (for now)?** | Multi-agent, multimodal, built-in persistence |
| **Cost model?** | Open source + your LLM API costs |

---

*Generated from ContextAI project documentation (Project ID: 7)*
*For full documentation, see the wiki pages in ProjectPulse.*
