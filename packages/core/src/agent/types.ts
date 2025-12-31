import type { LLMProvider, ChatMessage } from '../provider/types';
import type { Tool } from '../tool/types';

/**
 * ReAct step: Thought
 * The agent's reasoning about what to do next
 */
export interface Thought {
  type: 'thought';
  content: string;
  timestamp: number;
}

/**
 * ReAct step: Action
 * The agent's decision to use a tool
 */
export interface Action {
  type: 'action';
  tool: string;
  input: Record<string, unknown>;
  timestamp: number;
}

/**
 * ReAct step: Observation
 * The result of executing a tool
 */
export interface Observation {
  type: 'observation';
  result: unknown;
  success: boolean;
  timestamp: number;
}

/**
 * Union type for all ReAct steps
 */
export type ReActStep = Thought | Action | Observation;

/**
 * Complete ReAct trace for debugging
 */
export interface ReActTrace {
  /** All steps in the reasoning chain */
  steps: ReActStep[];
  /** Number of ReAct iterations */
  iterations: number;
  /** Total tokens used */
  totalTokens: number;
  /** Total duration in milliseconds */
  durationMs: number;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent name for identification */
  name: string;
  /** System prompt defining agent behavior */
  systemPrompt: string;
  /** LLM provider instance */
  llm: LLMProvider;
  /** Available tools */
  tools?: Tool[];
  /** Maximum ReAct iterations (default: 10) */
  maxIterations?: number;
}

/**
 * Runtime options for agent.run()
 */
export interface AgentRunOptions {
  /** Override max iterations */
  maxIterations?: number;
  /** Additional context messages */
  context?: ChatMessage[];
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Agent response (non-streaming)
 */
export interface AgentResponse {
  /** Final output text */
  output: string;
  /** Complete reasoning trace */
  trace: ReActTrace;
  /** Whether execution was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Streaming agent response events
 */
export type StreamingAgentEvent =
  | { type: 'thought'; content: string }
  | { type: 'action'; tool: string; input: Record<string, unknown> }
  | { type: 'observation'; result: unknown; success: boolean }
  | { type: 'text'; content: string }
  | { type: 'done'; response: AgentResponse };

/**
 * Streaming agent response
 */
export type StreamingAgentResponse = AsyncGenerator<
  StreamingAgentEvent,
  void,
  unknown
>;

/**
 * Agent options (alias for AgentConfig)
 */
export type AgentOptions = AgentConfig;
