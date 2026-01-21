# Memory

Managing conversation context and state across agent interactions.

## What is Memory?

Memory allows agents to remember previous interactions within a session:

- **Conversation History** - Previous messages in the chat
- **Context Persistence** - Remember facts mentioned earlier
- **Session Isolation** - Separate memory per user/conversation

```typescript
// Without memory: Agent forgets between calls
const r1 = await agent.run('My name is Alice');
const r2 = await agent.run('What is my name?'); // Agent doesn't know

// With memory: Agent remembers
const agent = new Agent({ memory: true, sessionId: 'user-1' });
const r1 = await agent.run('My name is Alice');
const r2 = await agent.run('What is my name?'); // "Your name is Alice"
```

## Enabling Memory

### Simple: Boolean Flag

```typescript
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are helpful.',
  llm: provider,
  memory: true, // Uses InMemoryProvider
  sessionId: 'my-session',
});
```

### Advanced: Custom Provider

```typescript
import { InMemoryProvider } from '@contextai/core';

const memoryProvider = new InMemoryProvider({
  maxMessages: 100,     // Keep last 100 messages
  maxTokens: 8000,      // Or limit by tokens
});

const agent = new Agent({
  memory: memoryProvider,
  sessionId: 'user-123',
});
```

## Session Management

### Session IDs

Each session ID maintains isolated memory:

```typescript
// User 1's conversation
const agent1 = new Agent({ memory: true, sessionId: 'user-1' });
await agent1.run('I like TypeScript');

// User 2's conversation (separate)
const agent2 = new Agent({ memory: true, sessionId: 'user-2' });
await agent2.run('I like Python');

// Memories don't mix
await agent1.run('What do I like?'); // "TypeScript"
await agent2.run('What do I like?'); // "Python"
```

### Dynamic Sessions

```typescript
class ChatService {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      memory: true,
      // Session ID set per-request
    });
  }

  async chat(userId: string, message: string) {
    return this.agent.run(message, {
      sessionId: `user-${userId}`,
    });
  }
}
```

## Memory Provider Interface

```typescript
interface MemoryProvider {
  // Store a message
  add(sessionId: string, message: ChatMessage): Promise<void>;

  // Get conversation history
  getHistory(sessionId: string, options?: MemoryOptions): Promise<ChatMessage[]>;

  // Clear a session
  clear(sessionId: string): Promise<void>;

  // Check if session exists
  has(sessionId: string): Promise<boolean>;
}

interface MemoryOptions {
  maxMessages?: number;  // Limit messages returned
  maxTokens?: number;    // Limit by token count
}
```

## Built-in Providers

### InMemoryProvider

In-process memory (lost on restart):

```typescript
import { InMemoryProvider } from '@contextai/core';

const memory = new InMemoryProvider({
  maxMessages: 50,
  maxTokens: 4000,
});

// Use with agent
const agent = new Agent({
  memory,
  sessionId: 'session-1',
});

// Or access directly
await memory.add('session-1', { role: 'user', content: 'Hello' });
const history = await memory.getHistory('session-1');
```

## Context Window Management

### The Problem

LLMs have limited context windows. Long conversations exceed limits.

### Token Budgeting

```typescript
const agent = new Agent({
  memory: true,
  maxContextTokens: 4000, // Reserve tokens for memory
});
```

Memory is truncated (oldest messages first) to fit the budget.

### Manual Control

```typescript
// Get history with limits
const history = await memoryProvider.getHistory(sessionId, {
  maxMessages: 10,  // Last 10 messages only
});

// Or by tokens
const history = await memoryProvider.getHistory(sessionId, {
  maxTokens: 2000,  // ~2000 tokens
});
```

## Conversation Context

### Adding Context

Inject additional information:

```typescript
const agent = new Agent({
  memory: true,
  context: `
    User Profile:
    - Name: Alice
    - Plan: Premium
    - Preferences: Dark mode
  `,
  maxContextTokens: 4000,
});
```

### Runtime Context

Add context per-request:

```typescript
const response = await agent.run(userMessage, {
  context: `
    Current page: /dashboard
    Shopping cart: 3 items
    Last order: #12345
  `,
});
```

