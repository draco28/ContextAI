[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / MemoryProvider

# Interface: MemoryProvider

Defined in: [core/src/agent/memory.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L32)

MemoryProvider interface for conversation persistence

Implement this interface to store conversation history in any backend:
- File system
- Redis/Memcached
- PostgreSQL/MongoDB
- Vector databases (for semantic retrieval)

## Example

```typescript
class RedisMemoryProvider implements MemoryProvider {
  constructor(private redis: RedisClient) {}

  async save(sessionId: string, messages: ChatMessage[]) {
    await this.redis.set(`chat:${sessionId}`, JSON.stringify(messages));
  }

  async load(sessionId: string) {
    const data = await this.redis.get(`chat:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  async clear(sessionId: string) {
    await this.redis.del(`chat:${sessionId}`);
  }
}
```

## Methods

### save()

> **save**(`sessionId`, `messages`): `Promise`\<`void`\>

Defined in: [core/src/agent/memory.ts:40](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L40)

Save messages for a session
Called after each agent interaction

#### Parameters

##### sessionId

`string`

Unique identifier for the conversation

##### messages

[`ChatMessage`](ChatMessage.md)[]

All messages in the conversation (provider decides what to persist)

#### Returns

`Promise`\<`void`\>

***

### load()

> **load**(`sessionId`): `Promise`\<[`ChatMessage`](ChatMessage.md)[]\>

Defined in: [core/src/agent/memory.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L49)

Load messages for a session
Called when resuming a conversation

#### Parameters

##### sessionId

`string`

Unique identifier for the conversation

#### Returns

`Promise`\<[`ChatMessage`](ChatMessage.md)[]\>

Array of messages, empty array if session not found

***

### clear()

> **clear**(`sessionId`): `Promise`\<`void`\>

Defined in: [core/src/agent/memory.ts:57](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L57)

Clear all messages for a session
Called when conversation should be reset

#### Parameters

##### sessionId

`string`

Unique identifier for the conversation

#### Returns

`Promise`\<`void`\>
