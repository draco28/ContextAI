/**
 * Tests for anthropic-provider.ts
 *
 * Tests the AnthropicProvider class with mocked Anthropic SDK.
 * Focus areas:
 * - Constructor validation
 * - chat() method behavior
 * - streamChat() method behavior
 * - isAvailable() method
 * - Error handling and mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../src/anthropic-provider.js';
import { AnthropicProviderError } from '../src/errors.js';

// Create mock functions
const mockCreate = vi.fn();
const mockStream = vi.fn();

// Mock the Anthropic SDK module
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
        stream: mockStream,
      };
      constructor() {
        // Constructor doesn't need to do anything special
      }
    },
  };
});

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      expect(provider.name).toBe('anthropic');
      expect(provider.model).toBe('claude-sonnet-4-20250514');
    });

    it('should throw error without API key', () => {
      expect(() => {
        new AnthropicProvider({
          apiKey: '',
          model: 'claude-sonnet-4-20250514',
        });
      }).toThrow(AnthropicProviderError);
    });

    it('should throw error without model', () => {
      expect(() => {
        new AnthropicProvider({
          apiKey: 'test-key',
          model: '',
        });
      }).toThrow(AnthropicProviderError);
    });

    it('should accept default options', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
        defaultOptions: {
          temperature: 0.5,
          maxTokens: 2000,
        },
      });

      expect(provider).toBeDefined();
    });

    it('should accept beta features', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
        betaFeatures: ['prompt-caching-2024-07-31'],
      });

      expect(provider).toBeDefined();
    });
  });

  // ==========================================================================
  // chat()
  // ==========================================================================

  describe('chat', () => {
    it('should call Anthropic API and return mapped response', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_test_123',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hello! I am Claude.' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 8,
        },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      const response = await provider.chat([
        { role: 'user', content: 'Hello!' },
      ]);

      expect(response.content).toBe('Hello! I am Claude.');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.totalTokens).toBe(18);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should extract system message to separate param', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_sys',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Sure!' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 20, output_tokens: 2 },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      await provider.chat([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ]);

      // Verify system was extracted
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.system).toBe('You are helpful.');
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].role).toBe('user');
    });

    it('should handle tool calls in response', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_tool',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [
          { type: 'text', text: 'Let me search for that.' },
          {
            type: 'tool_use',
            id: 'tool_123',
            name: 'web_search',
            input: { query: 'weather SF' },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: { input_tokens: 15, output_tokens: 25 },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
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

    it('should merge default options with request options', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_opts',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'OK' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 5, output_tokens: 1 },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
        defaultOptions: {
          temperature: 0.5,
          maxTokens: 1000,
        },
      });

      await provider.chat([{ role: 'user', content: 'Hi' }], {
        temperature: 0.8, // Override default
      });

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.8); // Overridden
      expect(callArgs.max_tokens).toBe(1000); // From defaults
    });

    it('should throw mapped error on API failure', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key',
        error: { type: 'authentication_error', message: 'Invalid API key' },
      });

      const provider = new AnthropicProvider({
        apiKey: 'bad-key',
        model: 'claude-sonnet-4-20250514',
      });

      await expect(
        provider.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow(AnthropicProviderError);
    });

    it('should map 401 error to ANTHROPIC_AUTH_ERROR', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key',
      });

      const provider = new AnthropicProvider({
        apiKey: 'bad-key',
        model: 'claude-sonnet-4-20250514',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AnthropicProviderError);
        expect((error as AnthropicProviderError).code).toBe('ANTHROPIC_AUTH_ERROR');
      }
    });

    it('should map 429 error to ANTHROPIC_RATE_LIMIT', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded',
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      try {
        await provider.chat([{ role: 'user', content: 'Hi' }]);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AnthropicProviderError);
        expect((error as AnthropicProviderError).code).toBe('ANTHROPIC_RATE_LIMIT');
        expect((error as AnthropicProviderError).isRetryable).toBe(true);
      }
    });
  });

  // ==========================================================================
  // streamChat()
  // ==========================================================================

  describe('streamChat', () => {
    it('should yield text chunks from stream', async () => {
      // Create async iterable mock
      const mockEvents = [
        {
          type: 'message_start',
          message: {
            id: 'msg_stream',
            type: 'message',
            role: 'assistant',
            model: 'claude-sonnet-4-20250514',
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        },
        {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'Hello' },
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: ' World' },
        },
        {
          type: 'content_block_stop',
          index: 0,
        },
        {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: 5 },
        },
        {
          type: 'message_stop',
        },
      ];

      const mockStreamObject = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
        finalMessage: vi.fn().mockResolvedValue({
          id: 'msg_stream',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-20250514',
          content: [{ type: 'text', text: 'Hello World' }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };

      mockStream.mockReturnValueOnce(mockStreamObject);

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      const chunks = [];
      for await (const chunk of provider.streamChat([
        { role: 'user', content: 'Hi' },
      ])) {
        chunks.push(chunk);
      }

      // Should have text chunks
      const textChunks = chunks.filter((c) => c.type === 'text');
      expect(textChunks.length).toBeGreaterThan(0);
      expect(textChunks[0].content).toBe('Hello');
      expect(textChunks[1].content).toBe(' World');

      // Should have usage chunk
      const usageChunks = chunks.filter((c) => c.type === 'usage');
      expect(usageChunks.length).toBeGreaterThan(0);

      // Should have done chunk
      const doneChunks = chunks.filter((c) => c.type === 'done');
      expect(doneChunks).toHaveLength(1);
    });

    it('should yield tool call chunks from stream', async () => {
      const mockEvents = [
        {
          type: 'message_start',
          message: {
            id: 'msg_tool_stream',
            type: 'message',
            role: 'assistant',
            model: 'claude-sonnet-4-20250514',
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 15, output_tokens: 0 },
          },
        },
        {
          type: 'content_block_start',
          index: 0,
          content_block: {
            type: 'tool_use',
            id: 'tool_stream_1',
            name: 'calculator',
            input: {},
          },
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'input_json_delta', partial_json: '{"expr' },
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'input_json_delta', partial_json: 'ession":"2+2"}' },
        },
        {
          type: 'content_block_stop',
          index: 0,
        },
        {
          type: 'message_stop',
        },
      ];

      const mockStreamObject = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of mockEvents) {
            yield event;
          }
        },
        finalMessage: vi.fn().mockResolvedValue({
          id: 'msg_tool_stream',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-20250514',
          content: [
            {
              type: 'tool_use',
              id: 'tool_stream_1',
              name: 'calculator',
              input: { expression: '2+2' },
            },
          ],
          stop_reason: 'tool_use',
          stop_sequence: null,
          usage: { input_tokens: 15, output_tokens: 20 },
        }),
      };

      mockStream.mockReturnValueOnce(mockStreamObject);

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
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

      // Last tool chunk should have the tool name
      const lastToolChunk = toolChunks[toolChunks.length - 1];
      expect(lastToolChunk.toolCall?.name).toBe('calculator');
    });
  });

  // ==========================================================================
  // isAvailable()
  // ==========================================================================

  describe('isAvailable', () => {
    it('should return true when API is accessible', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_avail',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hi' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false for auth errors', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key',
      });

      const provider = new AnthropicProvider({
        apiKey: 'bad-key',
        model: 'claude-sonnet-4-20250514',
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    it('should return true for rate limit errors (API is reachable)', async () => {
      mockCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limited',
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true); // Rate limit means API is reachable
    });
  });

  // ==========================================================================
  // getRateLimits()
  // ==========================================================================

  describe('getRateLimits', () => {
    it('should return null when no rate limit data', async () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      const limits = await provider.getRateLimits();

      expect(limits).toBeNull();
    });

    it('should return rate limits after a request', async () => {
      mockCreate.mockResolvedValueOnce({
        id: 'msg_rate',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hi' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 5, output_tokens: 1 },
        _headers: {
          'anthropic-ratelimit-requests-remaining': '99',
          'anthropic-ratelimit-tokens-remaining': '9999',
        },
      });

      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });

      await provider.chat([{ role: 'user', content: 'Hi' }]);
      const limits = await provider.getRateLimits();

      expect(limits).not.toBeNull();
      expect(limits?.requestsRemaining).toBe(99);
      expect(limits?.tokensRemaining).toBe(9999);
    });
  });
});
