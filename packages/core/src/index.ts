// Agent exports
export { Agent, ReActLoop } from './agent';

// Trace formatting utilities
export { formatTrace, formatTraceJSON, getTraceStats } from './agent';
export type { TraceFormatOptions, TraceStats } from './agent';

// Core types
export type {
  AgentConfig,
  AgentOptions,
  AgentResponse,
  AgentRunOptions,
  StreamingAgentResponse,
  StreamingAgentEvent,
  ReActStep,
  ReActTrace,
  Thought,
  Action,
  Observation,
} from './agent';

// Event callback types
export type {
  ThoughtEvent,
  ActionEvent,
  ObservationEvent,
  ToolCallEvent,
  ReActEvent,
  OnThoughtCallback,
  OnActionCallback,
  OnObservationCallback,
  OnToolCallCallback,
  ReActEventCallbacks,
  StreamEvent,
} from './agent';

// Logger types and utilities
export type { Logger, LogLevel } from './agent';
export { noopLogger, consoleLogger } from './agent';

// Tool exports
export { defineTool } from './tool';
export type { Tool, ToolConfig, ToolExecuteContext, ToolResult } from './tool';

// Provider exports
export type {
  LLMProvider,
  LLMProviderConfig,
  ChatMessage,
  ChatResponse,
  StreamChunk,
  GenerateOptions,
  MessageRole,
  ToolCall,
  ToolDefinition,
} from './provider';

// Error exports
export {
  ContextAIError,
  AgentError,
  ToolError,
  ToolTimeoutError,
  ToolOutputValidationError,
  ProviderError,
  ValidationError,
} from './errors';
