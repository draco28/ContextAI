# Streaming

Real-time responses and event handling in ContextAI.

## Why Streaming?

Streaming provides immediate feedback as the LLM generates content:

- **Better UX** - Users see responses as they're generated
- **Faster perceived latency** - First token appears quickly
- **Progress visibility** - See agent reasoning in real-time
- **Early cancellation** - Stop generation if off-track

## Stream Types

### Provider Streaming

Raw LLM output:

```typescript
for await (const chunk of provider.streamChat(messages)) {
  process.stdout.write(chunk.content);
}
```

### Agent Streaming

ReAct reasoning events:

```typescript
for await (const event of agent.stream(input)) {
  switch (event.type) {
    case 'thought':
      console.log('Thinking:', event.content);
      break;
    case 'action':
      console.log('Tool:', event.tool);
      break;
    case 'observation':
      console.log('Result:', event.content);
      break;
    case 'text':
      process.stdout.write(event.content);
      break;
    case 'done':
      console.log('Complete!');
      break;
  }
}
```

## StreamChunk Types

### From Providers

```typescript
interface StreamChunk {
  type: 'text' | 'tool_call' | 'thinking' | 'done';
  content: string;
  toolCall?: ToolCall;   // For tool_call type
  usage?: TokenUsage;    // For done type
}
```

### From Agents

```typescript
type AgentStreamEvent =
  | { type: 'thought'; content: string }
  | { type: 'action'; tool: string; input: Record<string, unknown> }
  | { type: 'observation'; result: unknown; success: boolean }
  | { type: 'text'; content: string }
  | { type: 'done'; response: AgentResponse }
  | { type: 'error'; error: Error };
```

## Using Provider Streams

### Basic Text Streaming

```typescript
const stream = provider.streamChat([
  { role: 'user', content: 'Write a story' }
]);

for await (const chunk of stream) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content);
  }
}
```

### With Tool Calls

```typescript
for await (const chunk of provider.streamChat(messages, { tools })) {
  switch (chunk.type) {
    case 'text':
      console.log('Text:', chunk.content);
      break;
    case 'tool_call':
      console.log('Tool call:', chunk.toolCall);
      // Execute tool and continue conversation
      break;
    case 'done':
      console.log('Finished. Tokens:', chunk.usage?.totalTokens);
      break;
  }
}
```

### Anthropic Extended Thinking

```typescript
import { AnthropicProvider } from '@contextaisdk/provider-anthropic';

const provider = new AnthropicProvider({
  model: 'claude-3-5-sonnet-20241022',
});

for await (const chunk of provider.streamChat(messages)) {
  switch (chunk.type) {
    case 'thinking':
      console.log('[Thinking]', chunk.content);
      break;
    case 'text':
      console.log('[Response]', chunk.content);
      break;
  }
}
```

## Using Agent Streams

### Full Event Handling

```typescript
const agent = new Agent({ /* config */ });

for await (const event of agent.stream('Research quantum computing')) {
  switch (event.type) {
    case 'thought':
      // Agent is reasoning
      console.log(`\n[Thought] ${event.content}`);
      break;

    case 'action':
      // Agent is calling a tool
      console.log(`\n[Action] ${event.tool}(${JSON.stringify(event.input)})`);
      break;

    case 'observation':
      // Tool returned a result
      console.log(`[Observation] ${JSON.stringify(event.result)}`);
      break;

    case 'text':
      // Final answer being generated
      process.stdout.write(event.content);
      break;

    case 'done':
      // Stream complete
      console.log('\n\n[Done]');
      console.log('Tokens:', event.response.trace.totalTokens);
      console.log('Duration:', event.response.trace.durationMs, 'ms');
      break;

    case 'error':
      // Error occurred
      console.error('[Error]', event.error.message);
      break;
  }
}
```

### Collecting Stream Content

```typescript
let fullText = '';
let lastResponse: AgentResponse | undefined;

for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    fullText += event.content;
  } else if (event.type === 'done') {
    lastResponse = event.response;
  }
}

console.log('Full text:', fullText);
console.log('Trace:', lastResponse?.trace);
```

