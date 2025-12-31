# ContextAI - Generic AI Chatbot Architecture Plan

**Project Name**: ContextAI
**Repository Location**: `/Users/draco/projects/contextai` (sibling to AI_HUB)
**Project Goal**: Build a standalone AI-powered chatbot SDK that can answer questions about any codebase/documentation, with ProjectPulse as the demo integration.

**Portfolio Impact**: Two composable projects demonstrating system design, SDK development, and integration architecture skills for AI agent developer roles.

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repository | Separate repo (not in AI_HUB) | Cleaner portfolio separation |
| LLM Strategy | Multi-provider with in-chat selection | Claude, OpenAI, Gemini, GLM (free), Ollama (local) |
| Knowledge Scope | Full context (code + docs) | More impressive for AI agent roles |
| Timeline | Flexible (quality-focused) | Production-grade code > quick demos |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ContextAI (Standalone)                    │
├─────────────────────────────────────────────────────────────┤
│  packages/                                                   │
│  ├── core/        → LLM abstraction, streaming, context     │
│  ├── adapters/    → Git, Docs, OpenAPI, Prisma adapters     │
│  ├── widget/      → Embeddable JS widget (CDN)              │
│  ├── react/       → React component library                 │
│  └── api/         → REST API server                         │
│                                                              │
│  apps/                                                       │
│  ├── web/         → Demo application (Next.js 14)           │
│  └── docs/        → Documentation site                      │
└─────────────────────────────────────────────────────────────┘
                              │
            integrates with   ▼
┌─────────────────────────────────────────────────────────────┐
│  ProjectPulse (or ANY web app)                              │
│  - Exposes /api/knowledge/export                            │
│  - Embeds ContextAI widget                                  │
│  - Provides project context                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL 16 + pgvector |
| Embeddings | Ollama (nomic-embed-text) / OpenAI fallback |
| Streaming | Server-Sent Events (SSE) |
| Auth | Bearer tokens (bcrypt hashed) |
| Validation | Zod |
| Testing | Vitest + Playwright |
| Widget Bundler | Rollup |

---

## Core Interfaces

### LLM Provider Interface
```typescript
interface LLMProvider {
  readonly name: string;
  readonly displayName: string;
  readonly models: string[];
  readonly supportsStreaming: boolean;

  isAvailable(): Promise<boolean>;
  countTokens(messages: ChatMessage[]): Promise<number>;
  estimateCost(promptTokens: number, completionTokens: number): number;
  chat(messages: ChatMessage[]): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[]): AsyncGenerator<StreamChunk>;
}
```

### Knowledge Adapter Interface
```typescript
interface KnowledgeAdapter {
  readonly name: string;
  readonly sourceType: string;

  parse(options?: ParseOptions): Promise<KnowledgeChunk[]>;
  getMetadata(): Promise<AdapterMetadata>;
  watch?(): AsyncGenerator<ChangeEvent>;
}
```

---

## Provider Strategy (Runtime Switching)

