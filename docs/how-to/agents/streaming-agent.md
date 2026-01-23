# How to Stream Agent Responses

Build real-time interfaces with streaming agent output.

## Why Streaming?

Streaming provides immediate feedback:
- Users see responses as they generate
- Lower perceived latency
- Can cancel early if off-track
- Better UX for long responses

## Basic Streaming

### Using agent.stream()

```typescript
import { Agent } from '@contextaisdk/core';

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'Be helpful.',
  llm: provider,
});

// Stream instead of run
for await (const event of agent.stream('Write a short story')) {
  switch (event.type) {
    case 'text':
      process.stdout.write(event.content);
      break;
    case 'done':
      console.log('\nComplete!');
      break;
  }
}
```

### Event Types

```typescript
for await (const event of agent.stream(input)) {
  switch (event.type) {
    // Agent reasoning
    case 'thought':
      console.log('[Thinking]', event.content);
      break;

    // Tool being called
    case 'action':
      console.log(`[Tool] ${event.tool}`, event.input);
      break;

    // Tool result
    case 'observation':
      console.log('[Result]', event.content);
      break;

    // Text content (final answer)
    case 'text':
      process.stdout.write(event.content);
      break;

    // Stream complete
    case 'done':
      console.log('\n[Done]');
      console.log('Tokens:', event.response.trace.totalTokens);
      break;

    // Error occurred
    case 'error':
      console.error('[Error]', event.error.message);
      break;
  }
}
```

## Collecting Stream Content

### Full Text

```typescript
let fullText = '';

for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    fullText += event.content;
  }
}

console.log('Complete response:', fullText);
```

### With Response Object

```typescript
let fullText = '';
let response: AgentResponse | undefined;

for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    fullText += event.content;
  } else if (event.type === 'done') {
    response = event.response;
  }
}

console.log('Text:', fullText);
console.log('Trace:', response?.trace);
```

## Streaming with Tools

When using tools, you'll see the full reasoning process:

```typescript
const agent = new Agent({
  name: 'Math Assistant',
  systemPrompt: 'Use calculator for math.',
  llm: provider,
  tools: [calculatorTool],
});

for await (const event of agent.stream('What is 25% of 80?')) {
  switch (event.type) {
    case 'thought':
      console.log(`\n💭 ${event.content}`);
      break;
    case 'action':
      console.log(`\n🔧 Using ${event.tool}:`, JSON.stringify(event.input));
      break;
    case 'observation':
      console.log(`📋 Result:`, JSON.stringify(event.content));
      break;
    case 'text':
      process.stdout.write(event.content);
      break;
  }
}
```

Output:
```
💭 I need to calculate 25% of 80
🔧 Using calculator: {"expression":"80 * 0.25"}
📋 Result: {"result":20}
25% of 80 is 20.
```

## Cancellation

### Using AbortController

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => {
  controller.abort();
  console.log('\nCancelled!');
}, 5000);

try {
  for await (const event of agent.stream(input, {
    signal: controller.signal,
  })) {
    // Handle events
    if (event.type === 'text') {
      process.stdout.write(event.content);
    }
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream was cancelled');
  }
}
```

### User-Triggered Cancel

```typescript
import * as readline from 'readline';

const controller = new AbortController();

// Listen for 'q' to quit
process.stdin.setRawMode(true);
process.stdin.on('data', (key) => {
  if (key.toString() === 'q') {
    controller.abort();
  }
});

console.log('Press "q" to cancel...\n');

for await (const event of agent.stream(input, {
  signal: controller.signal,
})) {
  if (event.type === 'text') {
    process.stdout.write(event.content);
  }
}
```

## HTTP Streaming (SSE)

### Express Server

```typescript
import express from 'express';

const app = express();

app.get('/api/chat', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const input = req.query.input as string;

  try {
    for await (const event of agent.stream(input)) {
      // Send as SSE
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  }

  res.end();
});
```

### Client-Side

```typescript
function streamChat(input: string) {
  const eventSource = new EventSource(
    `/api/chat?input=${encodeURIComponent(input)}`
  );

  eventSource.onmessage = (e) => {
    if (e.data === '[DONE]') {
      eventSource.close();
      return;
    }

    const event = JSON.parse(e.data);
    handleEvent(event);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => eventSource.close(); // Return cancel function
}
```

## React Integration

### useAgentStream Hook

```tsx
import { useAgentStream } from '@contextaisdk/react';

function StreamingChat() {
  const {
    streamingContent,  // Current streaming text
    reasoningSteps,    // Thought/Action/Observation steps
    isLoading,
    stream,
    abort,
  } = useAgentStream(agent);

  return (
    <div>
      {/* Show reasoning */}
      {reasoningSteps.map((step, i) => (
        <div key={i} className={`step-${step.type}`}>
          <strong>{step.type}:</strong> {step.content}
        </div>
      ))}

      {/* Show streaming response */}
      {streamingContent && (
        <div className="response">{streamingContent}</div>
      )}

      {/* Controls */}
      <button onClick={() => stream('Hello!')} disabled={isLoading}>
        Send
      </button>
      {isLoading && <button onClick={abort}>Cancel</button>}
    </div>
  );
}
```

### useChat Hook

```tsx
import { useChat } from '@contextaisdk/react';

function Chat() {
  const {
    messages,
    streamingContent,
    isLoading,
    sendMessage,
    abort,
  } = useChat(agent);

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id} className={m.role}>
          {m.content}
        </div>
      ))}

      {streamingContent && (
        <div className="assistant streaming">{streamingContent}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button disabled={isLoading}>Send</button>
        {isLoading && <button type="button" onClick={abort}>Stop</button>}
      </form>
    </div>
  );
}
```

## Performance Tips

### 1. Batch UI Updates

```typescript
let buffer = '';
const flush = () => {
  if (buffer) {
    updateUI(buffer);
    buffer = '';
  }
};

const timer = setInterval(flush, 50); // Update every 50ms

for await (const event of agent.stream(input)) {
  if (event.type === 'text') {
    buffer += event.content;
  }
}

flush();
clearInterval(timer);
```

### 2. Virtualize Long Outputs

For very long outputs, use virtualized scrolling:

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedOutput({ lines }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={lines.length}
      itemSize={24}
    >
      {({ index, style }) => (
        <div style={style}>{lines[index]}</div>
      )}
    </FixedSizeList>
  );
}
```

### 3. Don't Block the Event Loop

```typescript
// Bad: Synchronous processing
for await (const event of stream) {
  heavySyncOperation(event); // Blocks
}

// Good: Let other tasks run
for await (const event of stream) {
  await new Promise((r) => setImmediate(r)); // Yield
  handleEvent(event);
}
```

## Debugging Streams

### Log All Events

```typescript
for await (const event of agent.stream(input)) {
  console.log('[Event]', JSON.stringify(event, null, 2));
}
```

### Time Events

```typescript
const start = Date.now();

for await (const event of agent.stream(input)) {
  const elapsed = Date.now() - start;
  console.log(`[${elapsed}ms] ${event.type}`);
}
```

## Next Steps

- [React Streaming UI](../react/streaming-ui.md)
- [Streaming Concept](../../concepts/streaming.md)
- [Error Handling](./error-handling.md)