## React Hooks for Streaming

### useChat Hook

```tsx
import { useChat } from '@contextaisdk/react';

function ChatUI() {
  const {
    messages,
    streamingContent,  // Current streaming text
    isLoading,
    sendMessage,
  } = useChat(agent);

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}

      {streamingContent && (
        <div className="streaming">{streamingContent}</div>
      )}
    </div>
  );
}
```

### useAgentStream Hook

For ReAct reasoning visualization:

```tsx
import { useAgentStream } from '@contextaisdk/react';

function AgentUI() {
  const {
    messages,
    streamingContent,
    reasoningSteps,  // Thought/Action/Observation steps
    isLoading,
    stream,
  } = useAgentStream(agent);

  return (
    <div>
      {/* Show reasoning */}
      {reasoningSteps.map((step, i) => (
        <div key={i} className={`step-${step.type}`}>
          <strong>{step.type}:</strong> {step.content}
        </div>
      ))}

      {/* Show final response */}
      {streamingContent && <div>{streamingContent}</div>}
    </div>
  );
}
```

## Cancellation

### Abort Controller

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  for await (const event of agent.stream(input, {
    signal: controller.signal,
  })) {
    console.log(event);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream was cancelled');
  }
}
```

### React Abort Hook

```tsx
function ChatUI() {
  const { sendMessage, abort, isLoading } = useChat(agent);

  return (
    <div>
      <button onClick={() => sendMessage('Hello')}>
        Send
      </button>
      {isLoading && (
        <button onClick={abort}>Cancel</button>
      )}
    </div>
  );
}
```

## Buffering and Backpressure

### Token-by-Token Processing

```typescript
// Direct processing (can be slow)
for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    updateUI(event.content);
  }
}
```

### Batched Updates

```typescript
// Batch updates for better performance
let buffer = '';
const flushInterval = 50; // ms

const flush = () => {
  if (buffer) {
    updateUI(buffer);
    buffer = '';
  }
};

const timer = setInterval(flush, flushInterval);

for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    buffer += event.content;
  }
}

flush();
clearInterval(timer);
```

## Server-Sent Events (SSE)

For HTTP streaming:

```typescript
// Express/Node.js
import express from 'express';

const app = express();

app.get('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const input = req.query.input as string;

  for await (const event of agent.stream(input)) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
```

### Client-Side Consumption

```typescript
const eventSource = new EventSource('/api/chat?input=Hello');

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }

  const data = JSON.parse(event.data);
  handleEvent(data);
};
```

## Error Handling in Streams

```typescript
try {
  for await (const event of agent.stream(input)) {
    if (event.type === 'error') {
      // Error during streaming (agent can continue)
      console.error('Stream error:', event.error);
    } else {
      handleEvent(event);
    }
  }
} catch (error) {
  // Fatal error (stream stopped)
  console.error('Fatal stream error:', error);
}
```

## Performance Tips

### 1. Don't Block the Event Loop

```typescript
// Bad: Synchronous processing
for await (const event of stream) {
  heavySyncOperation(event); // Blocks
}

// Good: Async processing
for await (const event of stream) {
  await heavyAsyncOperation(event);
}
```

### 2. Use Batching for UI Updates

```typescript
// Bad: Update on every token
for await (const event of stream) {
  setContent(prev => prev + event.content);
}

// Good: Batch updates
const chunks: string[] = [];
for await (const event of stream) {
  chunks.push(event.content);
}
setContent(chunks.join(''));
```

### 3. Clean Up Resources

```typescript
const controller = new AbortController();

// Always clean up on unmount
useEffect(() => {
  return () => controller.abort();
}, []);
```

## Related Topics

- [Agents](./agents.md) - Agent configuration
- [ReAct Pattern](./react-pattern.md) - Understanding events
- [React: Streaming UI](../how-to/react/streaming-ui.md) - Building UIs
