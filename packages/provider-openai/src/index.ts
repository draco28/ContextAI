// Main provider export
export { OpenAIProvider } from './openai-provider.js';

// Configuration types
export type { OpenAIProviderConfig, RateLimitState } from './types.js';

// Error types
export { OpenAIProviderError, mapOpenAIError } from './errors.js';
export type { OpenAIErrorCode } from './errors.js';

// Utility exports (for advanced users)
export {
  mapMessages,
  mapMessage,
  mapTools,
  mapResponseFormat,
  buildRequestParams,
} from './message-mapper.js';

export {
  mapResponse,
  mapStreamChunk,
  finalizeToolCalls,
} from './response-mapper.js';
export type { StreamingToolCallState } from './response-mapper.js';
