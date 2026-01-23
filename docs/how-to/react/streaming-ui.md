# How to Build Streaming UI

Create real-time interfaces that show agent responses as they generate.

## Why Streaming UI?

- **Immediate feedback** - Users see responses as they generate
- **Lower perceived latency** - First token appears quickly
- **Agent transparency** - Show reasoning process in real-time
- **Cancelability** - Users can stop early if off-track

## Basic Streaming

### useChat Hook

```tsx
import { useChat } from '@contextaisdk/react';

function StreamingChat() {
  const {
    messages,
    streamingContent, // Current streaming text
    isLoading,
    sendMessage,
    abort,
  } = useChat(agent);

  return (
    <div>
      {/* Previous messages */}
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}

      {/* Streaming response */}
      {streamingContent && (
        <div className="streaming">
          {streamingContent}
          <span className="cursor">▋</span>
        </div>
      )}

      {/* Cancel button */}
      {isLoading && (
        <button onClick={abort}>Stop generating</button>
      )}
    </div>
  );
}
```

### Streaming Animation

```css
.streaming {
  position: relative;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Typing effect */
.streaming-text {
  overflow: hidden;
  border-right: 2px solid;
  animation: typing 0.1s steps(1) forwards;
}
```

## ReAct Reasoning Visualization

### useAgentStream Hook

Show the agent's thought process:

```tsx
import { useAgentStream } from '@contextaisdk/react';

function AgentWithReasoning() {
  const {
    messages,
    streamingContent,
    reasoningSteps, // Thought/Action/Observation steps
    isLoading,
    stream,
    abort,
  } = useAgentStream(agent);

  return (
    <div className="agent-ui">
      {/* Reasoning trace */}
      {reasoningSteps.length > 0 && (
        <div className="reasoning-panel">
          <h3>Agent Reasoning</h3>
          {reasoningSteps.map((step, i) => (
            <ReasoningStep key={i} step={step} />
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="messages">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {streamingContent && (
          <div className="streaming-message">
            {streamingContent}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={stream} isLoading={isLoading} />
    </div>
  );
}

function ReasoningStep({ step }) {
  const icons = {
    thought: '💭',
    action: '🔧',
    observation: '📋',
  };

  const colors = {
    thought: 'blue',
    action: 'green',
    observation: 'orange',
  };

  return (
    <div className={`step step-${step.type}`}>
      <span className="icon">{icons[step.type]}</span>
      <span className="label">{step.type}</span>
      <div className="content">
        {step.type === 'action'
          ? `${step.toolName}(${JSON.stringify(step.input)})`
          : step.content}
      </div>
    </div>
  );
}
```

### ReasoningTrace Component

```tsx
import { ReasoningTrace, ThoughtStep, ActionStep, ObservationStep } from '@contextaisdk/react';

function AgentTrace({ trace }) {
  return (
    <ReasoningTrace trace={trace}>
      <ThoughtStep className="thought-bubble" />
      <ActionStep className="action-step" />
      <ObservationStep className="observation-card" />
    </ReasoningTrace>
  );
}

// Or with custom rendering
<ReasoningTrace
  trace={trace}
  renderStep={(step, index) => (
    <CustomStep key={index} step={step} />
  )}
/>
```

### Styling the Trace

```css
.reasoning-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.step-thought {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.step-action {
  background: #e8f5e9;
  border-left: 3px solid #4caf50;
}

.step-observation {
  background: #fff3e0;
  border-left: 3px solid #ff9800;
}

.step .icon {
  font-size: 1.2rem;
}

.step .label {
  font-weight: 600;
  text-transform: capitalize;
  color: #666;
  min-width: 80px;
}

.step .content {
  flex: 1;
  font-family: monospace;
  font-size: 0.9rem;
}
```

## Progressive Loading

### Skeleton States

```tsx
function MessageSkeleton() {
  return (
    <div className="message-skeleton" aria-busy="true">
      <div className="avatar-skeleton" />
      <div className="content-skeleton">
        <div className="line" style={{ width: '80%' }} />
        <div className="line" style={{ width: '60%' }} />
        <div className="line" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

function Chat() {
  const { isLoading, streamingContent } = useChat(agent);

  return (
    <div>
      {/* Show skeleton before streaming starts */}
      {isLoading && !streamingContent && <MessageSkeleton />}

      {/* Show streaming content once available */}
      {streamingContent && (
        <StreamingMessage content={streamingContent} />
      )}
    </div>
  );
}
```

