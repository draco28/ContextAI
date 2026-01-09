# ContextAI - AI Workflow Guide

**Project ID**: 7
**MCP Server**: https://projectpulsemcp.dracodev.dev/mcp
**Dashboard**: https://projectpulse.dracodev.dev/

---

## Quick Start

Just chat naturally with me (Claude Code / Windsurf / Droid):

```
"Implement the user authentication feature"
"Fix the bug in the search API"
"Add tests for the payment module"
```

---

## CRITICAL: Start Every Session Here

### Step 1: Load Context

```
projectpulse_context_load(projectId: 7)
```

This returns:
- All 5 memory banks (project brief, patterns, tech context, active focus, progress)
- Active sessions (check if PAUSED work exists)
- Available resources (personas, skills, SOPs)
- Workflow hints

**If PAUSED session found:** Resume with `projectpulse_agent_session_resume(sessionId)`
**If no session:** Start new with `projectpulse_agent_session_start()`

---

## CRITICAL: Ticket Identification (Sprint 17)

### The Problem

Users see **#123** in the web UI. This is `ticketNumber` (project-scoped).
**DO NOT** use this as `ticketId` - that's a different number (global database ID)!

### Decision Rule

| User Says | Parameter to Use | Example |
|-----------|------------------|---------|
| "#5", "ticket 5", "work on 5" | `ticketNumber` + `projectId` | `ticket_get({ ticketNumber: 5, projectId: 7 })` |
| (from previous API response) | `ticketId` | `ticket_update({ ticketId: 42, ... })` |

### Quick Decision Tree

1. **Did the USER give you the number?** → Use `ticketNumber` + `projectId`
2. **Did an API call return an ID?** → Use `ticketId`
3. **Not sure?** → Use `ticketNumber` + `projectId` (safer default)

### Examples

```
# CORRECT: User says "update ticket #5"
projectpulse_ticket_update({
  ticketNumber: 5,   # User's number from UI
  projectId: 7,      # Always required with ticketNumber
  status: "in-progress"
})

# WRONG: This gets a DIFFERENT ticket!
projectpulse_ticket_update({
  ticketId: 5,       # Global ID - NOT what user sees!
  status: "in-progress"
})
```

### Agent Session Tickets

```
# User says "work on tickets #5 and #7"
projectpulse_agent_session_start({
  projectId: 7,
  activeTicketNumbers: [5, 7]  # Use this, NOT activeTicketIds!
})
```

---

## Daily Workflow

### Morning: Start Work

```
Step 1: Load context
─────────────────────
projectpulse_context_load(projectId: 7)
→ Returns: memory banks, active sessions, available resources

Step 2: Check roadmap position (if using roadmap)
─────────────────────────────────────────────────
projectpulse_sprint_getCurrentPosition(projectId: 7)
→ Returns: phase/sprint/week/day with progress

Step 3: Find tickets for today
──────────────────────────────
projectpulse_ticket_search({
  sprintNumber: 1,
  status: ["todo"]  // Only "todo" tickets can be claimed
})
→ Returns: Tickets ready to be claimed

Step 4: Start session with ticket(s)
────────────────────────────────────
projectpulse_agent_session_start({
  projectId: 7,
  name: "Sprint 1 - Feature Implementation",
  activeTicketNumbers: [1, 2],  // User-referenced tickets (#1, #2)
  plan: "## Today's Plan\n1. Complete API endpoint\n2. Write tests",
  todos: [
    {content: "Complete API endpoint", status: "pending"},
    {content: "Write tests", status: "pending"}
  ]
})
```

### During Work

```
1. Work on code → (your normal coding flow)
2. Checkpoint every 15K tokens → agent_session_update({ progress: "..." })
3. Add comments → ticket_addComment({ ticketNumber: 1, projectId: 7, content: "Implemented X, Y, Z" })
```

**Note**: Tickets are auto-claimed to "in-progress" when you start a session with `activeTicketNumbers`.

### End of Day

```
Step 5: Move completed tickets (auto-cascades progress)
───────────────────────────────────────────────────────
projectpulse_kanban_moveTicket({
  ticketNumber: 1,   // User-referenced ticket (#1)
  projectId: 7,      // Always required with ticketNumber
  status: "done",
  displayOrder: 0
})
→ Auto-propagates: Ticket → Sprint → Phase

Step 6: Pause or end session
────────────────────────────
# For breaks (lunch, EOD):
projectpulse_agent_session_update({
  sessionId: "...",
  status: "PAUSED"
})

# When work is FULLY done:
projectpulse_agent_session_end({
  sessionId: "...",
  progress: "Session complete."
})
```

---