**Supported Providers**:
1. **Claude** (Anthropic) - Primary, best quality
2. **OpenAI** (GPT-4) - Widely known
3. **Gemini** (Google) - Alternative
4. **GLM** - Free testing (user's preference)
5. **Ollama** - Local models, zero cost

**User Experience**: Dropdown in chat UI to switch provider mid-conversation. Cost estimate shown before sending.

---

## Knowledge Adapters

| Adapter | Parses | Output |
|---------|--------|--------|
| **Git** | Code files, directory structure | AST-aware chunks, file tree |
| **Docs** | Markdown, README, wiki | Sectioned chunks with headings |
| **OpenAPI** | Swagger/OpenAPI specs | Endpoint summaries |
| **Prisma** | Database schemas | Model definitions, relations |
| **ProjectPulse** | Wiki, knowledge base | Exported knowledge items |

---

## Database Schema (Key Models)

```prisma
model Conversation {
  id        String    @id
  projectId String
  provider  String    @default("claude")
  model     String
  messages  Message[]
}

model Message {
  role             MessageRole
  content          String
  provider         String?
  promptTokens     Int?
  completionTokens Int?
  contextChunkIds  String[]
}

model KnowledgeChunk {
  content   String
  metadata  Json
  embedding Unsupported("vector(768)")
}

model UsageRecord {
  date             DateTime
  provider         String
  requestCount     Int
  totalCostUsd     Decimal
}
```

---

## Phase-by-Phase Implementation

### Phase 1: Core Foundation (Weeks 1-2)
**Goal**: Basic chat with provider switching

- [ ] Turborepo + pnpm monorepo setup
- [ ] `@contextai/core` package structure
- [ ] Claude provider implementation
- [ ] OpenAI provider implementation
- [ ] SSE streaming (real-time responses)
- [ ] Next.js demo app with chat UI
- [ ] Provider selector component
- [ ] PostgreSQL schema (conversations, messages)

**Demo Checkpoint**: Chat UI with provider switching, no codebase context yet

---

### Phase 2: Knowledge Adapters (Weeks 3-4)
**Goal**: RAG-powered chat with codebase context

- [ ] `@contextai/adapters` package
- [ ] Git adapter (Tree-sitter for AST-aware chunking)
- [ ] Markdown/docs adapter
- [ ] Ollama embeddings integration
- [ ] pgvector setup
- [ ] Hybrid search (semantic + full-text)
- [ ] Context injection in system prompts
- [ ] Citation system (link to source files)

**Demo Checkpoint**: "Explain how authentication works in this codebase"

---

### Phase 3: Widget & React SDK (Weeks 5-6)
**Goal**: Embeddable chatbot for any web app

- [ ] `@contextai/widget` - Vanilla JS embed script
- [ ] CDN distribution (Cloudflare/Vercel)
- [ ] `@contextai/react` - React component library
- [ ] `ChatWindow`, `MessageList`, `ProviderSelector` components
- [ ] `useChat`, `useStreaming`, `useProvider` hooks
- [ ] Theme customization (light/dark/auto)
- [ ] Position options (bottom-right, bottom-left, fullscreen)

**Demo Checkpoint**: Widget on external site, React component in Next.js app

---

### Phase 4: Additional Providers & Polish (Weeks 7-8)
**Goal**: Full provider coverage, production-ready

- [ ] Gemini provider
- [ ] GLM provider (free tier)
- [ ] Ollama provider (local)
- [ ] OpenAPI adapter
- [ ] Prisma schema adapter
- [ ] Cost tracking dashboard
- [ ] Usage analytics
- [ ] Rate limiting
- [ ] Error recovery

**Demo Checkpoint**: Switch between 5 providers, see real-time costs

---

### Phase 5: ProjectPulse Integration (Weeks 9-10)
**Goal**: Seamless integration demo

- [ ] ProjectPulse knowledge adapter
- [ ] `/api/knowledge/export` endpoint in ProjectPulse
- [ ] Token exchange mechanism
- [ ] Memory bank integration (project-brief, system-patterns, etc.)
- [ ] Pre-configured widget for ProjectPulse
- [ ] Integration documentation
- [ ] Demo video

**Demo Checkpoint**: Full chat with ProjectPulse context embedded in ProjectPulse UI

---

## Integration with ProjectPulse

### What ProjectPulse Exposes
```typescript
// GET /api/knowledge/export (existing)
// GET /api/projects/:id/context (new)
{
  project: { name, description, repository },
  memoryBanks: { projectBrief, systemPatterns, techContext, activeContext },
  metadata: { ticketCount, knowledgeItemCount, lastUpdated }
}
```

### Widget Embedding
```html
<script
  src="https://cdn.contextai.dev/widget.js"
  data-project-token="pp_xxxxxxxxxxxx"
  data-theme="dark"
></script>
```

---

## Success Criteria

1. **Technical**: 5 LLM providers working with runtime switching
2. **Integration**: Widget embeddable in any web app (3 lines of code)
3. **Portfolio**: Two separate repos that work together
4. **Demo Story**: "Ask it anything about this codebase" with real-time streaming

---

## Files to Create (Initial Setup)

```
contextai/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   └── src/
│   │       ├── providers/
│   │       │   ├── base.ts          ← Provider interface
│   │       │   ├── claude.ts        ← First provider
│   │       │   └── index.ts         ← ProviderManager
│   │       └── streaming/
│   │           └── sse.ts           ← SSE transformer
│   └── react/
│       ├── package.json
│       └── src/
│           └── components/
│               └── ChatWindow.tsx   ← Main chat component
├── apps/
│   └── web/
│       ├── package.json
│       └── app/
│           └── page.tsx             ← Demo page
└── prisma/
    └── schema.prisma                ← Database schema
```

---

## Next Steps

1. Initialize git repository
2. Set up Turborepo monorepo with pnpm
3. Set up CI/CD (GitHub Actions)
4. Register project in ProjectPulse for tracking
5. Begin Phase 1 implementation (Core Foundation)
