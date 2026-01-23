[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useAgentStream

# Function: useAgentStream()

> **useAgentStream**(`agent`, `options`): [`UseAgentStreamReturn`](../interfaces/UseAgentStreamReturn.md)

Defined in: [react/src/hooks/useAgentStream.ts:81](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/useAgentStream.ts#L81)

React hook for streaming agent interactions with full ReAct visibility

This hook exposes the agent's complete reasoning chain:
- Thoughts: What the agent is thinking
- Actions: Tool calls the agent decides to make
- Observations: Results from tool executions

Use this when you want to build "transparent" AI UIs that show
the agent's thought process in real-time.

## Parameters

### agent

`Agent`

The Agent instance to use for interactions

### options

[`UseAgentStreamOptions`](../interfaces/UseAgentStreamOptions.md) = `{}`

Configuration options

## Returns

[`UseAgentStreamReturn`](../interfaces/UseAgentStreamReturn.md)

Hook state and actions including reasoning steps

## Example

```tsx
import { useAgentStream } from '@contextaisdk/react';
import { Agent } from '@contextaisdk/core';

const agent = new Agent({ ... });

function TransparentChat() {
  const {
    messages,
    reasoning,
    streamingContent,
    isLoading,
    sendMessage,
    abort
  } = useAgentStream(agent, {
    onThought: (thought) => console.log('Thinking:', thought),
    onReasoning: (step) => console.log('Step:', step.type),
  });

  return (
    <div>
      {/* Show reasoning chain */}
      {isLoading && (
        <div className="reasoning">
          {reasoning.map((step, i) => (
            <div key={i} className={step.type}>
              {step.type === 'thought' && `💭 ${step.content}`}
              {step.type === 'action' && `🔧 Using ${step.tool}`}
              {step.type === 'observation' && `📝 ${step.content}`}
            </div>
          ))}
        </div>
      )}

      {/* Show messages */}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Show partial streaming output */}
      {streamingContent && (
        <div className="streaming">{streamingContent}</div>
      )}
    </div>
  );
}
```
