# ContextAI - AI Agent Resources

**Project ID**: 7
**MCP Server**: https://projectpulsemcp.dracodev.dev/mcp
**Dashboard**: https://projectpulse.dracodev.dev/

---

## Overview

This document catalogs all AI agent resources available for ContextAI via ProjectPulse MCP.

Resources are loaded on-demand to save tokens. Use `list` tools to discover what's available, then `get` tools to load specific resources when needed.

---

## Available Personas

Personas define expert behaviors and domain knowledge. Load one to adopt its expertise.

### How to Use Personas

```
# List all available personas
projectpulse_persona_list(projectId: 7)

# Load a specific persona
projectpulse_persona_get(projectId: 7, slug: "<persona-slug>")
→ Returns: name, systemPrompt, expertise, rules, skills, tools
```

### Persona Catalog

### Agent Runtime Developer 🤖

**Slug**: `agent-runtime`
**Expertise**: ReAct Loop, Tool Execution, Agent Orchestration, Streaming, Debugging

Expert in ReAct reasoning loops, tool execution, and agent orchestration

### Provider Integration Specialist 🔌

**Slug**: `provider-specialist`
**Expertise**: Anthropic, OpenAI, Ollama, HuggingFace, API Integration

Expert in LLM provider APIs, embedding services, and adapter patterns

### RAG Pipeline Engineer 🔍

**Slug**: `rag-engineer`
**Expertise**: RAG, Embeddings, Vector Search, Chunking, Re-ranking

Specialist in retrieval-augmented generation, embeddings, and vector search

### React Components Developer ⚛️

**Slug**: `react-developer`
**Expertise**: React Hooks, Headless UI, Accessibility, TypeScript React, Streaming UI

Specialist in React hooks, headless components, and SDK UI patterns

### SDK Architect 🏗️

**Slug**: `sdk-architect`
**Expertise**: TypeScript, SDK Design, API Ergonomics, Monorepo, Package Architecture

Expert in TypeScript SDK design, API ergonomics, and package architecture

### Test Engineer 🧪

**Slug**: `test-engineer`
**Expertise**: Vitest, Unit Testing, Integration Testing, Mocking, Coverage

Expert in Vitest, testing strategies, and SDK quality assurance

---

## Available Skills

Skills contain reusable coding patterns, templates, and conventions for the project.

### How to Use Skills

```
# List all skills
projectpulse_skill_list(projectId: 7)

# Filter by category
projectpulse_skill_list(projectId: 7, category: "framework")

# Load a specific skill
projectpulse_skill_get(projectId: 7, slug: "<skill-slug>")
→ Returns: Full content with code examples
```

### Skills by Category

#### framework

| Title | Slug | Description |
|-------|------|-------------|
| TypeScript SDK Design Patterns | `typescript-sdk-patterns` | Core patterns for building type-safe, tree-shakeable SDK packages |
| RAG Chunking Strategies | `rag-chunking-strategies` | Implementation patterns for different chunking approaches in RAG pipelines |
| React Hooks for Async Agent State | `react-hooks-async-state` | Patterns for managing async agent state in React with proper cleanup and error handling |

#### testing

| Title | Slug | Description |
|-------|------|-------------|
| Vitest Mocking Patterns for SDK Testing | `vitest-mocking-patterns` | Patterns for mocking LLM providers, embeddings, and async operations in Vitest |

#### workflow

| Title | Slug | Description |
|-------|------|-------------|
| SDK Error Handling Patterns | `error-handling-patterns` | Consistent error handling patterns with typed errors, recovery hints, and logging |

---

## Standard Operating Procedures (SOPs)

SOPs provide step-by-step procedures for common tasks.

### How to Use SOPs

```
# List all SOPs
projectpulse_sop_list(projectId: 7)

# Filter by category
projectpulse_sop_list(projectId: 7, category: "Development")

# Load a specific SOP
projectpulse_sop_get(projectId: 7, slug: "<sop-slug>")
→ Returns: Full procedure with steps and checklists
```

### SOPs by Category

#### Development

| Title | Slug | Description |
|-------|------|-------------|
| Code Review Guidelines | `code-review-guidelines` | Standards and checklist for reviewing SDK pull requests |
| Adding New Package to Monorepo | `adding-new-package` | Steps for creating a new package in the Turborepo monorepo |
| Security Review Checklist | `security-review-checklist` | Security considerations when reviewing SDK code changes |

#### Troubleshooting

| Title | Slug | Description |
|-------|------|-------------|
| Debugging Agent Issues | `debugging-agent-issues` | Step-by-step guide for debugging agent behavior problems |
| RAG Pipeline Tuning | `rag-pipeline-tuning` | Guide for optimizing RAG retrieval quality and performance |

---

## Workflow Templates

Workflow templates define multi-step processes for common tasks.

### How to Use Workflows

```
# List available workflows
projectpulse_workflow_list(projectId: 7)

# Start a workflow
projectpulse_workflow_start({
  templateId: 1,
  projectId: 7,
  initialContext: { featureName: "auth" }
})

# Execute current step
projectpulse_workflow_executeStep({ runId: 123, stepResult: {...} })

# Check status
projectpulse_workflow_getStatus({ runId: 123 })
```

---

## Knowledge Base

Project knowledge items store decisions, discoveries, and solutions.

### How to Access Knowledge

```
# Search knowledge
projectpulse_knowledge_search({
  projectId: 7,
  query: "authentication",
  mode: "hybrid"
})

# Get full item
projectpulse_knowledge_get({
  projectId: 7,
  itemId: 123
})
```

---

## Wiki

Project documentation in wiki format.

### How to Access Wiki

```
# Search wiki
projectpulse_wiki_search({ query: "API reference" })

# Get page by path
projectpulse_wiki_get({ path: "/guides/api-reference" })
```

---

## Token-Efficient Loading Pattern

To minimize token usage, follow this pattern:

```
1. Start with context_load (all memory banks)
   → Get project brief, patterns, tech context

2. List resources when needed
   → persona_list, skill_list, sop_list return metadata only (~100 tokens each)

3. Load full content on-demand
   → persona_get, skill_get, sop_get return full content

4. Search before creating
   → knowledge_search, wiki_search to find existing info
```

---

## Dashboard

View and manage all resources:

- **Overview**: https://projectpulse.dracodev.dev/projects/7
- **Personas**: https://projectpulse.dracodev.dev/projects/7/personas
- **Skills**: https://projectpulse.dracodev.dev/projects/7/skills
- **SOPs**: https://projectpulse.dracodev.dev/projects/7/sops
- **Knowledge**: https://projectpulse.dracodev.dev/projects/7/knowledge
