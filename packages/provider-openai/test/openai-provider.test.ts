import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../src/openai-provider.js';
import { OpenAIProviderError } from '../src/errors.js';
import type { ChatMessage } from '@contextaisdk/core';

// Mock the openai module
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  const mockModelsList = vi.fn();

  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
      models: {
        list: mockModelsList,
      },
    })),
    __mockCreate: mockCreate,
    __mockModelsList: mockModelsList,
  };
});

// Get references to mocks
const getMocks = async () => {
  const mod = await import('openai');
  return {
    mockCreate: (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate,
    mockModelsList: (mod as unknown as { __mockModelsList: ReturnType<typeof vi.fn> }).__mockModelsList,
  };
};

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(async () => {
    const { mockCreate, mockModelsList } = await getMocks();
    mockCreate.mockReset();
    mockModelsList.mockReset();

    provider = new OpenAIProvider({
      apiKey: 'test-api-key',
      model: 'gpt-4o',
    });
  });

  describe('constructor', () => {
    it('should create provider with required config', () => {
      expect(provider.name).toBe('openai');
      expect(provider.model).toBe('gpt-4o');
    });

    it('should accept optional config', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'key',
        model: 'gpt-4-turbo',
        organization: 'org-123',
        baseURL: 'https://custom.api.com',
        timeout: 30000,
        maxRetries: 3,
        headers: { 'X-Custom': 'value' },
        defaultOptions: {
          temperature: 0.5,
        },
      });

      expect(customProvider.model).toBe('gpt-4-turbo');
    });
  });

  describe('chat', () => {
    it('should call OpenAI API and return mapped response', async () => {
      const { mockCreate } = await getMocks();
      mockCreate.mockResolvedValueOnce({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
              refusal: null,
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7,
        },
      });

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hi' },
      ];

      const response = await provider.chat(messages);

      expect(response.content).toBe('Hello!');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.totalTokens).toBe(7);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        expect.any(Object)
      );
    });

    it('should merge default options with request options', async () => {
      const { mockCreate } = await getMocks();
      mockCreate.mockResolvedValueOnce({
        id: 'chatcmpl-456',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'OK', refusal: null },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
      });

      const providerWithDefaults = new OpenAIProvider({
        apiKey: 'key',
        model: 'gpt-4o',
        defaultOptions: {
          temperature: 0.3,
          maxTokens: 500,
        },
      });

      await providerWithDefaults.chat(
        [{ role: 'user', content: 'Test' }],
        { temperature: 0.8 } // Override default
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8, // Overridden
          max_tokens: 500, // From defaults
        }),
        expect.any(Object)
      );
    });

    it('should handle tool calls in response', async () => {
      const { mockCreate } = await getMocks();
      mockCreate.mockResolvedValueOnce({
        id: 'chatcmpl-789',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              refusal: null,
              tool_calls: [
                {
                  id: 'call_abc',
                  type: 'function',
                  function: {
                    name: 'search',
                    arguments: '{"query":"test"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
            logprobs: null,
          },
        ],
      });

      const response = await provider.chat(
        [{ role: 'user', content: 'Search for test' }],
        {
          tools: [
            {
              name: 'search',
              description: 'Search',
              parameters: { type: 'object' },
            },
          ],
        }
      );

      expect(response.finishReason).toBe('tool_calls');
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].name).toBe('search');
      expect(response.toolCalls?.[0].arguments).toEqual({ query: 'test' });
    });

    it('should throw OpenAIProviderError on API error', async () => {
      const { mockCreate } = await getMocks();
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key',
      });

      await expect(
        provider.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(OpenAIProviderError);
    });

    it('should handle rate limit errors', async () => {
      const { mockCreate } = await getMocks();
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIProviderError);
        expect((error as OpenAIProviderError).code).toBe('OPENAI_RATE_LIMIT');
        expect((error as OpenAIProviderError).isRetryable).toBe(true);
      }
    });
  });

  describe('streamChat', () => {
    it('should yield text chunks from stream', async () => {
      const { mockCreate } = await getMocks();

      // Create async iterator for stream
      const streamChunks = [
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: null }],
        },
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [{ index: 0, delta: { content: ' World' }, finish_reason: null }],
        },
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        },
      ];

      mockCreate.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamChunks) {
            yield chunk;
          }
        },
      });

      const chunks: Array<{ type: string; content?: string }> = [];
      for await (const chunk of provider.streamChat([{ role: 'user', content: 'Hi' }])) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ type: 'text', content: 'Hello' });
      expect(chunks[1]).toEqual({ type: 'text', content: ' World' });
      expect(chunks[2].type).toBe('done');
    });

    it('should accumulate and emit tool calls', async () => {
      const { mockCreate } = await getMocks();

      const streamChunks = [
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: 'call_xyz',
                    type: 'function',
                    function: { name: 'calc', arguments: '' },
                  },
                ],
              },
              finish_reason: null,
            },
          ],
        },
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              delta: {
                tool_calls: [
                  { index: 0, function: { arguments: '{"x":1}' } },
                ],
              },
              finish_reason: null,
            },
          ],
        },
        {
          id: 'chatcmpl-stream',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }],
        },
      ];

      mockCreate.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of streamChunks) {
            yield chunk;
          }
        },
      });

      const chunks: Array<{ type: string; toolCall?: unknown }> = [];
      for await (const chunk of provider.streamChat([{ role: 'user', content: 'Calculate' }])) {
        chunks.push(chunk);
      }

      // Should have tool_call chunks and a final done
      const toolCallChunks = chunks.filter((c) => c.type === 'tool_call');
      expect(toolCallChunks.length).toBeGreaterThan(0);

      // Last tool_call chunk should have complete data
      const lastToolCall = toolCallChunks[toolCallChunks.length - 1];
      expect(lastToolCall.toolCall).toBeDefined();
    });

    it('should pass stream options to API', async () => {
      const { mockCreate } = await getMocks();

      mockCreate.mockResolvedValueOnce({
        [Symbol.asyncIterator]: async function* () {
          yield {
            id: 'chatcmpl-stream',
            object: 'chat.completion.chunk',
            created: 1234567890,
            model: 'gpt-4o',
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          };
        },
      });

      // Consume the stream
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of provider.streamChat([{ role: 'user', content: 'Hi' }])) {
        // Just consume
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
          stream_options: { include_usage: true },
        }),
        expect.any(Object)
      );
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is accessible', async () => {
      const { mockModelsList } = await getMocks();
      mockModelsList.mockResolvedValueOnce({ data: [{ id: 'gpt-4o' }] });

      const result = await provider.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when API is not accessible', async () => {
      const { mockModelsList } = await getMocks();
      mockModelsList.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getRateLimits', () => {
    it('should return null initially', async () => {
      const result = await provider.getRateLimits();

      expect(result).toBeNull();
    });
  });
});
