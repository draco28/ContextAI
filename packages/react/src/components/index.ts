/**
 * Component exports
 */
export { ChatWindow, type ChatWindowProps } from './ChatWindow.js';
export { MessageList, type MessageListProps } from './MessageList.js';
export { MessageInput, type MessageInputProps } from './MessageInput.js';

// ReasoningTrace - Agent reasoning visualization
export { ReasoningTrace, type ReasoningTraceProps } from './ReasoningTrace.js';

// Trace sub-components for advanced customization
export {
  TraceStep,
  ThoughtStep,
  ActionStep,
  ObservationStep,
  type TraceStepProps,
  type ThoughtStepProps,
  type ActionStepProps,
  type ObservationStepProps,
} from './trace/index.js';
