/**
 * @contextai/react - React Components for ContextAI Agent SDK
 *
 * Headless UI components for building AI chat interfaces.
 *
 * @packageDocumentation
 */

export const VERSION = '0.0.1';

// Components
export { ChatWindow, type ChatWindowProps } from './components/ChatWindow.js';
export { MessageList, type MessageListProps } from './components/MessageList.js';
export { MessageInput, type MessageInputProps } from './components/MessageInput.js';

// ReasoningTrace - Agent reasoning visualization
export { ReasoningTrace, type ReasoningTraceProps } from './components/ReasoningTrace.js';
export {
  TraceStep,
  ThoughtStep,
  ActionStep,
  ObservationStep,
  type TraceStepProps,
  type ThoughtStepProps,
  type ActionStepProps,
  type ObservationStepProps,
} from './components/trace/index.js';

// Types
export type { Message, MessageRole } from './types.js';
export { generateMessageId } from './types.js';

// Hooks
export { useAgent, useChat, useAgentStream } from './hooks/index.js';
export type {
  // Reasoning
  ReasoningStep,
  // Options
  UseAgentOptions,
  UseChatOptions,
  UseAgentStreamOptions,
  // Return types
  UseAgentReturn,
  UseChatReturn,
  UseAgentStreamReturn,
} from './hooks/index.js';
