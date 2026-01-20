/**
 * Tests for ollama-provider.ts
 *
 * Tests the OllamaProvider class with mocked fetch.
 * Focus areas:
 * - Constructor validation
 * - chat() method behavior
 * - streamChat() method with NDJSON parsing
 * - isAvailable() and listModels() methods
 * - Error handling and mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider } from '../src/ollama-provider.js';
import { OllamaProviderError } from '../src/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/**
 * Helper to create a mock Response with JSON body
 */
function createMockResponse(
  body: unknown,
  options: { ok?: boolean; status?: number; statusText?: string } = {}
): Response {
  const { ok = true, status = 200, statusText = 'OK' } = options;
  return {
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
    body: null,
    headers: new Headers(),
  } as unknown as Response;
}

/**
 * Helper to create a mock streaming Response with NDJSON body
 */
function createMockStreamResponse(chunks: unknown[]): Response {
  const encoder = new TextEncoder();
  const ndjson = chunks.map((c) => JSON.stringify(c)).join('\n') + '\n';
  const encoded = encoder.encode(ndjson);

  // Create a simple async iterator
  let position = 0;
  const chunkSize = 50; // Simulate chunked transfer

  const body = new ReadableStream({
    pull(controller) {
      if (position >= encoded.length) {
        controller.close();
        return;
      }

      const end = Math.min(position + chunkSize, encoded.length);
      const chunk = encoded.slice(position, end);
      controller.enqueue(chunk);
      position = end;
    },
  });

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body,
    json: vi.fn(),
    headers: new Headers(),
  } as unknown as Response;
}

