# @contextaisdk/react

> Headless React components and hooks for building AI chat interfaces

[![npm version](https://img.shields.io/npm/v/@contextaisdk/react.svg?style=flat-square)](https://www.npmjs.com/package/@contextaisdk/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @contextaisdk/react @contextaisdk/core
# or
pnpm add @contextaisdk/react @contextaisdk/core
```

**Peer Dependencies:**
- React 18+
- @contextaisdk/core

## Overview

`@contextaisdk/react` provides headless UI components and React hooks for building AI chat interfaces. All components are unstyled by default, giving you complete control over styling.

```
┌─────────────────────────────────────────┐
│                 Hooks                    │
│  useChat  useAgent  useAgentStream      │
├─────────────────────────────────────────┤
│              Components                  │
│  ChatWindow  MessageList  MessageInput   │
│           ReasoningTrace                 │
├─────────────────────────────────────────┤
│        Accessibility Utilities           │
│  Focus Traps  Announcer  Keyboard Nav   │
└─────────────────────────────────────────┘
```

## Quick Start

```tsx
import { ChatWindow, useChat } from '@contextaisdk/react';
import { Agent } from '@contextaisdk/core';

// Assuming you have an agent configured
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: yourLLMProvider,
});

function ChatApp() {
  const {
    messages,
    streamingContent,
    isLoading,
    error,
    sendMessage,
  } = useChat(agent);

  return (
    <ChatWindow
      messages={messages}
      streamingContent={streamingContent}
      isLoading={isLoading}
      error={error}
      onSend={sendMessage}
    />
  );
}
```

## Hooks

### useChat

The primary hook for chat-based interactions.

```tsx
import { useChat } from '@contextaisdk/react';

function MyChat() {
  const {
    messages,         // Message[] - conversation history
    streamingContent, // string | null - current streaming response
    isLoading,        // boolean - request in progress
    error,            // Error | null - last error
    sendMessage,      // (content: string) => Promise<void>
    clearMessages,    // () => void
    abort,            // () => void - cancel current request
    setMessages,      // (messages: Message[]) => void
  } = useChat(agent, {
    onMessage: (msg) => console.log('New message:', msg),
    onError: (err) => console.error('Error:', err),
    onComplete: () => console.log('Response complete'),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      sendMessage(input);
    }}>
      {/* Your UI */}
    </form>
  );
}
```

### useAgent

Lower-level hook for direct agent interaction.

```tsx
import { useAgent } from '@contextaisdk/react';

function MyAgent() {
  const {
    messages,
    isLoading,
    error,
    run,    // (input: string, options?) => Promise<AgentResponse>
    stream, // (input: string, options?) => AsyncIterable<StreamEvent>
    abort,
  } = useAgent(agent);

  const handleRun = async () => {
    const response = await run('What is TypeScript?');
    console.log(response.output);
    console.log(response.trace); // ReAct trace
  };
}
```

### useAgentStream

Hook for streaming agent responses with ReAct reasoning events.

```tsx
import { useAgentStream } from '@contextaisdk/react';

function MyStreamingAgent() {
  const {
    messages,
    streamingContent,
    reasoningSteps,   // ReasoningStep[] - thought/action/observation
    isLoading,
    stream,
    abort,
  } = useAgentStream(agent);

  return (
    <div>
      {/* Show reasoning in real-time */}
      {reasoningSteps.map((step, i) => (
        <div key={i}>
          {step.type}: {step.content}
        </div>
      ))}
    </div>
  );
}
```

## Components

### ChatWindow

Complete chat interface with message list and input.

```tsx
import { ChatWindow } from '@contextaisdk/react';

<ChatWindow
  messages={messages}
  streamingContent={streamingContent}
  isLoading={isLoading}
  error={error}
  onSend={sendMessage}
  // Custom rendering
  renderMessages={(messages) => <CustomMessageList messages={messages} />}
  renderInput={(props) => <CustomInput {...props} />}
/>
```

### MessageList

Renders a list of messages.

```tsx
import { MessageList } from '@contextaisdk/react';

<MessageList
  messages={messages}
  streamingContent={streamingContent}
  // Optional custom message renderer
  renderMessage={(message, index) => (
    <div key={message.id} className={message.role}>
      {message.content}
    </div>
  )}
/>
```

### MessageInput

Input field for sending messages.

```tsx
import { MessageInput } from '@contextaisdk/react';

<MessageInput
  onSubmit={sendMessage}
  isDisabled={isLoading}
  placeholder="Type a message..."
/>
```

### ReasoningTrace

Visualize agent's ReAct reasoning process.

```tsx
import { ReasoningTrace, ThoughtStep, ActionStep, ObservationStep } from '@contextaisdk/react';

