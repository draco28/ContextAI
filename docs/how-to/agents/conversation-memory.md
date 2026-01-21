# How to Add Conversation Memory

Enable multi-turn conversations where agents remember context.

## Why Memory?

Without memory, each agent call is independent:

```typescript
// Without memory
await agent.run('My name is Alice');
await agent.run('What is my name?'); // Agent doesn't know
```

With memory, the agent remembers:

```typescript
// With memory
await agent.run('My name is Alice');
await agent.run('What is my name?'); // "Your name is Alice"
```

## Quick Start

### Enable Memory

```typescript
import { Agent } from '@contextai/core';

const agent = new Agent({
  name: 'Chat Assistant',
  systemPrompt: 'You are helpful and remember our conversation.',
  llm: provider,
  memory: true,        // Enable memory
  sessionId: 'user-1', // Identify this conversation
});
```

### Have a Conversation

```typescript
// First message
await agent.run('Hi, I am working on a TypeScript project');

// Second message - agent remembers context
await agent.run('What language am I using?');
// "You mentioned you're working on a TypeScript project."

// Third message - conversation continues
await agent.run('Can you suggest some useful libraries?');
// "For your TypeScript project, I'd recommend..."
```

## Session Management

### What is a Session?

A session ID groups related messages together. Use different IDs for:
- Different users
- Different conversations
- Different topics

### User-Based Sessions

```typescript
// Each user gets their own memory
const agent = new Agent({
  memory: true,
  sessionId: `user-${userId}`,
});
```

### Conversation-Based Sessions

```typescript
// New conversation = new session
const agent = new Agent({
  memory: true,
  sessionId: `user-${userId}-conversation-${conversationId}`,
});
```

### Dynamic Sessions

```typescript
class ChatService {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      name: 'Assistant',
      systemPrompt: '...',
      llm: provider,
      memory: true,
    });
  }

  async chat(userId: string, message: string) {
    // Set session per request
    return this.agent.run(message, {
      sessionId: `user-${userId}`,
    });
  }
}
```

## Custom Memory Providers

### InMemoryProvider

Default, in-process memory (lost on restart):

```typescript
import { InMemoryProvider } from '@contextai/core';

const memory = new InMemoryProvider({
  maxMessages: 100, // Keep last 100 messages
  maxTokens: 8000,  // Or limit by tokens
});

const agent = new Agent({
  memory,
  sessionId: 'session-1',
});
```

### Implementing Custom Memory

```typescript
interface MemoryProvider {
  add(sessionId: string, message: ChatMessage): Promise<void>;
  getHistory(sessionId: string, options?: MemoryOptions): Promise<ChatMessage[]>;
  clear(sessionId: string): Promise<void>;
  has(sessionId: string): Promise<boolean>;
}
```

#### Redis Memory

```typescript
class RedisMemoryProvider implements MemoryProvider {
  constructor(
    private redis: RedisClient,
    private ttl: number = 3600
  ) {}

  async add(sessionId: string, message: ChatMessage) {
    const key = `memory:${sessionId}`;
    await this.redis.rpush(key, JSON.stringify(message));
    await this.redis.expire(key, this.ttl);
  }

  async getHistory(sessionId: string) {
    const items = await this.redis.lrange(`memory:${sessionId}`, 0, -1);
    return items.map((item) => JSON.parse(item));
  }

  async clear(sessionId: string) {
    await this.redis.del(`memory:${sessionId}`);
  }

  async has(sessionId: string) {
    return (await this.redis.exists(`memory:${sessionId}`)) > 0;
  }
}

// Use it
const agent = new Agent({
  memory: new RedisMemoryProvider(redisClient),
  sessionId: 'user-123',
});
```

#### Database Memory

```typescript
class PostgresMemoryProvider implements MemoryProvider {
  constructor(private db: PrismaClient) {}

  async add(sessionId: string, message: ChatMessage) {
    await this.db.message.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
      },
    });
  }

  async getHistory(sessionId: string, options?: MemoryOptions) {
    return this.db.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: options?.maxMessages,
    });
  }

  async clear(sessionId: string) {
    await this.db.message.deleteMany({ where: { sessionId } });
  }

  async has(sessionId: string) {
    const count = await this.db.message.count({ where: { sessionId } });
    return count > 0;
  }
}
```

