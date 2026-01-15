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

// Validation schemas
export {
  AgentConfigSchema,
  AgentRunOptionsSchema,
  ChatMessageSchema,
  InputStringSchema,
  LLMProviderSchema,
} from './agent';
export type { ValidatedAgentConfig, ValidatedAgentRunOptions } from './agent';

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
  // Multimodal content types
  TextContentPart,
  ImageContentPart,
  DocumentContentPart,
  ContentPart,
  MessageContent,
  // Response metadata types
  CacheInfo,
  ResponseMetadata,
  TokenUsage,
  // Structured output types
  ResponseFormat,
  // Extended thinking types
  ThinkingConfig,
  // Rate limit and model info types
  RateLimitInfo,
  ModelInfo,
} from './provider';

// Content utilities
export {
  isMultimodalContent,
  isTextContent,
  isImageContent,
  isDocumentContent,
  normalizeContent,
  extractTextContent,
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

// Security exports
export {
  // SQL Safety utilities
  isValidIdentifier,
  escapeIdentifier,
  SafeQueryBuilder,
  SQLSafetyError,
  // Path validation utilities
  PathValidator,
  validatePath,
  validatePathSync,
  PathTraversalError,
} from './security';
export type {
  WhereCondition,
  WhereOperator,
  OrderDirection,
  QueryResult,
  // Path validation types
  PathValidatorOptions,
  ValidationResult as PathValidationResult,
  BlockedReason,
} from './security';