// Using the compound component
<ReasoningTrace trace={response.trace}>
  <ThoughtStep />
  <ActionStep />
  <ObservationStep />
</ReasoningTrace>

// Or with custom rendering
<ReasoningTrace
  trace={response.trace}
  renderStep={(step, index) => (
    <div key={index} className={`step-${step.type}`}>
      {step.content}
    </div>
  )}
/>
```

## Accessibility Utilities

### Focus Management

```tsx
import { useFocusTrap, useFocusReturn, useAutoFocus } from '@contextaisdk/react';

function Modal({ isOpen, onClose }) {
  // Trap focus within modal
  const trapRef = useFocusTrap(isOpen);

  // Return focus when modal closes
  useFocusReturn(isOpen);

  return (
    <div ref={trapRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}

function AutoFocusInput() {
  // Auto-focus on mount
  const inputRef = useAutoFocus();
  return <input ref={inputRef} />;
}
```

### Screen Reader Announcements

```tsx
import { useAnnouncer, announceToScreenReader } from '@contextaisdk/react';

function ChatMessages() {
  const { announce } = useAnnouncer();

  // Announce new messages to screen readers
  useEffect(() => {
    if (newMessage) {
      announce(`New message from ${newMessage.role}: ${newMessage.content}`);
    }
  }, [newMessage]);
}

// Or use the imperative function
announceToScreenReader('Message sent', 'polite');
```

### Keyboard Navigation Helpers

```tsx
import { isActivationKey, A11Y_KEYS, getExpandableAriaProps } from '@contextaisdk/react';

function ExpandableSection({ isExpanded, onToggle }) {
  const handleKeyDown = (e) => {
    if (isActivationKey(e)) {
      onToggle();
    }
  };

  return (
    <button
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      {...getExpandableAriaProps(isExpanded, 'section-content')}
    >
      Toggle Section
    </button>
  );
}
```

### Utility Functions

```tsx
import { srOnlyStyles, generateA11yId } from '@contextaisdk/react';

// Screen-reader only content (visually hidden)
<span style={srOnlyStyles}>
  Loading, please wait
</span>

// Generate unique IDs for ARIA relationships
const headingId = generateA11yId('heading');
const contentId = generateA11yId('content');
```

## Types

```typescript
// Message in conversation
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ReAct reasoning step
interface ReasoningStep {
  type: 'thought' | 'action' | 'observation';
  content: string;
  toolName?: string;  // For action steps
  toolInput?: unknown;
  toolOutput?: unknown; // For observation steps
}

// Hook options
interface UseChatOptions {
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  initialMessages?: Message[];
}
```

## Styling

Components are unstyled by default. Apply your own styles:

```tsx
// With CSS classes
<ChatWindow className="my-chat-window" />

// With inline styles
<MessageList style={{ maxHeight: '500px', overflow: 'auto' }} />

// With CSS-in-JS
const StyledChatWindow = styled(ChatWindow)`
  border: 1px solid #ccc;
  border-radius: 8px;
`;
```

## Browser Support

This package supports modern browsers as specified in NFR-502:

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome  | 120+            | Supported |
| Firefox | 121+            | Supported |
| Safari  | 17+             | Supported |
| Edge    | 120+            | Supported |

**Note:** These versions correspond to "last 2 versions" as of 2024. The `browserslist` config in `package.json` automatically tracks this.

### Browser API Requirements

Components require the following browser APIs:
- `window.requestAnimationFrame` - For focus management
- `localStorage` / `sessionStorage` - Optional, for persistence
- `AbortController` - For request cancellation
- `CustomEvent` - For component communication

### Node.js APIs

This package is browser-only and does **not** use Node.js-specific APIs like:
- `fs`, `path`, `crypto`, `child_process`
- `process.env`, `Buffer`, `__dirname`

Bundle analysis tests verify no Node.js APIs leak into the browser build.

## WCAG 2.1 AA Compliance

This package follows WCAG 2.1 AA accessibility guidelines:

- **Keyboard Navigation** - All interactive elements are keyboard accessible
- **Focus Management** - Proper focus trapping and return in modals
- **Screen Reader Support** - Semantic HTML and ARIA attributes
- **Live Regions** - Announcements for dynamic content updates
- **Color Contrast** - Components don't enforce colors (you control styling)

## Error Handling

```tsx
function ChatWithErrorHandling() {
  const { error, sendMessage } = useChat(agent, {
    onError: (err) => {
      // Handle errors
      console.error('Chat error:', err);
    },
  });

  if (error) {
    return (
      <div role="alert">
        Error: {error.message}
        <button onClick={() => sendMessage('Retry')}>Retry</button>
      </div>
    );
  }

  // Normal rendering
}
```

## License

MIT
