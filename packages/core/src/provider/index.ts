// Type exports from types.ts
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
  // New multimodal types
  TextContentPart,
  ImageContentPart,
  DocumentContentPart,
  ContentPart,
  MessageContent,
} from './types';

// Runtime exports from content.ts
export {
  isMultimodalContent,
  isTextContent,
  isImageContent,
  isDocumentContent,
  normalizeContent,
  extractTextContent,
} from './content';