## Loading Project Resources (via MCP)

### Personas (Expert Roles)

```
# List available personas
projectpulse_persona_list(projectId: 7)

# Load a specific persona
projectpulse_persona_get(projectId: 7, slug: "backend-developer")
```

### Skills (Coding Patterns)

```
# List available skills
projectpulse_skill_list(projectId: 7, category: "framework")

# Load a skill
projectpulse_skill_get(projectId: 7, slug: "react-hooks-patterns")
```

### SOPs (Procedures)

```
# List available SOPs
projectpulse_sop_list(projectId: 7, category: "Development")

# Load an SOP
projectpulse_sop_get(projectId: 7, slug: "git-workflow")
```

---

## Available Personas

| Persona | Slug | Expertise |
|---------|------|-----------|
| Agent Runtime Developer | `agent-runtime` | ReAct Loop, Tool Execution, Agent Orchestration, Streaming, Debugging |
| Provider Integration Specialist | `provider-specialist` | Anthropic, OpenAI, Ollama, HuggingFace, API Integration |
| RAG Pipeline Engineer | `rag-engineer` | RAG, Embeddings, Vector Search, Chunking, Re-ranking |
| React Components Developer | `react-developer` | React Hooks, Headless UI, Accessibility, TypeScript React, Streaming UI |
| SDK Architect | `sdk-architect` | TypeScript, SDK Design, API Ergonomics, Monorepo, Package Architecture |
| Test Engineer | `test-engineer` | Vitest, Unit Testing, Integration Testing, Mocking, Coverage |

---

## Roadmap Workflow (Optional)

**Use roadmap for multi-week projects with phases. Skip for single fixes.**

### When to Use Roadmap

- ✅ Greenfield projects with timeline structure
- ✅ Multi-sprint initiatives
- ❌ Single bug fixes (just use tickets)
- ❌ Small improvements (tickets-only is fine)

### Roadmap Tools

| Tool | When to Use |
|------|-------------|
| `roadmap_create` | Once per project, after onboarding |
| `getCurrentPosition` | Start of each work day |
| `getPhaseProgress` | See full phase tree |
| `kanban_moveTicket` | Move tickets across columns (auto-cascades progress) |
| `kanban_getBoard` | Get sprint's Kanban board with all tickets |

### Ticket Scheduling with Kanban

Tickets are assigned to sprints and managed via Kanban boards:

```
projectpulse_ticket_create({
  projectId: 7,
  title: "Implement feature X",
  kind: "feature",
  sprintNumber: 1,
  estimatedDays: 2
})

# View Kanban board at: /roadmap/sprint/1
# Move tickets between columns using kanban_moveTicket
```

---

## Ticket Workflow

### Ticket Kinds

| User Says | Ticket Kind |
|-----------|-------------|
| "Add feature X" | `feature` |
| "Do X", "Set up X" | `task` |
| "X is broken" | `bug` |
| "X needs refactoring" | `tech_debt` |
| "Concerned about X" | `issue` |

### Complete Workflow (6 steps)

| Step | Action | MCP Tool |
|------|--------|----------|
| 1 | Create ticket | `ticket_create` |
| 2 | Add plan | `ticket_update({ customFields: { _implementationContext: {...} } })` |
| 3 | Claim ticket | `ticket_update({ status: "in-progress" })` |
| 4 | Implement | (code tools) |
| 5 | Add comment | `ticket_addComment("Implemented X, Y, Z")` |
| 6 | Close after testing | `ticket_setStatus("closed")` |

### Agent Ticket Workflow (Sprint 16)

**Status Flow (Agent-Managed)**:
```
backlog ──[user drag]──► todo ──[session_start]──► in-progress ──[session_end]──► in-review ──[user drag]──► done
```

**What Happens Automatically**:
| Event | System Action |
|-------|---------------|
| `session_start({ activeTicketNumbers: [1, 2] })` | Validates "todo" → moves to "in-progress", sets assignee="Claude Code" |
| `session_end({ sessionId })` | Moves linked tickets to "in-review" |

**User-Only Moves** (via Kanban drag):
- ✅ `backlog → todo` - Preparing ticket for agent work
- ✅ `in-review → done` - Verifying completed work

**Complete Workflow (ONE SESSION PER TICKET)**:
| Step | Action | How |
|------|--------|-----|
| 1 | Find work | `ticket_search({ status: ["todo"], sprintNumber: X })` |
| 2 | Start session | `agent_session_start({ activeTicketNumbers: [1] })` → **AUTO-CLAIMS** |
| 3 | Implement | Code, test |
| 4 | Commit | `git commit` with descriptive message |
| 5 | Document | `ticket_addComment({ content: "Implemented X, Y" })` |
| 6 | End session | `agent_session_end()` → **AUTO-MOVES TO IN-REVIEW** |
| 7 | Next ticket | **START NEW SESSION** - repeat from step 2 |

