/**
 * Chat message role
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

/**
 * Tool call request from LLM
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * LLM response structure
 */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Streaming chunk from LLM
 */
export interface StreamChunk {
  type: 'text' | 'tool_call' | 'usage' | 'done';
  content?: string;
  toolCall?: Partial<ToolCall>;
  usage?: ChatResponse['usage'];
}

/**
 * Options for generate/chat calls
 */
export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  tools?: ToolDefinition[];
}

/**
 * Tool definition for LLM (JSON Schema format)
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * LLM Provider configuration
 */
export interface LLMProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model: string;
  defaultOptions?: Partial<GenerateOptions>;
}

/**
 * LLM Provider interface - implement this for each provider
 *
 * @example
 * ```typescript
 * class OpenAIProvider implements LLMProvider {
 *   readonly name = 'openai';
 *   readonly model: string;
 *
 *   constructor(config: LLMProviderConfig) {
 *     this.model = config.model;
 *   }
 *
 *   async chat(messages, options) {
 *     // Implementation
 *   }
 *
 *   async *streamChat(messages, options) {
 *     // Implementation
 *   }
 *
 *   async isAvailable() {
 *     return true;
 *   }
 * }
 * ```
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /**
   * Generate a chat completion
   */
  chat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<ChatResponse>;

  /**
   * Stream a chat completion
   */
  streamChat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Check if provider is configured and available
   */
  isAvailable(): Promise<boolean>;
}
