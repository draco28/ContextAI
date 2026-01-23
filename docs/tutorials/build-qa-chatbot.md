# Tutorial: Build a Q&A Chatbot

Build a complete question-answering chatbot from scratch with streaming UI.

**Time**: 30 minutes
**Difficulty**: Beginner
**You'll learn**: Agent setup, tools, streaming, React UI

## What We're Building

A chatbot that:
- Answers questions about your documentation
- Uses tools to search a knowledge base
- Streams responses in real-time
- Shows a beautiful chat interface

## Prerequisites

```bash
# Create project
mkdir qa-chatbot && cd qa-chatbot
pnpm init -y

# Install dependencies
pnpm add @contextaisdk/core @contextaisdk/react @contextaisdk/provider-openai zod react react-dom
pnpm add -D typescript @types/react @types/react-dom vite
```

## Step 1: Set Up the Provider

Create `src/agent.ts`:

```typescript
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { Agent, defineTool } from '@contextaisdk/core';
import { z } from 'zod';

// Create the LLM provider
export const provider = new OpenAIProvider({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: 'gpt-4o-mini',
});
```

## Step 2: Create a Knowledge Base Tool

Still in `src/agent.ts`, add a search tool:

```typescript
// Simulated knowledge base (replace with real data)
const knowledgeBase = [
  {
    topic: 'installation',
    content: 'To install ContextAI, run: pnpm add @contextaisdk/core',
  },
  {
    topic: 'agents',
    content: 'Agents use the ReAct pattern: Thought, Action, Observation.',
  },
  {
    topic: 'tools',
    content: 'Tools are defined with Zod schemas for type-safe parameters.',
  },
  {
    topic: 'streaming',
    content: 'Use agent.stream() for real-time responses in your UI.',
  },
];

const searchKnowledge = defineTool({
  name: 'search_knowledge',
  description: 'Search the knowledge base for information about ContextAI SDK',
  parameters: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    // Simple keyword matching (use RAG in production)
    const results = knowledgeBase.filter(
      (item) =>
        item.topic.includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      return { found: false, message: 'No relevant information found.' };
    }

    return {
      found: true,
      results: results.map((r) => r.content),
    };
  },
});
```

## Step 3: Create the Agent

Complete `src/agent.ts`:

```typescript
export const chatAgent = new Agent({
  name: 'Q&A Assistant',
  systemPrompt: `You are a helpful Q&A assistant for the ContextAI SDK.

Guidelines:
- Use search_knowledge to find information before answering
- Be concise and accurate
- If you can't find information, say so honestly
- Provide code examples when helpful`,
  llm: provider,
  tools: [searchKnowledge],
});
```

## Step 4: Build the Chat UI

Create `src/Chat.tsx`:

```tsx
import { useChat } from '@contextaisdk/react';
import { chatAgent } from './agent';
import { useState, useRef, useEffect } from 'react';

export function Chat() {
  const {
    messages,
    streamingContent,
    isLoading,
    error,
    sendMessage,
    abort,
  } = useChat(chatAgent);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <header>
        <h1>Q&A Chatbot</h1>
        <p>Ask me anything about ContextAI SDK</p>
      </header>

      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="content">{message.content}</div>
          </div>
        ))}

        {streamingContent && (
          <div className="message assistant">
            <div className="avatar">🤖</div>
            <div className="content">
              {streamingContent}
              <span className="cursor">▋</span>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="message assistant">
            <div className="avatar">🤖</div>
            <div className="content loading">Thinking...</div>
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
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
      </form>
    </div>
  );
}
```

## Step 5: Add Styles

Create `src/styles.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: white;
}

header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  text-align: center;
}

header h1 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

header p {
  color: #666;
  font-size: 0.9rem;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 70%;
  line-height: 1.5;
}

.message.user .content {
  background: #007bff;
  color: white;
}

.message.assistant .content {
  background: #f0f0f0;
}

.loading {
  color: #666;
  font-style: italic;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.error {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.input-form {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.input-form input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.input-form button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #007bff;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

.input-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Step 6: Create the App Entry

Create `src/App.tsx`:

```tsx
import { Chat } from './Chat';
import './styles.css';

export default function App() {
  return <Chat />;
}
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Step 7: Configure the Project

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Q&A Chatbot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `.env`:

```bash
VITE_OPENAI_API_KEY=sk-your-key-here
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## Step 8: Run It!

```bash
npx vite
```

Open http://localhost:5173 and try asking:
- "How do I install ContextAI?"
- "What is the ReAct pattern?"
- "How do I stream responses?"

## Enhancements

### Add Conversation History

```typescript
const { messages, sendMessage } = useChat(chatAgent, {
  initialMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I can answer questions about ContextAI. What would you like to know?',
    },
  ],
});
```

### Show Tool Usage

```tsx
import { useAgentStream } from '@contextaisdk/react';

const { reasoningSteps } = useAgentStream(chatAgent);

// Show when tool is called
{reasoningSteps.map((step, i) => (
  step.type === 'action' && (
    <div key={i} className="tool-usage">
      🔧 Searching: {step.input.query}
    </div>
  )
))}
```

### Add Local Storage Persistence

```typescript
useEffect(() => {
  localStorage.setItem('chat-history', JSON.stringify(messages));
}, [messages]);

const chat = useChat(chatAgent, {
  initialMessages: JSON.parse(localStorage.getItem('chat-history') || '[]'),
});
```

## Complete Source Code

```
qa-chatbot/
├── src/
│   ├── agent.ts      # Agent and tools
│   ├── Chat.tsx      # Chat component
│   ├── App.tsx       # App entry
│   ├── main.tsx      # React entry
│   └── styles.css    # Styles
├── index.html
├── tsconfig.json
├── package.json
└── .env
```

## Next Steps

- [Document Assistant](./document-assistant.md) - Add RAG
- [Code Assistant](./code-assistant.md) - Code Q&A
- [Streaming UI](../how-to/react/streaming-ui.md) - Advanced streaming
