/**
 * useAgent - Simple non-streaming hook for agent interaction
 *
 * @packageDocumentation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Agent, AgentResponse } from '@contextai/core';
import type { Message } from '../types.js';
import { generateMessageId } from '../types.js';
import type { UseAgentOptions, UseAgentReturn } from './types.js';

/**
 * React hook for simple agent interactions (non-streaming)
 *
 * This is the simplest hook for agent interaction. It sends a message
 * and waits for the complete response. For streaming or ReAct visibility,
 * use `useChat` or `useAgentStream` instead.
 *
 * @param agent - The Agent instance to use for interactions
 * @param options - Configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```tsx
 * import { useAgent } from '@contextai/react';
 * import { Agent } from '@contextai/core';
 *
 * const agent = new Agent({ ... });
 *
 * function Chat() {
 *   const { messages, isLoading, error, sendMessage, clearMessages } = useAgent(agent);
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       {isLoading && <div>Loading...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       <button onClick={() => sendMessage('Hello!')}>Send</button>
 *       <button onClick={clearMessages}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgent(
  agent: Agent,
  options: UseAgentOptions = {}
): UseAgentReturn {
  const { initialMessages = [], onError, onToolCall } = options;

  // ===== STATE =====
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===== REFS =====
  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  // ===== EFFECTS =====
  // Track mount/unmount for safe state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ===== CALLBACKS =====

  /**
   * Send a message to the agent
   *
   * Adds the user message immediately (optimistic UI),
   * then fetches the response and adds the assistant message.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<AgentResponse | undefined> => {
      // Ignore empty messages
      const trimmed = content.trim();
      if (!trimmed) return undefined;

      // Create user message with unique ID
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: trimmed,
      };

      // Optimistic UI: add user message immediately
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Call agent with optional tool callback
        const response = await agent.run(trimmed, {
          callbacks: onToolCall
            ? {
                onToolCall: event => {
                  onToolCall(event.tool, event.input);
                },
              }
            : undefined,
        });

        // Check if still mounted before updating state
        if (!mountedRef.current) return undefined;

        if (response.success) {
          // Add assistant message
          const assistantMessage: Message = {
            id: generateMessageId(),
            role: 'assistant',
            content: response.output,
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Agent returned an error
          const err = new Error(response.error || 'Agent execution failed');
          setError(err);
          onError?.(err);
        }

        return response;
      } catch (err) {
        // Check if still mounted before updating state
        if (!mountedRef.current) return undefined;

        // Handle thrown errors
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return undefined;
      } finally {
        // Always clear loading state (if mounted)
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [agent, onError, onToolCall]
  );

  /**
   * Clear all messages and reset error state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