### CSS for Skeleton

```css
.message-skeleton {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.avatar-skeleton {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
}

.content-skeleton {
  flex: 1;
}

.line {
  height: 1rem;
  background: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Performance Optimization

### Batched Updates

```tsx
function OptimizedChat() {
  const [displayContent, setDisplayContent] = useState('');
  const { streamingContent } = useChat(agent);

  // Batch updates every 50ms
  useEffect(() => {
    const timer = setInterval(() => {
      if (streamingContent !== displayContent) {
        setDisplayContent(streamingContent || '');
      }
    }, 50);

    return () => clearInterval(timer);
  }, [streamingContent, displayContent]);

  return <div>{displayContent}</div>;
}
```

### Virtualized Long Messages

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedMessages({ messages }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={100}
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageBubble message={messages[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Memoization

```tsx
const MessageBubble = memo(function MessageBubble({ message }) {
  return (
    <div className={`message ${message.role}`}>
      {message.content}
    </div>
  );
});

// Only re-renders when message changes
```

## Accessibility

### Live Regions

```tsx
import { useAnnouncer } from '@contextaisdk/react';

function AccessibleChat() {
  const { announce } = useAnnouncer();
  const { messages } = useChat(agent, {
    onMessage: (message) => {
      if (message.role === 'assistant') {
        announce(`Assistant says: ${message.content.slice(0, 100)}`);
      }
    },
  });

  return (
    <div role="log" aria-live="polite">
      {/* Messages */}
    </div>
  );
}
```

### Screen Reader Status

```tsx
function StreamingStatus({ isLoading, streamingContent }) {
  return (
    <div aria-live="polite" className="sr-only">
      {isLoading && !streamingContent && 'Thinking...'}
      {streamingContent && 'Generating response...'}
    </div>
  );
}
```

### Focus Management

```tsx
import { useFocusTrap } from '@contextaisdk/react';

function ChatModal({ isOpen, onClose }) {
  const ref = useFocusTrap(isOpen);

  return (
    <div ref={ref} role="dialog" aria-modal="true">
      <Chat />
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Error States

### Graceful Degradation

```tsx
function ChatWithErrors() {
  const { error, isLoading, sendMessage } = useChat(agent, {
    onError: (err) => {
      // Don't show all errors
      if (err.code === 'RATE_LIMITED') {
        showToast('Please wait a moment before sending another message');
      }
    },
  });

  return (
    <div>
      {error && error.code !== 'RATE_LIMITED' && (
        <div className="error-banner" role="alert">
          <p>{error.message}</p>
          <button onClick={() => sendMessage('retry')}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
```

### Retry UI

```tsx
function RetryableMessage({ message, onRetry }) {
  if (message.error) {
    return (
      <div className="failed-message">
        <p>Failed to send: {message.content}</p>
        <button onClick={() => onRetry(message)}>
          Retry
        </button>
      </div>
    );
  }

  return <MessageBubble message={message} />;
}
```

## Complete Example

```tsx
// StreamingChat.tsx
import { useAgentStream, useAnnouncer } from '@contextaisdk/react';
import { Agent } from '@contextaisdk/core';
import { useState, useRef, useEffect, memo } from 'react';

export function StreamingChat({ agent }: { agent: Agent }) {
  const {
    messages,
    streamingContent,
    reasoningSteps,
    isLoading,
    error,
    stream,
    abort,
  } = useAgentStream(agent);

  const { announce } = useAnnouncer();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Announce new messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      announce(`New response received`);
    }
  }, [messages, announce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      stream(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Reasoning panel (collapsible) */}
      {reasoningSteps.length > 0 && (
        <ReasoningPanel steps={reasoningSteps} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" role="log">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {streamingContent && (
          <div className="flex gap-2 mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              {streamingContent}
              <span className="animate-pulse">▋</span>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <LoadingIndicator />
        )}

        {error && (
          <ErrorBanner error={error} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded"
          />
          {isLoading ? (
            <button type="button" onClick={abort}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()}>
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : ''}`}>
      <div
        className={`p-3 rounded-lg max-w-[70%] ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
});
```

## Next Steps

- [Chat Interface](./chat-interface.md) - Full chat UI
- [Streaming Concept](../../concepts/streaming.md) - Deep dive
- [React Package](../../packages/react/README.md) - All components