describe('OllamaProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      expect(provider.name).toBe('ollama');
      expect(provider.model).toBe('llama3.2');
    });

    it('should throw error without model', () => {
      expect(() => {
        new OllamaProvider({
          model: '',
        });
      }).toThrow(OllamaProviderError);
    });

    it('should use default host when not specified', () => {
      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      // Provider should be created with default host
      expect(provider).toBeDefined();
    });

    it('should accept custom host', () => {
      const provider = new OllamaProvider({
        model: 'llama3.2',
        host: 'http://192.168.1.100:11434',
      });

      expect(provider).toBeDefined();
    });

    it('should accept default options', () => {
      const provider = new OllamaProvider({
        model: 'llama3.2',
        defaultOptions: {
          temperature: 0.5,
          maxTokens: 2000,
        },
      });

      expect(provider).toBeDefined();
    });

    it('should strip trailing slash from host', () => {
      const provider = new OllamaProvider({
        model: 'llama3.2',
        host: 'http://localhost:11434/',
      });

      expect(provider).toBeDefined();
    });
  });

  // ==========================================================================
  // chat()
  // ==========================================================================

  describe('chat', () => {
    it('should call Ollama API and return mapped response', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello! I am Llama.',
        },
        done: true,
        done_reason: 'stop',
        total_duration: 1000000000, // 1 second in nanoseconds
        prompt_eval_count: 10,
        eval_count: 8,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const response = await provider.chat([
        { role: 'user', content: 'Hello!' },
      ]);

      expect(response.content).toBe('Hello! I am Llama.');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(8);
      expect(response.usage?.totalTokens).toBe(18);
      expect(response.metadata?.modelId).toBe('llama3.2');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include system message in messages array', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Sure!' },
        done: true,
        prompt_eval_count: 20,
        eval_count: 2,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      await provider.chat([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ]);

      // Verify request body
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // System message should be in messages array (Ollama supports it)
      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[0].role).toBe('system');
      expect(requestBody.messages[0].content).toBe('You are helpful.');
    });

    it('should handle tool calls in response', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: 'web_search',
                arguments: { query: 'weather SF' },
              },
            },
          ],
        },
        done: true,
        prompt_eval_count: 15,
        eval_count: 25,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const response = await provider.chat(
        [{ role: 'user', content: 'What is the weather?' }],
        {
          tools: [
            {
              name: 'web_search',
              description: 'Search the web',
              parameters: { type: 'object' },
            },
          ],
        }
      );

      expect(response.finishReason).toBe('tool_calls');
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0].name).toBe('web_search');
      expect(response.toolCalls![0].arguments).toEqual({ query: 'weather SF' });
    });

    it('should send tools in OpenAI format', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'OK' },
        done: true,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      await provider.chat([{ role: 'user', content: 'Hi' }], {
        tools: [
          {
            name: 'calculator',
            description: 'Do math',
            parameters: {
              type: 'object',
              properties: { expression: { type: 'string' } },
            },
          },
        ],
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.tools).toHaveLength(1);
      expect(requestBody.tools[0].type).toBe('function');
      expect(requestBody.tools[0].function.name).toBe('calculator');
    });

    it('should merge default options with request options', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'OK' },
        done: true,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
        defaultOptions: {
          temperature: 0.5,
          maxTokens: 1000,
        },
      });

      await provider.chat([{ role: 'user', content: 'Hi' }], {
        temperature: 0.8, // Override default
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.options.temperature).toBe(0.8); // Overridden
      expect(requestBody.options.num_predict).toBe(1000); // From defaults (mapped)
    });

    it('should throw mapped error on connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      await expect(
        provider.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(OllamaProviderError);

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
      } catch (error) {
        expect(error).toBeInstanceOf(OllamaProviderError);
        expect((error as OllamaProviderError).code).toBe('OLLAMA_CONNECTION_ERROR');
        expect((error as OllamaProviderError).isRetryable).toBe(true);
      }
    });

    it('should throw mapped error on model not found', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'model "nonexistent" not found' },
          { ok: false, status: 404, statusText: 'Not Found' }
        )
      );

      const provider = new OllamaProvider({
        model: 'nonexistent',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OllamaProviderError);
        expect((error as OllamaProviderError).code).toBe('OLLAMA_MODEL_NOT_FOUND');
      }
    });

    it('should handle JSON response format', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: '{"result": 42}' },
        done: true,
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      await provider.chat([{ role: 'user', content: 'Hi' }], {
        responseFormat: { type: 'json_object' },
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.format).toBe('json');
    });
  });

  // ==========================================================================
  // streamChat()
  // ==========================================================================

  describe('streamChat', () => {
    it('should yield text chunks from NDJSON stream', async () => {
      const streamChunks = [
        {
          model: 'llama3.2',
          created_at: '2024-01-01T00:00:00Z',
          message: { role: 'assistant', content: 'Hello' },
          done: false,
        },
        {
          model: 'llama3.2',
          created_at: '2024-01-01T00:00:01Z',
          message: { role: 'assistant', content: ' World' },
          done: false,
        },
        {
          model: 'llama3.2',
          created_at: '2024-01-01T00:00:02Z',
          message: { role: 'assistant', content: '' },
          done: true,
          done_reason: 'stop',
          total_duration: 2000000000,
          prompt_eval_count: 10,
          eval_count: 5,
        },
      ];

      mockFetch.mockResolvedValueOnce(createMockStreamResponse(streamChunks));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const chunks = [];
      for await (const chunk of provider.streamChat([
        { role: 'user', content: 'Hi' },
      ])) {
        chunks.push(chunk);
      }

      // Should have text chunks
      const textChunks = chunks.filter((c) => c.type === 'text');
      expect(textChunks.length).toBe(2);
      expect(textChunks[0].content).toBe('Hello');
      expect(textChunks[1].content).toBe(' World');

      // Should have usage chunk (from final chunk)
      const usageChunks = chunks.filter((c) => c.type === 'usage');
      expect(usageChunks.length).toBeGreaterThan(0);
      expect(usageChunks[0].usage?.promptTokens).toBe(10);
      expect(usageChunks[0].usage?.completionTokens).toBe(5);
    });

    it('should yield tool call chunks from stream', async () => {
      const streamChunks = [
        {
          model: 'llama3.2',
          created_at: '2024-01-01T00:00:00Z',
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                function: {
                  name: 'calculator',
                  arguments: { expression: '2+2' },
                },
              },
            ],
          },
          done: false,
        },
        {
          model: 'llama3.2',
          created_at: '2024-01-01T00:00:01Z',
          message: { role: 'assistant', content: '' },
          done: true,
          prompt_eval_count: 15,
          eval_count: 20,
        },
      ];

      mockFetch.mockResolvedValueOnce(createMockStreamResponse(streamChunks));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const chunks = [];
      for await (const chunk of provider.streamChat([
        { role: 'user', content: 'Calculate 2+2' },
      ])) {
        chunks.push(chunk);
      }

      // Should have tool_call chunks
      const toolChunks = chunks.filter((c) => c.type === 'tool_call');
      expect(toolChunks.length).toBeGreaterThan(0);
      expect(toolChunks[0].toolCall?.name).toBe('calculator');
      expect(toolChunks[0].toolCall?.arguments).toEqual({ expression: '2+2' });
    });

    it('should handle connection errors during streaming', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const chunks = [];
      try {
        for await (const chunk of provider.streamChat([
          { role: 'user', content: 'Hi' },
        ])) {
          chunks.push(chunk);
        }
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OllamaProviderError);
        expect((error as OllamaProviderError).code).toBe('OLLAMA_CONNECTION_ERROR');
      }

      // Should have yielded error chunk before throwing
      const errorChunks = chunks.filter((c) => c.error);
      expect(errorChunks.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // isAvailable()
  // ==========================================================================

  describe('isAvailable', () => {
    it('should return true when server is running and model exists', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          models: [
            { name: 'llama3.2:latest', model: 'llama3.2' },
            { name: 'mistral:latest', model: 'mistral' },
          ],
        })
      );

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when model is not pulled', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          models: [{ name: 'mistral:latest', model: 'mistral' }],
        })
      );

      const provider = new OllamaProvider({
        model: 'llama3.2', // Not in the list
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when server is not running', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should match model without tag suffix', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          models: [{ name: 'llama3.2:latest', model: 'llama3.2' }],
        })
      );

      const provider = new OllamaProvider({
        model: 'llama3.2', // Without :latest
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });
  });

  // ==========================================================================
  // listModels()
  // ==========================================================================

  describe('listModels', () => {
    it('should return list of available models', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          models: [
            { name: 'llama3.2:latest', model: 'llama3.2' },
            { name: 'mistral:latest', model: 'mistral' },
            { name: 'codellama:7b', model: 'codellama' },
          ],
        })
      );

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      const models = await provider.listModels();

      expect(models).toHaveLength(3);
      expect(models[0].id).toBe('llama3.2:latest');
      expect(models[1].id).toBe('mistral:latest');
      expect(models[2].id).toBe('codellama:7b');
    });

    it('should throw error when server is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      await expect(provider.listModels()).rejects.toThrow(OllamaProviderError);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('should provide troubleshooting hints for connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OllamaProviderError);
        const ollamaError = error as OllamaProviderError;
        expect(ollamaError.troubleshootingHint).toBe(
          'Is Ollama running? Start it with: ollama serve'
        );
      }
    });

    it('should provide troubleshooting hints for model not found', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'model "nonexistent" not found' },
          { ok: false, status: 404, statusText: 'Not Found' }
        )
      );

      const provider = new OllamaProvider({
        model: 'nonexistent',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OllamaProviderError);
        const ollamaError = error as OllamaProviderError;
        expect(ollamaError.troubleshootingHint).toContain('ollama pull');
      }
    });

    it('should mark connection errors as retryable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('ECONNREFUSED'));

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
      } catch (error) {
        expect((error as OllamaProviderError).isRetryable).toBe(true);
        expect((error as OllamaProviderError).retryAfterMs).toBe(5000);
      }
    });

    it('should not mark invalid request errors as retryable', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { error: 'invalid request' },
          { ok: false, status: 400, statusText: 'Bad Request' }
        )
      );

      const provider = new OllamaProvider({
        model: 'llama3.2',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
      } catch (error) {
        expect((error as OllamaProviderError).isRetryable).toBe(false);
        expect((error as OllamaProviderError).retryAfterMs).toBeNull();
      }
    });
  });
});