## Managing Context Windows

### The Problem

LLMs have limited context windows. Long conversations exceed limits.

### Token Budget

```typescript
const agent = new Agent({
  memory: true,
  maxContextTokens: 4000, // Reserve for memory
});
```

Memory is automatically truncated (oldest first) to fit.

### Manual Truncation

```typescript
const memory = new InMemoryProvider({
  maxMessages: 20, // Only last 20 messages
});

// Or by tokens
const memory = new InMemoryProvider({
  maxTokens: 4000, // ~4000 tokens
});
```

## Conversation Patterns

### Clear Memory on Topic Change

```typescript
async function chat(message: string) {
  // Detect new topic
  if (message.toLowerCase().includes('new topic') ||
      message.toLowerCase().includes('start over')) {
    await memory.clear(sessionId);
  }

  return agent.run(message);
}
```

### Summarize Long Conversations

```typescript
async function manageMemory() {
  const history = await memory.getHistory(sessionId);

  if (history.length > 30) {
    // Use LLM to summarize older messages
    const toSummarize = history.slice(0, -10);
    const summary = await summarizeWithLLM(toSummarize);

    // Clear and add summary
    await memory.clear(sessionId);
    await memory.add(sessionId, {
      role: 'system',
      content: `Previous conversation summary: ${summary}`,
    });

    // Add recent messages back
    for (const msg of history.slice(-10)) {
      await memory.add(sessionId, msg);
    }
  }
}
```

### Export/Import Conversations

```typescript
// Export
async function exportConversation(sessionId: string) {
  const history = await memory.getHistory(sessionId);
  return JSON.stringify(history);
}

// Import
async function importConversation(sessionId: string, data: string) {
  const history = JSON.parse(data);
  for (const message of history) {
    await memory.add(sessionId, message);
  }
}
```

## Multi-User Best Practices

### Isolate Sessions

```typescript
// Good: User-specific session
const agent = new Agent({
  sessionId: `user-${userId}`,
});

// Bad: Shared session (users see each other's history!)
const agent = new Agent({
  sessionId: 'global', // Don't do this
});
```

### Clean Up Stale Sessions

```typescript
// With Redis TTL
const memory = new RedisMemoryProvider(redis, 86400); // 24h

// Or periodic cleanup
async function cleanupStaleSessions() {
  const stale = await findStale(24 * 60 * 60 * 1000); // 24h
  for (const sessionId of stale) {
    await memory.clear(sessionId);
  }
}
```

### Handle Concurrent Access

```typescript
// Use locks for concurrent requests
async function chat(userId: string, message: string) {
  const lockKey = `lock:${userId}`;

  await redis.set(lockKey, '1', 'EX', 30, 'NX');
  try {
    return await agent.run(message, { sessionId: userId });
  } finally {
    await redis.del(lockKey);
  }
}
```

## Testing Memory

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('agent memory', () => {
  let agent: Agent;
  let memory: InMemoryProvider;

  beforeEach(() => {
    memory = new InMemoryProvider();
    agent = new Agent({
      name: 'Test',
      systemPrompt: 'Remember what users tell you.',
      llm: mockProvider,
      memory,
      sessionId: 'test-session',
    });
  });

  it('remembers user information', async () => {
    await agent.run('My name is Alice');
    const response = await agent.run('What is my name?');

    expect(response.output).toContain('Alice');
  });

  it('isolates sessions', async () => {
    await agent.run('I like cats', { sessionId: 'user-1' });
    await agent.run('I like dogs', { sessionId: 'user-2' });

    const r1 = await agent.run('What do I like?', { sessionId: 'user-1' });
    const r2 = await agent.run('What do I like?', { sessionId: 'user-2' });

    expect(r1.output).toContain('cats');
    expect(r2.output).toContain('dogs');
  });
});
```

## Next Steps

- [Memory Concept](../../concepts/memory.md) - Deep dive
- [Error Handling](./error-handling.md)
- [Create Agent](./create-agent.md)
