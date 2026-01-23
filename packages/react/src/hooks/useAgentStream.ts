/**
 * useAgentStream - Full streaming hook with ReAct visibility
 *
 * @packageDocumentation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Agent, AgentRunOptions, ReActTrace } from '@contextaisdk/core';
import type { Message } from '../types.js';
import { generateMessageId } from '../types.js';
import type {
  UseAgentStreamOptions,
  UseAgentStreamReturn,
  ReasoningStep,
} from './types.js';

/**
 * React hook for streaming agent interactions with full ReAct visibility
 *
 * This hook exposes the agent's complete reasoning chain:
 * - Thoughts: What the agent is thinking
 * - Actions: Tool calls the agent decides to make
 * - Observations: Results from tool executions
 *
 * Use this when you want to build "transparent" AI UIs that show
 * the agent's thought process in real-time.
 *
 * @param agent - The Agent instance to use for interactions
 * @param options - Configuration options
 * @returns Hook state and actions including reasoning steps
 *
 * @example
 * ```tsx
 * import { useAgentStream } from '@contextaisdk/react';
 * import { Agent } from '@contextaisdk/core';
 *
 * const agent = new Agent({ ... });
 *
 * function TransparentChat() {
 *   const {
 *     messages,
 *     reasoning,
 *     streamingContent,
 *     isLoading,
 *     sendMessage,
 *     abort
 *   } = useAgentStream(agent, {
 *     onThought: (thought) => console.log('Thinking:', thought),
 *     onReasoning: (step) => console.log('Step:', step.type),
 *   });
 *
 *   return (
 *     <div>
 *       {/* Show reasoning chain *\/}
 *       {isLoading && (
 *         <div className="reasoning">
 *           {reasoning.map((step, i) => (
 *             <div key={i} className={step.type}>
 *               {step.type === 'thought' && `💭 ${step.content}`}
 *               {step.type === 'action' && `🔧 Using ${step.tool}`}
 *               {step.type === 'observation' && `📝 ${step.content}`}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *
 *       {/* Show messages *\/}
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *
 *       {/* Show partial streaming output *\/}
 *       {streamingContent && (
 *         <div className="streaming">{streamingContent}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentStream(
  agent: Agent,
  options: UseAgentStreamOptions = {}
): UseAgentStreamReturn {
  const { initialMessages = [], onError, onToolCall, onThought, onReasoning } =
    options;

  // ===== STATE =====
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState('');
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [trace, setTrace] = useState<ReActTrace | null>(null);
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
   * Abort the current streaming request
   *
   * Safe to call even if no request is in progress.
   * Resets loading, streaming, and reasoning state.
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    if (mountedRef.current) {
      setIsLoading(false);
      setStreamingContent('');
    }
  }, []);

  /**
   * Send a message and stream the response
   *
   * Processes streaming events in real-time:
   * - thought: Agent's reasoning (added to reasoning array)
   * - action: Tool call decision (added to reasoning array)
   * - observation: Tool result (added to reasoning array)
   * - text: Final output text (updates streamingContent)
   * - done: Complete response (adds assistant message)
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      // Ignore empty messages
      const trimmed = content.trim();
      if (!trimmed) return;

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

      // Reset state for new request
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      setStreamingContent('');
      setReasoning([]);
      setTrace(null);

      try {
        // Build run options with abort signal
        const runOptions: AgentRunOptions = {
          signal: abortControllerRef.current.signal,
        };

        // Stream agent response
        for await (const event of agent.stream(trimmed, runOptions)) {
          // Check if still mounted after each event
          if (!mountedRef.current) return;

          switch (event.type) {
            case 'thought': {
              // Agent is reasoning
              const step: ReasoningStep = {
                type: 'thought',
                content: event.content,
                timestamp: Date.now(),
              };
              setReasoning(prev => [...prev, step]);
              onThought?.(event.content);
              onReasoning?.(step);
              break;
            }

            case 'action': {
              // Agent decided to use a tool
              const step: ReasoningStep = {
                type: 'action',
                content: `Using tool: ${event.tool}`,
                tool: event.tool,
                input: event.input,
                timestamp: Date.now(),
              };
              setReasoning(prev => [...prev, step]);
              onToolCall?.(event.tool, event.input);
              onReasoning?.(step);
              break;
            }

            case 'observation': {
              // Tool execution completed
              const resultStr =
                typeof event.result === 'string'
                  ? event.result
                  : JSON.stringify(event.result);
              const step: ReasoningStep = {
                type: 'observation',
                content: event.success
                  ? `Result: ${resultStr.slice(0, 100)}${resultStr.length > 100 ? '...' : ''}`
                  : `Error: ${resultStr}`,
                result: event.result,
                success: event.success,
                timestamp: Date.now(),
              };
              setReasoning(prev => [...prev, step]);
              onReasoning?.(step);
              break;
            }

            case 'text': {
              // Final output text (may arrive in chunks, but we get full text)
              setStreamingContent(event.content);
              break;
            }

            case 'done': {
              // Streaming complete
              const { response } = event;

              if (response.success) {
                // Add assistant message
                const assistantMessage: Message = {
                  id: generateMessageId(),
                  role: 'assistant',
                  content: response.output,
                };
                setMessages(prev => [...prev, assistantMessage]);
                setTrace(response.trace);
              } else {
                // Agent returned an error
                const err = new Error(
                  response.error || 'Agent execution failed'
                );
                setError(err);
                onError?.(err);
              }
              break;
            }
          }
        }
      } catch (err) {
        // Check if still mounted before updating state
        if (!mountedRef.current) return;

        // IMPORTANT: Don't treat AbortError as an error
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Handle actual errors
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        // Always clear loading/streaming state (if mounted)
        if (mountedRef.current) {
          setIsLoading(false);
          setStreamingContent('');
        }
      }
    },
    [agent, onError, onToolCall, onThought, onReasoning]
  );

  /**
   * Clear all messages, reasoning, and reset state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
    setReasoning([]);
    setTrace(null);
  }, []);

  return {
    messages,
    streamingContent,
    reasoning,
    trace,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    abort,
  };
}
