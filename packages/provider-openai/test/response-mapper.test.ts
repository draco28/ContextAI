import { describe, it, expect } from 'vitest';
import {
  mapResponse,
  mapStreamChunk,
  finalizeToolCalls,
  type StreamingToolCallState,
} from '../src/response-mapper.js';
import type OpenAI from 'openai';

type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;

describe('response-mapper', () => {
  describe('mapResponse', () => {
    it('should map basic completion response', () => {
      const completion: ChatCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o-2024-08-06',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
              refusal: null,
            },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
        system_fingerprint: 'fp_abc123',
      };

      const result = mapResponse(completion);

      expect(result).toEqual({
        content: 'Hello! How can I help you?',
        toolCalls: undefined,
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18,
          reasoningTokens: undefined,
        },
        metadata: {
          requestId: 'chatcmpl-123',
          modelId: 'gpt-4o-2024-08-06',
          systemFingerprint: 'fp_abc123',
        },
      });
    });

    it('should map response with tool calls', () => {
      const completion: ChatCompletion = {
        id: 'chatcmpl-456',
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
                    arguments: '{"query":"cats"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
            logprobs: null,
          },
        ],
      };

      const result = mapResponse(completion);

      expect(result.finishReason).toBe('tool_calls');
      expect(result.toolCalls).toEqual([
        {
          id: 'call_abc',
          name: 'search',
          arguments: { query: 'cats' },
        },
      ]);
    });

    it('should handle content_filter finish reason', () => {
      const completion: ChatCompletion = {
        id: 'chatcmpl-789',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '',
              refusal: null,
            },
            finish_reason: 'content_filter',
            logprobs: null,
          },
        ],
      };

      const result = mapResponse(completion);

      expect(result.finishReason).toBe('content_filter');
    });

    it('should handle length finish reason', () => {
      const completion: ChatCompletion = {
        id: 'chatcmpl-999',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is truncated...',
              refusal: null,
            },
            finish_reason: 'length',
            logprobs: null,
          },
        ],
      };

      const result = mapResponse(completion);

      expect(result.finishReason).toBe('length');
    });

    it('should handle malformed tool call arguments', () => {
      const completion: ChatCompletion = {
        id: 'chatcmpl-bad',
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
                  id: 'call_bad',
                  type: 'function',
                  function: {
                    name: 'broken',
                    arguments: 'not valid json',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
            logprobs: null,
          },
        ],
      };

      const result = mapResponse(completion);

      // Should not throw, returns empty object
      expect(result.toolCalls?.[0].arguments).toEqual({});
    });
  });

  describe('mapStreamChunk', () => {
    it('should map text content chunk', () => {
      const chunk: ChatCompletionChunk = {
        id: 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            delta: {
              content: 'Hello',
            },
            finish_reason: null,
          },
        ],
      };

      const toolCallState = new Map<number, StreamingToolCallState>();
      const result = mapStreamChunk(chunk, toolCallState);

      expect(result).toEqual({
        type: 'text',
        content: 'Hello',
      });
    });

    it('should map usage chunk', () => {
      const chunk: ChatCompletionChunk = {
        id: 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      const toolCallState = new Map<number, StreamingToolCallState>();
      const result = mapStreamChunk(chunk, toolCallState);

      expect(result).toEqual({
        type: 'usage',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });
    });

    it('should map done chunk', () => {
      const chunk: ChatCompletionChunk = {
        id: 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4o',
        system_fingerprint: 'fp_xyz',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      };

      const toolCallState = new Map<number, StreamingToolCallState>();
      const result = mapStreamChunk(chunk, toolCallState);

      expect(result).toEqual({
        type: 'done',
        metadata: {
          requestId: 'chatcmpl-stream',
          modelId: 'gpt-4o',
          systemFingerprint: 'fp_xyz',
        },
      });
    });

    it('should accumulate tool call chunks', () => {
      const toolCallState = new Map<number, StreamingToolCallState>();

      // First chunk: tool call ID and name
      const chunk1: ChatCompletionChunk = {
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
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'search',
                    arguments: '',
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };

      const result1 = mapStreamChunk(chunk1, toolCallState);
      expect(result1?.type).toBe('tool_call');
      expect((result1 as { toolCall: { id: string } }).toolCall.id).toBe('call_123');

      // Second chunk: partial arguments
      const chunk2: ChatCompletionChunk = {
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
                  function: {
                    arguments: '{"query":',
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };

      const result2 = mapStreamChunk(chunk2, toolCallState);
      expect(result2?.type).toBe('tool_call');

      // Third chunk: more arguments
      const chunk3: ChatCompletionChunk = {
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
                  function: {
                    arguments: '"cats"}',
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };

      mapStreamChunk(chunk3, toolCallState);

      // Verify accumulated state
      expect(toolCallState.get(0)).toEqual({
        id: 'call_123',
        name: 'search',
        arguments: '{"query":"cats"}',
      });
    });

    it('should return null for empty delta', () => {
      const chunk: ChatCompletionChunk = {
        id: 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: null,
          },
        ],
      };

      const toolCallState = new Map<number, StreamingToolCallState>();
      const result = mapStreamChunk(chunk, toolCallState);

      expect(result).toBeNull();
    });
  });

  describe('finalizeToolCalls', () => {
    it('should convert accumulated state to tool calls', () => {
      const state = new Map<number, StreamingToolCallState>();
      state.set(0, {
        id: 'call_1',
        name: 'search',
        arguments: '{"query":"cats"}',
      });
      state.set(1, {
        id: 'call_2',
        name: 'calculate',
        arguments: '{"x":1,"y":2}',
      });

      const result = finalizeToolCalls(state);

      expect(result).toEqual([
        {
          id: 'call_1',
          name: 'search',
          arguments: { query: 'cats' },
        },
        {
          id: 'call_2',
          name: 'calculate',
          arguments: { x: 1, y: 2 },
        },
      ]);
    });

    it('should skip incomplete tool calls', () => {
      const state = new Map<number, StreamingToolCallState>();
      state.set(0, {
        id: '',
        name: '',
        arguments: '{}',
      });

      const result = finalizeToolCalls(state);

      expect(result).toEqual([]);
    });
  });
});
