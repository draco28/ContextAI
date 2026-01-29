# ContextAI - OpenCode Workflow Guide

**Project ID**: 7
**MCP Server**: https://projectpulsemcp.dracodev.dev/mcp
**Dashboard**: https://projectpulse.dracodev.dev/

---

## Quick Start

Initialize project session:

```bash
/init
```

Chat with the agent:

```
"Review the tickets in in-review status"
"Check if ticket #123 is ready for approval"
```

---

## 🚀 Daily Workflow

### 1. Load Context (Crucial)

Start every session by loading the project context from ProjectPulse:

```javascript
projectpulse_context_load({ projectId: 7 });
```

This loads the project brief, tech stack, and active tasks into memory.

### 2. Manage Tasks

Use the ProjectPulse ticket system to track work:

```javascript
// Find your tickets
projectpulse_ticket_search({ sprintNumber: 1, status: ['todo'] });

// Start a session for a ticket
projectpulse_agent_session_start({
  projectId: 7,
  name: 'Implement Feature X',
  activeTicketIds: [123],
});
```

---

## 🤖 Specialized Agents

We have specialized agents available as subagents. Invoke them with `@` or let the main agent delegate to them.

| Agent                   | Mention                | Expertise                                                   |
| ----------------------- | ---------------------- | ----------------------------------------------------------- |
| **SDK Architect**       | `@sdk-architect`       | TypeScript SDK design, API ergonomics, package architecture |
| **RAG Engineer**        | `@rag-engineer`        | RAG pipelines, embeddings, chunking, vector search          |
| **Agent Runtime**       | `@agent-runtime`       | ReAct reasoning, tool execution, streaming                  |
| **React Developer**     | `@react-developer`     | React hooks, headless components, accessibility             |
| **Provider Specialist** | `@provider-specialist` | LLM provider adapters (OpenAI, Anthropic, Ollama)           |
| **Test Engineer**       | `@test-engineer`       | Vitest, testing strategies, mocking, coverage               |

Example:

> `@sdk-architect` Design the public API for the new embedding provider.

---

## 🧠 Skills & SOPs

Reusable patterns and procedures are available via the `skill` tool.

**Usage:**

```javascript
skill({ name: 'typescript-sdk-patterns' });
skill({ name: 'git-workflow-sop' });
```

**Available Skills:**

- `typescript-sdk-patterns`: Core patterns for building type-safe, tree-shakeable SDK packages
- `rag-chunking-strategies`: Implementation patterns for different chunking approaches in RAG pipelines
- `rag-pipeline-tuning`: Guide for optimizing RAG retrieval quality and performance
- `error-handling-patterns`: Consistent error handling patterns with typed errors, recovery hints, and logging
- `vitest-mocking-patterns`: Patterns for mocking LLM providers, embeddings, and async operations in Vitest
- `react-hooks-async-state`: Patterns for managing async agent state in React with proper cleanup and error handling
- `security-review-checklist`: Security considerations when reviewing SDK code changes
- `adding-new-package`: Steps for creating a new package in the Turborepo monorepo
- `code-reviewer`: Specialized code reviewer for ProjectPulse ticket workflow

---

## 🔍 Code Reviewer Workflow (Primary Use Case)

This project's primary use case is reviewing tickets completed by Claude Code.

### Command Invocation

**Review all tickets in "in-review" status:**

```
/review
```

**Review specific ticket:**

```
/review [ticket-number]
```

### Workflow Steps

1. **Load Context**

   ```javascript
   projectpulse_context_load({ projectId: 7 });
   ```

2. **Get Kanban Board**

   ```javascript
   const position = projectpulse_sprint_getCurrentPosition({ projectId: 7 });
   const board = projectpulse_kanban_getBoard({ sprintId: position.sprintId });
   ```

3. **Review Tickets in "in-review" Status**

   ```javascript
   const ticketsInReview = board.columns['in-review'];

   for (const ticket of ticketsInReview) {
     // Get ticket details
     const ticketDetails = projectpulse_ticket_get({
       ticketNumber: ticket.ticketNumber,
     });

     // Analyze implementation
     // - Check git history
     // - Review modified files
     // - Verify requirements met
     // - Identify gaps

     // If gaps found: Add comment, move to "in-progress"
     // If approved: Add comment, move to "done"
   }
   ```

4. **Gap Detection Categories**
   - Functionality (implementation, edge cases)
   - Testing (coverage, edge cases, determinism)
   - Type Safety (no `any`, proper generics, inference)
   - API Design (interface-first, consistency, ergonomics)
   - Error Handling (proper handling, no swallowing)
   - Security (input validation, injection risks, secrets)
   - Performance (N+1, memoization, bundle size)
   - Documentation (JSDoc, examples, changelog)
   - Accessibility (a11y, keyboard, screen reader)
   - Code Quality (readability, duplication, naming)

### Code Reviewer Skill

For detailed review procedures and checklists, load the `code-reviewer` skill:

```javascript
skill({ name: 'code-reviewer' });
```

---

## 🛠 ProjectPulse MCP Tools

Full access to the ProjectPulse ecosystem is available via MCP tools:

- **Context**: `projectpulse_context_load`
- **Knowledge Base**: `projectpulse_knowledge_search`
- **Wiki**: `projectpulse_wiki_search`
- **Roadmap**: `projectpulse_sprint_getCurrentPosition`
- **Kanban**: `projectpulse_kanban_getBoard`
- **Tickets**: `projectpulse_ticket_search`, `projectpulse_ticket_get`, `projectpulse_ticket_addComment`, `projectpulse_kanban_moveTicket`

---

## Token Efficiency

1. **Load Context First**: Use `projectpulse_context_load`.
2. **Use Specialized Agents**: They have focused system prompts.
3. **Load Skills On-Demand**: Don't ask for "all skills", ask for specific ones using `skill()`.
4. **Review One Ticket at a Time**: Process tickets in "in-review" status individually for detailed analysis.

---

## Project-Specific Context

This is a **TypeScript SDK monorepo** using:

- **Turborepo** for build orchestration
- **pnpm** for package management
- **Vitest** for testing
- **tsup** for bundling
- **TypeScript 5.5+** with strict mode

### Package Structure

- `@contextaisdk/core` - Agent runtime with ReAct loop
- `@contextaisdk/rag` - 9-stage RAG pipeline
- `@contextaisdk/react` - React hooks and components
- `@contextaisdk/provider-*` - LLM provider adapters
- `@contextaisdk/cli` - Scaffolding CLI

### Build Commands

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Code Standards

- TypeScript strict mode enabled
- No `any` types in public APIs
- Interface-first design
- Zod validation for runtime schemas
- JSDoc for public methods
- Changesets for versioning
- Bundle size limits enforced
