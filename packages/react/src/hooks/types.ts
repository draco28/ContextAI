/**
 * Type definitions for @contextaisdk/react hooks
 */

import type { Agent, AgentResponse, ReActTrace } from '@contextaisdk/core';
import type { Message } from '../types.js';

// ===== REASONING TYPES (for useAgentStream) =====

/**
 * A step in the ReAct reasoning chain
 *
 * Used by useAgentStream to expose the agent's thought process:
 * - thought: The agent's internal reasoning
 * - action: Decision to use a tool
 * - observation: Result from tool execution
 *
 * @example
 * ```tsx
 * const { reasoning } = useAgentStream(agent);
 *
 * reasoning.map(step => {
 *   if (step.type === 'thought') {
 *     return <div className="thought">{step.content}</div>;
 *   }
 *   if (step.type === 'action') {
 *     return <div className="action">Using {step.tool}</div>;
 *   }
 *   if (step.type === 'observation') {
 *     return <div className="result">{step.content}</div>;
 *   }
 * });
 * ```
 */
export interface ReasoningStep {
  /** Type of reasoning step */
  type: 'thought' | 'action' | 'observation';
  /** Human-readable content describing this step */
  content: string;
  /** Tool name (for action/observation steps) */
  tool?: string;
  /** Tool input arguments (for action steps) */
  input?: Record<string, unknown>;
  /** Tool execution result (for observation steps) */
  result?: unknown;
  /** Whether tool execution succeeded (for observation steps) */
  success?: boolean;
  /** Timestamp when this step occurred */
  timestamp: number;
}

// ===== HOOK OPTIONS =====

/**
 * Base options shared across all agent hooks
 */
export interface UseAgentOptionsBase {
  /** Initial messages to pre-populate the conversation */
  initialMessages?: Message[];
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Options for useAgent hook
 */
export interface UseAgentOptions extends UseAgentOptionsBase {
  /** Callback when a tool is called (for debugging/logging) */
  onToolCall?: (tool: string, args: unknown) => void;
}

/**
 * Options for useChat hook
 */
export interface UseChatOptions extends UseAgentOptionsBase {
  /** Callback when response is fully complete */
  onFinish?: (response: AgentResponse) => void;
  /** Callback when streaming content updates */
  onStream?: (content: string) => void;
}

/**
 * Options for useAgentStream hook
 */
export interface UseAgentStreamOptions extends UseAgentOptionsBase {
  /** Callback when a tool is called */
  onToolCall?: (tool: string, args: unknown) => void;
  /** Callback when agent generates a thought */
  onThought?: (content: string) => void;
  /** Callback when a reasoning step occurs */
  onReasoning?: (step: ReasoningStep) => void;
}

// ===== HOOK RETURN TYPES =====

/**
 * Return type for useAgent hook (non-streaming)
 *
 * Provides the simplest interface for agent interaction:
 * send a message, get a response.
 */
export interface UseAgentReturn {
  /** All messages in the conversation */
  messages: Message[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: Error | null;
  /** Send a message to the agent */
  sendMessage: (content: string) => Promise<AgentResponse | undefined>;
  /** Clear all messages and reset state */
  clearMessages: () => void;
}

/**
 * Return type for useChat hook (primary API)
 *
 * Full-featured hook with streaming content display,
 * abort support, and external message control.
 */
export interface UseChatReturn {
  /** All messages in the conversation */
  messages: Message[];
  /** Current streaming content (partial response being built) */
  streamingContent: string;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: Error | null;
  /** Send a message to the agent */
  sendMessage: (content: string) => Promise<AgentResponse | undefined>;
  /** Clear all messages and reset state */
  clearMessages: () => void;
  /** Abort the current request */
  abort: () => void;
  /** Set messages programmatically (for external control) */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Return type for useAgentStream hook (full streaming with ReAct visibility)
 *
 * Exposes the complete ReAct reasoning chain for building
 * debugging UIs and transparent agent interactions.
 */
export interface UseAgentStreamReturn {
  /** All messages in the conversation */
  messages: Message[];
  /** Current streaming content (partial response being built) */
  streamingContent: string;
  /** ReAct reasoning steps (thought/action/observation) */
  reasoning: ReasoningStep[];
  /** Complete trace from the last response (for debugging) */
  trace: ReActTrace | null;
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: Error | null;
  /** Send a message to the agent */
  sendMessage: (content: string) => Promise<void>;
  /** Clear all messages and reset state */
  clearMessages: () => void;
  /** Abort the current request */
  abort: () => void;
}

// ===== UTILITY TYPES =====

/**
 * Agent-like interface for type flexibility
 *
 * Allows hooks to work with any object that has run/stream methods,
 * enabling easier testing and alternative implementations.
 */
export interface AgentLike {
  run: Agent['run'];
  stream: Agent['stream'];
}
