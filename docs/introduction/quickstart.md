# Quickstart

Build your first AI agent in 5 minutes.

## Prerequisites

- Node.js 18+
- An OpenAI API key (or Anthropic/Ollama)

## Step 1: Create a Project

```bash
mkdir my-agent && cd my-agent
npm init -y
npm install @contextaisdk/core @contextaisdk/provider-openai zod typescript tsx
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Step 2: Create Your First Agent

Create `agent.ts`:

```typescript
import { Agent } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';

// 1. Create an LLM provider
const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini', // Fast and cheap for testing
});

// 2. Create the agent
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant. Be concise.',
  llm,
});

// 3. Run the agent
const response = await agent.run('What is TypeScript?');

console.log('Response:', response.output);
console.log('Success:', response.success);
```

Run it:

```bash
OPENAI_API_KEY=sk-... npx tsx agent.ts
```

## Step 3: Add a Tool

Tools let your agent take actions. Create `agent-with-tool.ts`:

```typescript
import { Agent, defineTool } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { z } from 'zod';

const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

// Define a calculator tool with Zod schema
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform mathematical calculations. Use this for any math.',
  parameters: z.object({
    expression: z.string().describe('Math expression like "2 + 2" or "sqrt(16)"'),
  }),
  execute: async ({ expression }, context) => {
    try {
      // Simple eval for demo (use a math library in production)
      const result = Function(`"use strict"; return (${expression})`)();
      return { success: true, data: { result, expression } };
    } catch {
      return { success: false, error: 'Invalid expression' };
    }
  },
});

const agent = new Agent({
  name: 'Math Assistant',
  systemPrompt: 'You help with math. Use the calculator tool for calculations.',
  llm,
  tools: [calculatorTool],
});

const response = await agent.run('What is 15% of 250?');

console.log('Response:', response.output);

// See the agent's reasoning
console.log('\nReasoning trace:');
for (const step of response.trace.steps) {
  console.log(`  ${step.type}: ${JSON.stringify(step.content || step.tool)}`);
}
```

Run it:

```bash
OPENAI_API_KEY=sk-... npx tsx agent-with-tool.ts
```

Output:

```
Response: 15% of 250 is 37.5

Reasoning trace:
  thought: "I need to calculate 15% of 250"
  action: "calculator"
  observation: {"result":37.5,"expression":"250 * 0.15"}
  thought: "I have the answer"
```

## Step 4: Stream Responses

For real-time responses, create `streaming-agent.ts`:

```typescript
import { Agent, defineTool } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { z } from 'zod';

const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

const agent = new Agent({
  name: 'Storyteller',
  systemPrompt: 'You are a creative storyteller. Write engaging short stories.',
  llm,
});

// Stream the response
console.log('Story:\n');

for await (const event of agent.stream('Write a 3-sentence story about a robot.')) {
  switch (event.type) {
    case 'thought':
      console.log(`[Thinking: ${event.content}]`);
      break;
    case 'text':
      process.stdout.write(event.content);
      break;
    case 'done':
      console.log('\n\n[Done]');
      break;
  }
}
```

Run it:

```bash
OPENAI_API_KEY=sk-... npx tsx streaming-agent.ts
```

## Step 5: Add Memory (Multi-turn)

For conversations that remember context, create `chat-agent.ts`:

```typescript
import { Agent } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import * as readline from 'readline';

const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

const agent = new Agent({
  name: 'Chat Assistant',
  systemPrompt: 'You are a friendly chat assistant. Remember what the user tells you.',
  llm,
  // Enable built-in memory
  memory: true,
  sessionId: 'my-session', // Identifies this conversation
});

// Simple CLI chat loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Chat with the agent (type "exit" to quit)\n');

const chat = async () => {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const response = await agent.run(input);
    console.log(`Assistant: ${response.output}\n`);
    chat();
  });
};

chat();
```

Run it:

```bash
OPENAI_API_KEY=sk-... npx tsx chat-agent.ts
```

Try:
```
You: My name is Alice
Assistant: Nice to meet you, Alice!

You: What's my name?
Assistant: Your name is Alice.
```

## Complete Example

Here's a full example combining everything:

```typescript
// complete-agent.ts
import { Agent, defineTool, createSafeLogger, consoleLogger } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { z } from 'zod';

// Provider
const llm = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

// Safe logger (auto-redacts secrets from logs)
const logger = createSafeLogger(consoleLogger);

// Tools
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('City name'),
  }),
  execute: async ({ city }, context) => {
    // Mock weather data
    const weather: Record<string, { temp: number; condition: string }> = {
      'New York': { temp: 72, condition: 'Sunny' },
      'London': { temp: 55, condition: 'Cloudy' },
      'Tokyo': { temp: 68, condition: 'Clear' },
    };
    const data = weather[city] || { temp: 70, condition: 'Unknown' };
    return { success: true, data };
  },
});

const timeTool = defineTool({
  name: 'get_time',
  description: 'Get current time in a timezone',
  parameters: z.object({
    timezone: z.string().describe('Timezone like "America/New_York"'),
  }),
  execute: async ({ timezone }, context) => {
    const time = new Date().toLocaleString('en-US', { timeZone: timezone });
    return { success: true, data: { time, timezone } };
  },
});

// Agent
const agent = new Agent({
  name: 'Travel Assistant',
  systemPrompt: `You help users plan travel. You can check weather and time.
    Always be helpful and suggest activities based on weather.`,
  llm,
  tools: [weatherTool, timeTool],
  memory: true,
  logger, // Safe logging enabled
});

// Run
const response = await agent.run(
  "I'm planning a trip to Tokyo. What's the weather like and what time is it there?"
);

console.log('Assistant:', response.output);

// Show trace
console.log('\n--- Agent Trace ---');
for (const step of response.trace.steps) {
  if (step.type === 'thought') {
    console.log(`Thought: ${step.content}`);
  } else if (step.type === 'action') {
    console.log(`Action: ${step.tool}(${JSON.stringify(step.input)})`);
  } else if (step.type === 'observation') {
    console.log(`Observation: ${JSON.stringify(step.content)}`);
  }
}

console.log(`\nTotal tokens: ${response.trace.totalTokens}`);
console.log(`Duration: ${response.trace.durationMs}ms`);
```

## Next Steps

Now that you have a working agent:

1. **Add RAG** - [Build a RAG Pipeline](../how-to/rag/build-rag-pipeline.md)
2. **Build a UI** - [Chat Interface with React](../how-to/react/chat-interface.md)
3. **Secure Logs** - [Secure Logging Guide](../how-to/agents/secure-logging.md)
4. **Go Local** - [Use Ollama](../integrations/providers/ollama.md)
5. **Learn More** - [Agent Architecture](../concepts/agents.md)

## Troubleshooting

### "OPENAI_API_KEY is not defined"

Set your API key:

```bash
export OPENAI_API_KEY=sk-...
```

### "Tool execution failed"

Check your tool's `execute` function returns proper `ToolResult` format:

```typescript
execute: async (input, context) => {
  try {
    const result = doSomething(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
},
```

### "Agent is looping"

Add `maxIterations` to limit loops:

```typescript
const agent = new Agent({
  // ...
  maxIterations: 5, // Stop after 5 tool calls
});
```
