[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / InMemoryProvider

# Class: InMemoryProvider

Defined in: [core/src/agent/memory.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L76)

InMemoryProvider - Default memory provider using in-process storage

Stores conversations in a Map. Data is lost when process restarts.
Suitable for development, testing, and short-lived conversations.

## Example

```typescript
const memory = new InMemoryProvider();
const agent = new Agent({
  // ...
  memory,
  sessionId: 'user-123',
});
```

## Implements

- [`MemoryProvider`](../interfaces/MemoryProvider.md)

## Constructors

### Constructor

> **new InMemoryProvider**(): `InMemoryProvider`

#### Returns

`InMemoryProvider`

## Methods

### save()

> **save**(`sessionId`, `messages`): `Promise`\<`void`\>

Defined in: [core/src/agent/memory.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L83)

Save messages to in-memory storage
Creates a defensive copy to prevent external mutation

#### Parameters

##### sessionId

`string`

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`MemoryProvider`](../interfaces/MemoryProvider.md).[`save`](../interfaces/MemoryProvider.md#save)

***

### load()

> **load**(`sessionId`): `Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>

Defined in: [core/src/agent/memory.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L92)

Load messages from in-memory storage
Returns a defensive copy to prevent external mutation

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>

#### Implementation of

[`MemoryProvider`](../interfaces/MemoryProvider.md).[`load`](../interfaces/MemoryProvider.md#load)

***

### clear()

> **clear**(`sessionId`): `Promise`\<`void`\>

Defined in: [core/src/agent/memory.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L101)

Clear messages for a session

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`MemoryProvider`](../interfaces/MemoryProvider.md).[`clear`](../interfaces/MemoryProvider.md#clear)

***

### has()

> **has**(`sessionId`): `boolean`

Defined in: [core/src/agent/memory.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L108)

Check if a session exists (utility method, not part of interface)

#### Parameters

##### sessionId

`string`

#### Returns

`boolean`

***

### getSessions()

> **getSessions**(): `string`[]

Defined in: [core/src/agent/memory.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L115)

Get all session IDs (utility method for debugging)

#### Returns

`string`[]

***

### clearAll()

> **clearAll**(): `void`

Defined in: [core/src/agent/memory.ts:122](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/memory.ts#L122)

Clear all sessions (utility method for testing)

#### Returns

`void`
