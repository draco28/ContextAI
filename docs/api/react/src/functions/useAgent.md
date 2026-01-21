[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useAgent

# Function: useAgent()

> **useAgent**(`agent`, `options`): [`UseAgentReturn`](../interfaces/UseAgentReturn.md)

Defined in: [react/src/hooks/useAgent.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/useAgent.ts#L48)

React hook for simple agent interactions (non-streaming)

This is the simplest hook for agent interaction. It sends a message
and waits for the complete response. For streaming or ReAct visibility,
use `useChat` or `useAgentStream` instead.

## Parameters

### agent

`Agent`

The Agent instance to use for interactions

### options

[`UseAgentOptions`](../interfaces/UseAgentOptions.md) = `{}`

Configuration options

## Returns

[`UseAgentReturn`](../interfaces/UseAgentReturn.md)

Hook state and actions

## Example

```tsx
import { useAgent } from '@contextai/react';
import { Agent } from '@contextai/core';

const agent = new Agent({ ... });

function Chat() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAgent(agent);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <button onClick={() => sendMessage('Hello!')}>Send</button>
      <button onClick={clearMessages}>Clear</button>
    </div>
  );
}
```
