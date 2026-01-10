/**
 * Chat message role
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Text content part for multimodal messages
 */
export interface TextContentPart {
  type: 'text';
  text: string;
}

/**
 * Image content part for vision models
 */
export interface ImageContentPart {
  type: 'image';
  /** URL of the image (for remote images) */
  url?: string;
  /** Base64-encoded image data (for inline images) */
  base64?: string;
  /** MIME type (e.g., 'image/png', 'image/jpeg') */
  mediaType?: string;
  /** Detail level for vision models */
  detail?: 'auto' | 'low' | 'high';
}

/**
 * Document content part for file inputs (e.g., PDFs)
 */
export interface DocumentContentPart {
  type: 'document';
  /** URL of the document */
  url?: string;
  /** Base64-encoded document data */
  base64?: string;
  /** MIME type (e.g., 'application/pdf') */
  mediaType?: string;
}

/**
 * Union of all content part types
 */
export type ContentPart =
  | TextContentPart
  | ImageContentPart
  | DocumentContentPart;

/**
 * Message content - can be simple string or array of content parts
 */
export type MessageContent = string | ContentPart[];

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: MessageContent;
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
  toolCall?: {
    id?: string;
    name?: string;
    /** Arguments as JSON string fragment (streaming) or parsed object */
    arguments?: string | Record<string, unknown>;
  };
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
  signal?: AbortSignal;
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