**Then User**:
- Verifies work in Kanban
- Drags `in-review → done`

**CRITICAL**: Do NOT work on multiple tickets in one session. Each ticket gets its own session→commit→end cycle.

**Note**: Valid status values are `backlog`, `todo`, `in-progress`, `in-review`, `done`

---

## Agent Session Lifecycle

### Session States

| Status | Use For |
|--------|---------|
| `IN_PROGRESS` | Actively working |
| `PAUSED` | Breaks, EOD, context compaction |
| `COMPLETED` | Work fully done (CANNOT resume!) |

**CRITICAL**: COMPLETED sessions CANNOT be resumed. Use PAUSED for breaks!

### Token Checkpoints

Save progress at these intervals to survive context compaction:

| Tokens | Action |
|--------|--------|
| 15K | First checkpoint |
| 30K | Second checkpoint |
| 45K | Third checkpoint |
| 60K+ | Checkpoint every 15K |

```
projectpulse_agent_session_update({
  sessionId: "...",
  progress: "Checkpoint: Completed X, working on Y",
  todos: [{content: "Task 1", status: "completed"}, ...]
})
```

---

## Knowledge & Wiki

### Knowledge Items

```
# Search for existing knowledge
projectpulse_knowledge_search(projectId: 7, query: "authentication")

# Store new knowledge
projectpulse_knowledge_create(projectId: 7, title: "...", content: "...", category: "...")
```

### Wiki Pages

```
# Search wiki
projectpulse_wiki_search(query: "API reference")

# Get wiki page
projectpulse_wiki_get(path: "/guides/api-reference")
```

---

## MCP Tools Reference

| Category | Tools |
|----------|-------|
| **Context** | `context_load`, `context_lookup`, `context_update` |
| **Sessions** | `agent_session_start`, `agent_session_update`, `agent_session_resume`, `agent_session_end` |
| **Tickets** | `ticket_create`, `ticket_search`, `ticket_update`, `ticket_setStatus`, `ticket_addComment`, `ticket_get` |
| **Roadmap** | `roadmap_create`, `getCurrentPosition`, `getPhaseProgress`, `queryHierarchy` |
| **Kanban** | `kanban_moveTicket`, `kanban_getBoard` |
| **Knowledge** | `knowledge_create`, `knowledge_search`, `knowledge_get` |
| **Wiki** | `wiki_search`, `wiki_get`, `wiki_create`, `wiki_update` |
| **Resources** | `persona_list`, `persona_get`, `skill_list`, `skill_get`, `sop_list`, `sop_get` |
| **Workflows** | `workflow_list`, `workflow_start`, `workflow_executeStep`, `workflow_getStatus` |

---

## Daily Checklist

- [ ] Loaded context via `context_load(projectId: 7)`
- [ ] Resumed PAUSED session OR started new session
- [ ] Checked roadmap position (if using roadmap)
- [ ] Found tickets for current sprint/week
- [ ] Working on feature branch (not main/master)

---

## Pair Programming Mode (`/pair`)

Use `/pair <ticket-number>` to start a guided pair programming session.

### How It Works

1. **Claude mentors, you code**: Claude explains concepts, provides code, you type it
2. **Educational insights**: Every step includes WHY, not just WHAT
3. **Verification loop**: Claude reads your changes and suggests fixes if needed

### Per-Ticket Workflow (CRITICAL)

```
┌─────────────────────────────────────────────────────────────────┐
│  ONE SESSION = ONE TICKET                                       │
│                                                                 │
│  1. session_start(ticket) ─► ticket goes to "in-progress"       │
│  2. Implement with pair programming                             │
│  3. Test & Build                                                │
│  4. Commit changes                                              │
│  5. ticket_addComment() with summary                            │
│  6. session_end() ─► ticket goes to "in-review"                 │
│                                                                 │
│  THEN for next ticket: START NEW SESSION                        │
└─────────────────────────────────────────────────────────────────┘
```

### Child Ticket Strategy

When a feature ticket has 3+ distinct tasks:
- Create child tickets with separation of concerns
- Each child ticket should be self-contained (full context in description)
- Work on one child at a time with proper session lifecycle

### Insight Block Format

```
`★ Insight ─────────────────────────────────────`
**Concept Name**
- Why we're doing this
- Key technical point
- Best practice note
`─────────────────────────────────────────────────`
```

---

## Dashboard

View all project resources: https://projectpulse.dracodev.dev/projects/7
