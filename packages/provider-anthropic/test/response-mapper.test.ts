/**
 * Tests for response-mapper.ts
 *
 * Tests the mapping from Anthropic responses to ContextAI format.
 * Focus areas:
 * - Non-streaming response mapping
 * - Streaming event handling
 * - Tool call extraction and accumulation
 * - Extended thinking blocks
 * - Finish reason mapping
 */

import { describe, it, expect } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import {
  mapResponse,
  mapStreamEvent,
  createStreamingState,
  finalizeToolCalls,
} from '../src/response-mapper.js';

// Type helpers for test data
type AnthropicMessage = Anthropic.Message;
type AnthropicStreamEvent = Anthropic.MessageStreamEvent;

describe('response-mapper', () => {
  // ==========================================================================
  // mapResponse (non-streaming)
  // ==========================================================================

  describe('mapResponse', () => {
    it('should map basic text response', () => {
      const message: AnthropicMessage = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hello! How can I help?' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 8,
        },
      };

      const response = mapResponse(message);

      expect(response.content).toBe('Hello! How can I help?');
      expect(response.finishReason).toBe('stop');
      expect(response.toolCalls).toBeUndefined();
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
      expect(response.metadata?.requestId).toBe('msg_123');
      expect(response.metadata?.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('should map response with tool calls', () => {
      const message: AnthropicMessage = {
        id: 'msg_456',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [
          { type: 'text', text: 'Let me check the weather.' },
          {
            type: 'tool_use',
            id: 'tool_abc',
            name: 'get_weather',
            input: { location: 'San Francisco' },
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 15,
          output_tokens: 25,
        },
      };

      const response = mapResponse(message);

      expect(response.content).toBe('Let me check the weather.');
      expect(response.finishReason).toBe('tool_calls');
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0]).toEqual({
        id: 'tool_abc',
        name: 'get_weather',
        arguments: { location: 'San Francisco' },
      });
    });

    it('should map response with multiple tool calls', () => {
      const message: AnthropicMessage = {
        id: 'msg_789',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'search',
            input: { query: 'restaurants' },
          },
          {
            type: 'tool_use',
            id: 'tool_2',
            name: 'get_location',
            input: {},
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: { input_tokens: 20, output_tokens: 30 },
      };

      const response = mapResponse(message);

      expect(response.toolCalls).toHaveLength(2);
      expect(response.toolCalls![0].name).toBe('search');
      expect(response.toolCalls![1].name).toBe('get_location');
    });

    it('should map max_tokens finish reason to length', () => {
      const message: AnthropicMessage = {
        id: 'msg_max',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'This is a long...' }],
        stop_reason: 'max_tokens',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 4096 },
      };

      const response = mapResponse(message);

      expect(response.finishReason).toBe('length');
    });

    it('should map stop_sequence finish reason to stop', () => {
      const message: AnthropicMessage = {
        id: 'msg_stop',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Answer: 42' }],
        stop_reason: 'stop_sequence',
        stop_sequence: 'END',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      const response = mapResponse(message);

      expect(response.finishReason).toBe('stop');
    });

    it('should handle cache tokens in usage', () => {
      const message = {
        id: 'msg_cache',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [{ type: 'text', text: 'Hi' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 10,
          cache_read_input_tokens: 50,
          cache_creation_input_tokens: 25,
        },
      } as AnthropicMessage;

      const response = mapResponse(message);

      expect(response.usage?.cacheReadTokens).toBe(50);
      expect(response.usage?.cacheWriteTokens).toBe(25);
    });

    it('should handle thinking blocks (extended thinking)', () => {
      const message = {
        id: 'msg_think',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-20250514',
        content: [
          { type: 'thinking', thinking: 'Let me reason through this...' },
          { type: 'text', text: 'The answer is 42.' },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 20, output_tokens: 50 },
      } as AnthropicMessage;

      const response = mapResponse(message);

      expect(response.content).toBe('The answer is 42.');
      expect(response.thinking).toBe('Let me reason through this...');
    });
  });

  // ==========================================================================
  // Streaming: createStreamingState
  // ==========================================================================

  describe('createStreamingState', () => {
    it('should create fresh state', () => {
      const state = createStreamingState();

      expect(state.currentBlockIndex).toBe(-1);
      expect(state.currentBlockType).toBeNull();
      expect(state.toolCalls.size).toBe(0);
      expect(state.messageId).toBeNull();
      expect(state.modelId).toBeNull();
    });
  });

  // ==========================================================================
  // Streaming: mapStreamEvent
  // ==========================================================================

  describe('mapStreamEvent', () => {
    describe('message_start', () => {
      it('should capture message metadata', () => {
        const state = createStreamingState();
        const event: AnthropicStreamEvent = {
          type: 'message_start',
          message: {
            id: 'msg_stream_1',
            type: 'message',
            role: 'assistant',
            model: 'claude-sonnet-4-20250514',
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk).toBeNull(); // No output yet
        expect(state.messageId).toBe('msg_stream_1');
        expect(state.modelId).toBe('claude-sonnet-4-20250514');
      });
    });

    describe('content_block_start', () => {
      it('should handle text block start', () => {
        const state = createStreamingState();
        const event: AnthropicStreamEvent = {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk).toBeNull(); // Text comes in deltas
        expect(state.currentBlockType).toBe('text');
        expect(state.currentBlockIndex).toBe(0);
      });

      it('should handle tool_use block start', () => {
        const state = createStreamingState();
        const event: AnthropicStreamEvent = {
          type: 'content_block_start',
          index: 0,
          content_block: {
            type: 'tool_use',
            id: 'tool_xyz',
            name: 'calculator',
            input: {},
          },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk).not.toBeNull();
        expect(chunk?.type).toBe('tool_call');
        expect(chunk?.toolCall?.id).toBe('tool_xyz');
        expect(chunk?.toolCall?.name).toBe('calculator');
        expect(state.toolCalls.has(0)).toBe(true);
      });
    });

    describe('content_block_delta', () => {
      it('should emit text delta chunks', () => {
        const state = createStreamingState();
        state.currentBlockType = 'text';

        const event: AnthropicStreamEvent = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'Hello' },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('text');
        expect(chunk?.content).toBe('Hello');
      });

      it('should accumulate tool call arguments', () => {
        const state = createStreamingState();
        state.currentBlockType = 'tool_use';
        state.toolCalls.set(0, {
          id: 'tool_1',
          name: 'search',
          argumentsJson: '',
          index: 0,
        });

        const event: AnthropicStreamEvent = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'input_json_delta', partial_json: '{"query":' },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('tool_call');
        expect(chunk?.toolCall?.arguments).toBe('{"query":');
        expect(state.toolCalls.get(0)?.argumentsJson).toBe('{"query":');
      });

      it('should handle thinking delta', () => {
        const state = createStreamingState();
        state.currentBlockType = 'thinking';

        const event = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'thinking_delta', thinking: 'Reasoning...' },
        } as AnthropicStreamEvent;

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('thinking');
        expect(chunk?.thinking).toBe('Reasoning...');
      });
    });

    describe('content_block_stop', () => {
      it('should finalize tool call with parsed arguments', () => {
        const state = createStreamingState();
        state.currentBlockType = 'tool_use';
        state.currentBlockIndex = 0;
        state.toolCalls.set(0, {
          id: 'tool_1',
          name: 'search',
          argumentsJson: '{"query":"weather"}',
          index: 0,
        });

        const event: AnthropicStreamEvent = {
          type: 'content_block_stop',
          index: 0,
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('tool_call');
        expect(chunk?.toolCall?.arguments).toEqual({ query: 'weather' });
      });

      it('should reset block type after stop', () => {
        const state = createStreamingState();
        state.currentBlockType = 'text';

        const event: AnthropicStreamEvent = {
          type: 'content_block_stop',
          index: 0,
        };

        mapStreamEvent(event, state);

        expect(state.currentBlockType).toBeNull();
      });
    });

    describe('message_delta', () => {
      it('should emit usage chunk', () => {
        const state = createStreamingState();
        state.messageId = 'msg_1';
        state.modelId = 'claude-sonnet-4-20250514';

        const event: AnthropicStreamEvent = {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: 50 },
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('usage');
        expect(chunk?.usage?.completionTokens).toBe(50);
      });
    });

    describe('message_stop', () => {
      it('should emit done chunk', () => {
        const state = createStreamingState();
        state.messageId = 'msg_final';
        state.modelId = 'claude-sonnet-4-20250514';

        const event: AnthropicStreamEvent = {
          type: 'message_stop',
        };

        const chunk = mapStreamEvent(event, state);

        expect(chunk?.type).toBe('done');
        expect(chunk?.metadata?.requestId).toBe('msg_final');
      });
    });

    describe('unknown events', () => {
      it('should return null for unknown event types', () => {
        const state = createStreamingState();
        // Cast to any to simulate unknown event type
        const event = { type: 'unknown_event' } as unknown as AnthropicStreamEvent;

        const chunk = mapStreamEvent(event, state);

        expect(chunk).toBeNull();
      });
    });
  });

  // ==========================================================================
  // finalizeToolCalls
  // ==========================================================================

  describe('finalizeToolCalls', () => {
    it('should parse accumulated tool calls', () => {
      const state = createStreamingState();
      state.toolCalls.set(0, {
        id: 'tool_a',
        name: 'search',
        argumentsJson: '{"query":"hello"}',
        index: 0,
      });
      state.toolCalls.set(1, {
        id: 'tool_b',
        name: 'calculate',
        argumentsJson: '{"expression":"1+1"}',
        index: 1,
      });

      const toolCalls = finalizeToolCalls(state);

      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0]).toEqual({
        id: 'tool_a',
        name: 'search',
        arguments: { query: 'hello' },
      });
      expect(toolCalls[1]).toEqual({
        id: 'tool_b',
        name: 'calculate',
        arguments: { expression: '1+1' },
      });
    });

    it('should handle empty JSON gracefully', () => {
      const state = createStreamingState();
      state.toolCalls.set(0, {
        id: 'tool_empty',
        name: 'no_args',
        argumentsJson: '',
        index: 0,
      });

      const toolCalls = finalizeToolCalls(state);

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].arguments).toEqual({});
    });

    it('should handle invalid JSON gracefully', () => {
      const state = createStreamingState();
      state.toolCalls.set(0, {
        id: 'tool_bad',
        name: 'broken',
        argumentsJson: '{invalid json}',
        index: 0,
      });

      const toolCalls = finalizeToolCalls(state);

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].arguments).toEqual({});
    });
  });
});
