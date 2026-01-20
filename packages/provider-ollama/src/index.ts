/**
 * @contextai/provider-ollama
 *
 * Ollama local LLM provider for ContextAI SDK.
 *
 * Supports local models like Llama 3, Mistral, CodeLlama, and more
 * via the Ollama server. No API key required - run LLMs locally!
 *
 * @example
 * ```typescript
 * import { OllamaProvider, OllamaModels } from '@contextai/provider-ollama';
 *
 * const provider = new OllamaProvider({
 *   model: OllamaModels.LLAMA_3_2,
 *   host: 'http://localhost:11434',
 * });
 *
 * // Check if Ollama is running
 * if (await provider.isAvailable()) {
 *   const response = await provider.chat([
 *     { role: 'user', content: 'Hello!' }
 *   ]);
 *   console.log(response.content);
 * } else {
 *   console.log('Start Ollama with: ollama serve');
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main provider class
export { OllamaProvider } from './ollama-provider.js';

// Configuration and types
export type { OllamaProviderConfig } from './types.js';
export { OllamaModels } from './types.js';
export type { OllamaModelId } from './types.js';

// Error handling
export { OllamaProviderError, mapOllamaError } from './errors.js';
export type { OllamaErrorCode } from './errors.js';
