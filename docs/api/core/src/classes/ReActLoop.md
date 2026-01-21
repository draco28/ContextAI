[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ReActLoop

# Class: ReActLoop

Defined in: [core/src/agent/react-loop.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/react-loop.ts#L38)

ReAct (Reasoning + Acting) loop implementation

Executes the Thought -> Action -> Observation cycle:
1. LLM generates a Thought (reasoning about what to do)
2. LLM decides on an Action (which tool to use)
3. Tool is executed and produces an Observation
4. Loop repeats until LLM produces a final answer

## Example

```typescript
const loop = new ReActLoop(llmProvider, tools, 10);
const { output, trace } = await loop.execute(messages);
console.log(trace.steps); // See the reasoning chain
```

## Constructors

### Constructor

> **new ReActLoop**(`llm`, `tools`, `maxIterations`, `logger`, `errorRecoveryConfig?`): `ReActLoop`

Defined in: [core/src/agent/react-loop.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/react-loop.ts#L45)

#### Parameters

##### llm

[`LLMProvider`](../interfaces/LLMProvider.md)

##### tools

[`Tool`](../interfaces/Tool.md)\<`ZodType`\<`any`, `ZodTypeDef`, `any`\>, `unknown`\>[] = `[]`

##### maxIterations

`number` = `DEFAULT_MAX_ITERATIONS`

##### logger

[`Logger`](../interfaces/Logger.md) = `noopLogger`

##### errorRecoveryConfig?

`ErrorRecoveryConfig`

#### Returns

`ReActLoop`

## Methods

### execute()

> **execute**(`messages`, `options`, `callbacks`): `Promise`\<\{ `output`: `string`; `trace`: [`ReActTrace`](../interfaces/ReActTrace.md); \}\>

Defined in: [core/src/agent/react-loop.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/react-loop.ts#L72)

Execute the ReAct loop

Uses arrow function syntax to preserve `this` binding when passed as callback.

#### Parameters

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

Initial conversation messages

##### options

[`AgentRunOptions`](../interfaces/AgentRunOptions.md) = `{}`

Runtime options (maxIterations, signal, callbacks)

##### callbacks

[`ReActEventCallbacks`](../interfaces/ReActEventCallbacks.md) = `{}`

Event callbacks for real-time debugging (can also be in options)

#### Returns

`Promise`\<\{ `output`: `string`; `trace`: [`ReActTrace`](../interfaces/ReActTrace.md); \}\>

***

### executeStream()

> **executeStream**(`messages`, `options`): `AsyncGenerator`\<[`StreamEvent`](../type-aliases/StreamEvent.md), `void`, `unknown`\>

Defined in: [core/src/agent/react-loop.ts:244](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/react-loop.ts#L244)

Execute the ReAct loop with true token-by-token streaming

Yields events as they occur during execution:
- `thought_delta`: Individual tokens as LLM generates reasoning
- `thought`: Complete thought after streaming finishes
- `action`: Tool being called
- `toolCall`: Tool call about to execute
- `observation`: Tool execution result
- `output_delta`: Individual tokens of final output
- `error`: Error occurred during streaming
- `done`: Completion with full trace

NOTE: This is a generator function that cannot use arrow function syntax.
Do not pass this method as a callback directly - use .bind(this) if needed.

#### Parameters

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

##### options

[`AgentRunOptions`](../interfaces/AgentRunOptions.md) = `{}`

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../type-aliases/StreamEvent.md), `void`, `unknown`\>

#### Example

```typescript
for await (const event of loop.executeStream(messages)) {
  if (event.type === 'thought_delta') {
    process.stdout.write(event.content); // Real-time display
  }
}
```
