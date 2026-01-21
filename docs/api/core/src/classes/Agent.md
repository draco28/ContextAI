[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / Agent

# Class: Agent

Defined in: [core/src/agent/agent.ts:56](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L56)

ContextAI Agent - ReAct-based reasoning agent

The Agent class is the main entry point for creating AI agents that can:
- Reason about tasks using the ReAct pattern
- Use tools to interact with external systems
- Stream responses in real-time
- Maintain conversation context across multiple interactions

## Example

```typescript
// Basic usage (stateless)
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: myLLMProvider,
  tools: [searchTool, calculatorTool],
});

const response = await agent.run('What is 2 + 2?');

// With conversation memory (stateful)
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: myLLMProvider,
  memory: new InMemoryProvider(),
  sessionId: 'user-123',
  maxContextTokens: 4000,
});

await agent.run('My name is Alice');
await agent.run('What is my name?'); // Remembers: "Alice"
```

## Constructors

### Constructor

> **new Agent**(`config`): `Agent`

Defined in: [core/src/agent/agent.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L67)

#### Parameters

##### config

[`AgentConfig`](../interfaces/AgentConfig.md)

#### Returns

`Agent`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [core/src/agent/agent.ts:57](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L57)

## Methods

### run()

> **run**(`input`, `options`): `Promise`\<[`AgentResponse`](../interfaces/AgentResponse.md)\>

Defined in: [core/src/agent/agent.ts:173](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L173)

Run the agent with a user message (non-streaming)

Uses arrow function syntax to preserve `this` binding when passed as callback.

#### Parameters

##### input

`string`

The user's message or question

##### options

[`AgentRunOptions`](../interfaces/AgentRunOptions.md) = `{}`

Optional runtime configuration

#### Returns

`Promise`\<[`AgentResponse`](../interfaces/AgentResponse.md)\>

AgentResponse with output, trace, and success status

#### Example

```typescript
const response = await agent.run('What is the weather?', {
  maxIterations: 5,
});

// Safe to pass as callback
const runFn = agent.run;
await runFn('Hello'); // Works correctly
```

***

### stream()

> **stream**(`input`, `options`): [`StreamingAgentResponse`](../type-aliases/StreamingAgentResponse.md)

Defined in: [core/src/agent/agent.ts:293](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L293)

Run the agent with streaming output (TRUE STREAMING)

Yields events AS THEY OCCUR during execution, not after completion.
This enables real-time UI updates for each thought, action, and observation.

Event types:
- `thought`: Agent's reasoning (as soon as LLM responds)
- `action`: Tool being selected
- `observation`: Tool result (after execution)
- `text`: Final output text
- `done`: Completion with full response

**Note**: Async generators cannot use arrow function syntax.
Do NOT pass this method as a callback - call it directly on the agent instance.

#### Parameters

##### input

`string`

The user's message or question

##### options

[`AgentRunOptions`](../interfaces/AgentRunOptions.md) = `{}`

Optional runtime configuration

#### Returns

[`StreamingAgentResponse`](../type-aliases/StreamingAgentResponse.md)

#### Example

```typescript
// ✅ CORRECT - Call directly on agent
for await (const event of agent.stream('Analyze this data')) {
  switch (event.type) {
    case 'thought':
      console.log('Thinking:', event.content);
      break;
    case 'done':
      console.log('Complete!', event.response.trace);
      break;
  }
}
```

***

### getContext()

> **getContext**(): [`ConversationContext`](ConversationContext.md)

Defined in: [core/src/agent/agent.ts:430](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L430)

Get the current conversation context

#### Returns

[`ConversationContext`](ConversationContext.md)

ConversationContext instance for inspection or manipulation

***

### clearContext()

> **clearContext**(`clearMemory`): `Promise`\<`void`\>

Defined in: [core/src/agent/agent.ts:439](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/agent.ts#L439)

Clear the conversation context and optionally clear memory

#### Parameters

##### clearMemory

`boolean` = `false`

If true, also clears persisted memory

#### Returns

`Promise`\<`void`\>
