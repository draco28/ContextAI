/**
 * useChat - Primary hook for agent chat interactions
 *
 * @packageDocumentation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Agent, AgentResponse, AgentRunOptions } from '@contextaisdk/core';
import type { Message } from '../types.js';
import { generateMessageId } from '../types.js';
import type { UseChatOptions, UseChatReturn } from './types.js';

/**
 * React hook for chat-style agent interactions with abort support
 *
 * This is the recommended hook for most use cases. It provides:
 * - Message history management
 * - Request cancellation (abort)
 * - External message control via setMessages
 * - Streaming content placeholder (for UI compatibility)
 *
 * For full ReAct visibility with streaming, use `useAgentStream` instead.
 *
 * @param agent - The Agent instance to use for interactions
 * @param options - Configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```tsx
 * import { useChat } from '@contextaisdk/react';
 * import { Agent } from '@contextaisdk/core';
 *
 * const agent = new Agent({ ... });
 *
 * function Chat() {
 *   const {
 *     messages,
 *     isLoading,
 *     error,
 *     sendMessage,
 *     abort,
 *     clearMessages,
 *     setMessages
 *   } = useChat(agent, {
 *     onFinish: (response) => console.log('Done:', response.output),
 *     onError: (err) => console.error('Failed:', err),
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id} className={msg.role}>
 *           {msg.content}
 *         </div>
 *       ))}
 *       {isLoading && (
 *         <button onClick={abort}>Cancel</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChat(
  agent: Agent,
  options: UseChatOptions = {}
): UseChatReturn {
  const { initialMessages = [], onError, onFinish, onStream } = options;

  // ===== STATE =====
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===== REFS =====
  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== EFFECTS =====
  // Cleanup on unmount: abort any pending request
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort any in-flight request on unmount
      abortControllerRef.current?.abort();
    };
  }, []);

  // ===== CALLBACKS =====

  /**
   * Abort the current request
   *
   * Safe to call even if no request is in progress.
   * Resets loading and streaming state.
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    if (mountedRef.current) {
      setIsLoading(false);
      setStreamingContent('');
    }
  }, []);

  /**
   * Send a message to the agent
   *
   * Cancels any existing request, adds user message immediately,
   * then fetches and adds the assistant response.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<AgentResponse | undefined> => {
      // Ignore empty messages
      const trimmed = content.trim();
      if (!trimmed) return undefined;

      // Cancel any existing request
      abortControllerRef.current?.abort();
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

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
      setStreamingContent('');

      try {
        // Build run options with abort signal
        const runOptions: AgentRunOptions = {
          signal: abortControllerRef.current.signal,
        };

        // Call agent
        const response = await agent.run(trimmed, runOptions);

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

          // Notify stream callback with final content
          onStream?.(response.output);

          // Notify completion callback
          onFinish?.(response);
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

        // IMPORTANT: Don't treat AbortError as an error
        // This happens when user cancels or component unmounts
        if (err instanceof Error && err.name === 'AbortError') {
          return undefined;
        }

        // Handle actual errors
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return undefined;
      } finally {
        // Always clear loading/streaming state (if mounted)
        if (mountedRef.current) {
          setIsLoading(false);
          setStreamingContent('');
        }
      }
    },
    [agent, onError, onFinish, onStream]
  );

  /**
   * Clear all messages and reset state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  return {
    messages,
    streamingContent,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    abort,
    setMessages,
  };
}
