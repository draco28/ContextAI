/**
 * React hooks for @contextai/react
 *
 * @packageDocumentation
 */

// ===== HOOKS =====
export { useAgent } from './useAgent.js';
export { useChat } from './useChat.js';
export { useAgentStream } from './useAgentStream.js';

// ===== TYPES =====
export type {
  // Reasoning
  ReasoningStep,
  // Options
  UseAgentOptions,
  UseChatOptions,
  UseAgentStreamOptions,
  UseAgentOptionsBase,
  // Return types
  UseAgentReturn,
  UseChatReturn,
  UseAgentStreamReturn,
  // Utility types
  AgentLike,
} from './types.js';
