# How to Build a Chat Interface

Create a chat UI with ContextAI React components and hooks.

## Prerequisites

```bash
pnpm add @contextai/react @contextai/core react
```

## Quick Start

```tsx
import { useChat, ChatWindow } from '@contextai/react';
import { Agent } from '@contextai/core';

function Chat() {
  const agent = useMemo(() => new Agent({
    name: 'Assistant',
    systemPrompt: 'You are helpful.',
    llm: provider,
  }), []);

  const chat = useChat(agent);

  return <ChatWindow {...chat} />;
}
```

## Using the useChat Hook

### Basic Usage

```tsx
import { useChat } from '@contextai/react';

function ChatApp() {
  const {
    messages,         // Message[] - conversation history
    streamingContent, // string | null - current streaming text
    isLoading,        // boolean - request in progress
    error,            // Error | null
    sendMessage,      // (content: string) => Promise<void>
    clearMessages,    // () => void
    abort,            // () => void - cancel request
    setMessages,      // Dispatch for manual control
  } = useChat(agent);

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}

        {/* Streaming indicator */}
        {streamingContent && (
          <div className="message assistant streaming">
            {streamingContent}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="error" role="alert">
          {error.message}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        onCancel={abort}
      />
    </div>
  );
}
```

### With Options

```tsx
const chat = useChat(agent, {
  // Callbacks
  onMessage: (message) => {
    console.log('New message:', message);
    saveToHistory(message);
  },
  onError: (error) => {
    reportError(error);
  },
  onComplete: () => {
    playSound('message-received');
  },

  // Initial state
  initialMessages: loadedMessages,
});
```

## Building Components

### Message List

```tsx
interface MessageListProps {
  messages: Message[];
  streamingContent: string | null;
}

function MessageList({ messages, streamingContent }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, streamingContent]);

  return (
    <div ref={listRef} className="message-list" role="log">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {streamingContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
          }}
          isStreaming
        />
      )}
    </div>
  );
}
```

### Message Bubble

```tsx
interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  return (
    <div
      className={`message-bubble ${message.role}`}
      aria-label={`${message.role} message`}
    >
      {/* Avatar */}
      <div className="avatar">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>

      {/* Content */}
      <div className="content">
        <Markdown>{message.content}</Markdown>
        {isStreaming && <span className="cursor">▋</span>}
      </div>
    </div>
  );
}
```

### Chat Input

```tsx
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function ChatInput({ onSend, isLoading, onCancel }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  // Submit on Enter (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isLoading}
        rows={1}
        aria-label="Message input"
      />

      {isLoading ? (
        <button type="button" onClick={onCancel} aria-label="Cancel">
          ⏹️
        </button>
      ) : (
        <button type="submit" disabled={!input.trim()} aria-label="Send">
          ➤
        </button>
      )}
    </form>
  );
}
```

## Using Built-in Components

### ChatWindow

```tsx
import { ChatWindow } from '@contextai/react';

function App() {
  const chat = useChat(agent);

  return (
    <ChatWindow
      messages={chat.messages}
      streamingContent={chat.streamingContent}
      isLoading={chat.isLoading}
      error={chat.error}
      onSend={chat.sendMessage}
    />
  );
}
```

### With Custom Rendering

```tsx
<ChatWindow
  {...chat}
  renderMessages={(messages) => (
    <CustomMessageList messages={messages} />
  )}
  renderInput={(props) => (
    <CustomInput {...props} showEmojis />
  )}
/>
```

### MessageList Component

```tsx
import { MessageList } from '@contextai/react';

<MessageList
  messages={messages}
  streamingContent={streamingContent}
  renderMessage={(message, index) => (
    <CustomMessage key={message.id} message={message} />
  )}
/>
```

### MessageInput Component

```tsx
import { MessageInput } from '@contextai/react';

<MessageInput
  onSubmit={sendMessage}
  isDisabled={isLoading}
  placeholder="Ask me anything..."
/>
```

## Styling

### CSS Classes

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message-bubble {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.message-bubble .content {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 70%;
}

.message-bubble.user .content {
  background: #007bff;
  color: white;
}

.message-bubble.assistant .content {
  background: #f1f1f1;
}

.streaming .cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #ddd;
}

.chat-input textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  resize: none;
}

.chat-input button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.chat-input button:disabled {
  opacity: 0.5;
}
```

### With Tailwind

```tsx
function ChatApp() {
  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[70%] ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <form className="flex gap-2 p-4 border-t">
        <textarea
          className="flex-1 p-2 border rounded resize-none"
          rows={1}
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
}
```

## Error Handling

```tsx
function ChatApp() {
  const { error, sendMessage, clearMessages } = useChat(agent, {
    onError: (error) => {
      // Log to error tracking
      Sentry.captureException(error);
    },
  });

  if (error) {
    return (
      <div className="error-container" role="alert">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <div className="actions">
          <button onClick={() => sendMessage('Retry')}>
            Retry
          </button>
          <button onClick={clearMessages}>
            Clear Chat
          </button>
        </div>
      </div>
    );
  }

  // Normal render
}
```

## Loading States

```tsx
function LoadingIndicator() {
  return (
    <div className="loading" aria-label="Loading">
      <span className="dot">•</span>
      <span className="dot">•</span>
      <span className="dot">•</span>
    </div>
  );
}

function ChatApp() {
  const { isLoading, streamingContent } = useChat(agent);

  return (
    <div>
      {/* Show loading only before streaming starts */}
      {isLoading && !streamingContent && <LoadingIndicator />}

      {/* Show streaming content */}
      {streamingContent && (
        <div className="streaming">{streamingContent}</div>
      )}
    </div>
  );
}
```

## Persistence

### Save to localStorage

```tsx
function ChatApp() {
  const [savedMessages, setSavedMessages] = useState<Message[]>([]);

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat-history');
    if (saved) {
      setSavedMessages(JSON.parse(saved));
    }
  }, []);

  const chat = useChat(agent, {
    initialMessages: savedMessages,
    onMessage: (message) => {
      // Save after each message
      setSavedMessages((prev) => {
        const updated = [...prev, message];
        localStorage.setItem('chat-history', JSON.stringify(updated));
        return updated;
      });
    },
  });

  // ...
}
```

## Next Steps

- [Streaming UI](./streaming-ui.md) - Real-time updates
- [Accessibility](../../packages/react/README.md#accessibility-utilities)
- [useAgentStream](./streaming-ui.md) - ReAct visualization