## Conversation Patterns

### Clear on Topic Change

```typescript
async function chat(message: string) {
  // Detect topic change
  if (isNewTopic(message)) {
    await memory.clear(sessionId);
  }

  return agent.run(message);
}
```

### Summarize Long Conversations

```typescript
async function manageMemory(sessionId: string) {
  const history = await memory.getHistory(sessionId);

  if (history.length > 20) {
    // Summarize with LLM
    const summary = await summarizeConversation(history.slice(0, -5));

    // Replace with summary + recent messages
    await memory.clear(sessionId);
    await memory.add(sessionId, {
      role: 'system',
      content: `Previous conversation summary: ${summary}`,
    });

    // Add recent messages back
    for (const msg of history.slice(-5)) {
      await memory.add(sessionId, msg);
    }
  }
}
```

### Export/Import Sessions

```typescript
// Export for persistence
const history = await memory.getHistory(sessionId);
const exportData = JSON.stringify(history);
await saveToDatabase(sessionId, exportData);

// Import to restore
const savedData = await loadFromDatabase(sessionId);
const history = JSON.parse(savedData);
for (const message of history) {
  await memory.add(sessionId, message);
}
```

## Implementing Custom Memory

### Database-Backed Memory

```typescript
class PostgresMemoryProvider implements MemoryProvider {
  constructor(private db: PostgresClient) {}

  async add(sessionId: string, message: ChatMessage): Promise<void> {
    await this.db.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, message.role, message.content]
    );
  }

  async getHistory(
    sessionId: string,
    options?: MemoryOptions
  ): Promise<ChatMessage[]> {
    const limit = options?.maxMessages ?? 100;

    const result = await this.db.query(
      `SELECT role, content FROM messages
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [sessionId, limit]
    );

    return result.rows.reverse();
  }

  async clear(sessionId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM messages WHERE session_id = $1',
      [sessionId]
    );
  }

  async has(sessionId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM messages WHERE session_id = $1 LIMIT 1',
      [sessionId]
    );
    return result.rows.length > 0;
  }
}
```

### Redis Memory with TTL

```typescript
class RedisMemoryProvider implements MemoryProvider {
  constructor(
    private redis: RedisClient,
    private ttlSeconds: number = 3600
  ) {}

  async add(sessionId: string, message: ChatMessage): Promise<void> {
    const key = `memory:${sessionId}`;
    await this.redis.rpush(key, JSON.stringify(message));
    await this.redis.expire(key, this.ttlSeconds);
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const key = `memory:${sessionId}`;
    const items = await this.redis.lrange(key, 0, -1);
    return items.map((item) => JSON.parse(item));
  }

  async clear(sessionId: string): Promise<void> {
    await this.redis.del(`memory:${sessionId}`);
  }

  async has(sessionId: string): Promise<boolean> {
    return (await this.redis.exists(`memory:${sessionId}`)) > 0;
  }
}
```

## Best Practices

### 1. Always Use Session IDs

```typescript
// Bad: No session ID
const agent = new Agent({ memory: true });

// Good: Explicit session
const agent = new Agent({
  memory: true,
  sessionId: `user-${userId}-${conversationId}`,
});
```

### 2. Set Token Budgets

```typescript
// Leave room for tools and response
const agent = new Agent({
  memory: true,
  maxContextTokens: 4000, // Of 8K context, leave 4K for other use
});
```

### 3. Clear Stale Sessions

```typescript
// Periodically clean up old sessions
async function cleanupSessions() {
  const staleSessions = await findStaleSessions(24 * 60 * 60); // 24h
  for (const sessionId of staleSessions) {
    await memory.clear(sessionId);
  }
}
```

### 4. Handle Memory Errors Gracefully

```typescript
try {
  const response = await agent.run(message);
} catch (error) {
  if (error.code === 'MEMORY_ERROR') {
    // Clear and retry
    await memory.clear(sessionId);
    return agent.run(message);
  }
  throw error;
}
```

## Related Topics

- [Agents](./agents.md) - Agent configuration
- [How-To: Conversation Memory](../how-to/agents/conversation-memory.md)
