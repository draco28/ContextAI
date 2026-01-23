[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useChat

# Function: useChat()

> **useChat**(`agent`, `options`): [`UseChatReturn`](../interfaces/UseChatReturn.md)

Defined in: [react/src/hooks/useChat.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/useChat.ts#L64)

React hook for chat-style agent interactions with abort support

This is the recommended hook for most use cases. It provides:
- Message history management
- Request cancellation (abort)
- External message control via setMessages
- Streaming content placeholder (for UI compatibility)

For full ReAct visibility with streaming, use `useAgentStream` instead.

## Parameters

### agent

`Agent`

The Agent instance to use for interactions

### options

[`UseChatOptions`](../interfaces/UseChatOptions.md) = `{}`

Configuration options

## Returns

[`UseChatReturn`](../interfaces/UseChatReturn.md)

Hook state and actions

## Example

```tsx
import { useChat } from '@contextaisdk/react';
import { Agent } from '@contextaisdk/core';

const agent = new Agent({ ... });

function Chat() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    abort,
    clearMessages,
    setMessages
  } = useChat(agent, {
    onFinish: (response) => console.log('Done:', response.output),
    onError: (err) => console.error('Failed:', err),
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}
      {isLoading && (
        <button onClick={abort}>Cancel</button>
      )}
    </div>
  );
}
```
