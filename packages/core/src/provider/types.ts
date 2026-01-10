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
 * Cache information from provider response
 */
export interface CacheInfo {
  /** Whether the response was served from cache */
  hit: boolean;
  /** Number of tokens saved by cache hit */
  tokensSaved?: number;
  /** Cache TTL in seconds */
  ttlSeconds?: number;
}

/**
 * Response metadata for debugging and observability
 */
export interface ResponseMetadata {
  /** Provider-assigned request identifier */
  requestId?: string;
  /** Model version that generated the response */
  modelVersion?: string;
  /** Model identifier used */
  modelId?: string;
  /** Cache information (Claude prompt caching, etc.) */
  cache?: CacheInfo;
  /** Response latency in milliseconds */
  latencyMs?: number;
  /** OpenAI system fingerprint for reproducibility */
  systemFingerprint?: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Tokens in the prompt/input */
  promptTokens: number;
  /** Tokens in the completion/output */
  completionTokens: number;
  /** Total tokens used */
  totalTokens: number;
  /** Tokens used for reasoning (Claude thinking, o1 reasoning) */
  reasoningTokens?: number;
  /** Tokens read from prompt cache */
  cacheReadTokens?: number;
  /** Tokens written to prompt cache */
  cacheWriteTokens?: number;
}

/**
 * LLM response structure
 */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  /** Token usage statistics */
  usage?: TokenUsage;
  /** Response metadata for debugging/observability */
  metadata?: ResponseMetadata;
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
  /** Token usage (typically sent with 'usage' or 'done' chunk) */
  usage?: TokenUsage;
  /** Response metadata (typically sent with 'done' chunk) */
  metadata?: ResponseMetadata;
}

/**
 * Response format configuration for structured output
 */
export type ResponseFormat =
  | { type: 'text' }
  | { type: 'json_object'; schema?: Record<string, unknown> }
  | {
      type: 'json_schema';
      jsonSchema: {
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
    };

/**
 * Options for generate/chat calls
 */
export interface GenerateOptions {
  /** Sampling temperature (0-2, lower = more deterministic) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Stop generation at these sequences */
  stopSequences?: string[];
  /** Tools available for the model to call */
  tools?: ToolDefinition[];
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Response format (text, json_object, json_schema) */
  responseFormat?: ResponseFormat;
  /** Nucleus sampling: consider tokens with top_p probability mass */
  topP?: number;
  /** Top-K sampling: only consider top K tokens (Claude) */
  topK?: number;
  /** Penalize tokens based on frequency in response (-2 to 2) */
  frequencyPenalty?: number;
  /** Penalize tokens that already appeared (-2 to 2) */
  presencePenalty?: number;
  /** Random seed for reproducible outputs */
  seed?: number;
  /** End-user identifier for abuse detection */
  user?: string;
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
