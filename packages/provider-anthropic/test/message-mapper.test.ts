/**
 * Tests for message-mapper.ts
 *
 * Tests the mapping from ContextAI ChatMessage format to Anthropic format.
 * Focus areas:
 * - System message extraction (KEY DIFFERENCE from OpenAI)
 * - User/assistant message mapping
 * - Tool result mapping (role: 'user' with tool_result block)
 * - Multimodal content (images)
 * - Tool definition mapping
 */

import { describe, it, expect } from 'vitest';
import type { ChatMessage, ToolDefinition } from '@contextai/core';
import {
  extractSystemMessage,
  mapMessages,
  mapMessage,
  mapContentParts,
  mapTools,
  buildRequestParams,
} from '../src/message-mapper.js';

describe('message-mapper', () => {
  // ==========================================================================
  // extractSystemMessage
  // ==========================================================================

  describe('extractSystemMessage', () => {
    it('should extract a single system message', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ];

      const { system, messages: nonSystem } = extractSystemMessage(messages);

      expect(system).toBe('You are helpful.');
      expect(nonSystem).toHaveLength(1);
      expect(nonSystem[0].role).toBe('user');
    });

    it('should combine multiple system messages', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Be helpful.' },
        { role: 'system', content: 'Be concise.' },
        { role: 'user', content: 'Hi' },
      ];

      const { system, messages: nonSystem } = extractSystemMessage(messages);

      expect(system).toBe('Be helpful.\n\nBe concise.');
      expect(nonSystem).toHaveLength(1);
    });

    it('should return undefined system when no system messages', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ];

      const { system, messages: nonSystem } = extractSystemMessage(messages);

      expect(system).toBeUndefined();
      expect(nonSystem).toHaveLength(2);
    });

    it('should handle system messages with array content', () => {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: [{ type: 'text', text: 'You are helpful.' }],
        },
        { role: 'user', content: 'Hi' },
      ];

      const { system } = extractSystemMessage(messages);

      expect(system).toBe('You are helpful.');
    });

    it('should preserve message order for non-system messages', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'User 1' },
        { role: 'assistant', content: 'Assistant 1' },
        { role: 'user', content: 'User 2' },
      ];

      const { messages: nonSystem } = extractSystemMessage(messages);

      expect(nonSystem).toHaveLength(3);
      expect(nonSystem[0].content).toBe('User 1');
      expect(nonSystem[1].content).toBe('Assistant 1');
      expect(nonSystem[2].content).toBe('User 2');
    });
  });

  // ==========================================================================
  // mapMessage
  // ==========================================================================

  describe('mapMessage', () => {
    describe('user messages', () => {
      it('should map simple text user message', () => {
        const message: ChatMessage = {
          role: 'user',
          content: 'Hello, Claude!',
        };

        const mapped = mapMessage(message);

        expect(mapped).toEqual({
          role: 'user',
          content: 'Hello, Claude!',
        });
      });

      it('should map multimodal user message with text parts', () => {
        const message: ChatMessage = {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'text', text: ' Please explain.' },
          ],
        };

        const mapped = mapMessage(message);

        expect(mapped.role).toBe('user');
        expect(Array.isArray(mapped.content)).toBe(true);
        expect(mapped.content).toHaveLength(2);
      });
    });

    describe('assistant messages', () => {
      it('should map simple assistant message', () => {
        const message: ChatMessage = {
          role: 'assistant',
          content: 'Hello! How can I help?',
        };

        const mapped = mapMessage(message);

        expect(mapped).toEqual({
          role: 'assistant',
          content: 'Hello! How can I help?',
        });
      });

      it('should map assistant message with tool calls', () => {
        const message: ChatMessage & {
          toolCalls: Array<{
            id: string;
            name: string;
            arguments: Record<string, unknown>;
          }>;
        } = {
          role: 'assistant',
          content: 'Let me search for that.',
          toolCalls: [
            {
              id: 'tool_123',
              name: 'search',
              arguments: { query: 'weather' },
            },
          ],
        };

        const mapped = mapMessage(message);

        expect(mapped.role).toBe('assistant');
        expect(Array.isArray(mapped.content)).toBe(true);
        const content = mapped.content as Array<{ type: string }>;
        expect(content).toHaveLength(2);
        expect(content[0].type).toBe('text');
        expect(content[1].type).toBe('tool_use');
      });
    });

    describe('tool result messages', () => {
      it('should map tool result to user message with tool_result block', () => {
        const message: ChatMessage = {
          role: 'tool',
          content: '{"temperature": 72}',
          toolCallId: 'tool_123',
        };

        const mapped = mapMessage(message);

        // KEY: Anthropic uses role: 'user' for tool results!
        expect(mapped.role).toBe('user');
        expect(Array.isArray(mapped.content)).toBe(true);
        const content = mapped.content as Array<{
          type: string;
          tool_use_id?: string;
          content?: string;
        }>;
        expect(content[0].type).toBe('tool_result');
        expect(content[0].tool_use_id).toBe('tool_123');
        expect(content[0].content).toBe('{"temperature": 72}');
      });
    });
  });

  // ==========================================================================
  // mapMessages
  // ==========================================================================

  describe('mapMessages', () => {
    it('should map array of messages', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' },
      ];

      const mapped = mapMessages(messages);

      expect(mapped).toHaveLength(3);
      expect(mapped[0].role).toBe('user');
      expect(mapped[1].role).toBe('assistant');
      expect(mapped[2].role).toBe('user');
    });
  });

  // ==========================================================================
  // mapContentParts
  // ==========================================================================

  describe('mapContentParts', () => {
    it('should map text content parts', () => {
      const parts = [
        { type: 'text' as const, text: 'Hello' },
        { type: 'text' as const, text: 'World' },
      ];

      const mapped = mapContentParts(parts);

      expect(mapped).toHaveLength(2);
      expect(mapped[0]).toEqual({ type: 'text', text: 'Hello' });
      expect(mapped[1]).toEqual({ type: 'text', text: 'World' });
    });

    it('should map base64 image content', () => {
      const parts = [
        {
          type: 'image' as const,
          base64: 'iVBORw0KGgo=',
          mediaType: 'image/png',
        },
      ];

      const mapped = mapContentParts(parts);

      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: 'iVBORw0KGgo=',
        },
      });
    });

    it('should map URL image content', () => {
      const parts = [
        {
          type: 'image' as const,
          url: 'https://example.com/image.png',
        },
      ];

      const mapped = mapContentParts(parts);

      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual({
        type: 'image',
        source: {
          type: 'url',
          url: 'https://example.com/image.png',
        },
      });
    });

    it('should skip unsupported image media types', () => {
      const parts = [
        {
          type: 'image' as const,
          base64: 'data',
          mediaType: 'image/bmp', // Not supported
        },
      ];

      const mapped = mapContentParts(parts);

      expect(mapped).toHaveLength(0);
    });

    it('should handle mixed content parts', () => {
      const parts = [
        { type: 'text' as const, text: 'Check this image:' },
        {
          type: 'image' as const,
          base64: 'abc123',
          mediaType: 'image/jpeg',
        },
        { type: 'text' as const, text: 'What do you see?' },
      ];

      const mapped = mapContentParts(parts);

      expect(mapped).toHaveLength(3);
      expect(mapped[0].type).toBe('text');
      expect(mapped[1].type).toBe('image');
      expect(mapped[2].type).toBe('text');
    });
  });

  // ==========================================================================
  // mapTools
  // ==========================================================================

  describe('mapTools', () => {
    it('should map tool definitions to Anthropic format', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'get_weather',
          description: 'Get the current weather',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
            required: ['location'],
          },
        },
      ];

      const mapped = mapTools(tools);

      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toEqual({
        name: 'get_weather',
        description: 'Get the current weather',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        },
      });
    });

    it('should map multiple tools', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool_a',
          description: 'Tool A',
          parameters: { type: 'object' },
        },
        {
          name: 'tool_b',
          description: 'Tool B',
          parameters: { type: 'object' },
        },
      ];

      const mapped = mapTools(tools);

      expect(mapped).toHaveLength(2);
      expect(mapped[0].name).toBe('tool_a');
      expect(mapped[1].name).toBe('tool_b');
    });
  });

  // ==========================================================================
  // buildRequestParams
  // ==========================================================================

  describe('buildRequestParams', () => {
    it('should build basic request params', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const params = buildRequestParams('claude-sonnet-4-20250514', messages);

      expect(params.model).toBe('claude-sonnet-4-20250514');
      expect(params.messages).toHaveLength(1);
      expect(params.max_tokens).toBe(4096); // Default
      expect(params.system).toBeUndefined();
    });

    it('should extract system message to separate param', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Be helpful.' },
        { role: 'user', content: 'Hi' },
      ];

      const params = buildRequestParams('claude-sonnet-4-20250514', messages);

      expect(params.system).toBe('Be helpful.');
      expect(params.messages).toHaveLength(1);
      expect(params.messages[0].role).toBe('user');
    });

    it('should map generation options', () => {
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hi' }];
      const options = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        topK: 40,
        stopSequences: ['END'],
      };

      const params = buildRequestParams('claude-sonnet-4-20250514', messages, options);

      expect(params.temperature).toBe(0.7);
      expect(params.max_tokens).toBe(1000);
      expect(params.top_p).toBe(0.9);
      expect(params.top_k).toBe(40);
      expect(params.stop_sequences).toEqual(['END']);
    });

    it('should map tools when provided', () => {
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hi' }];
      const options = {
        tools: [
          {
            name: 'search',
            description: 'Search the web',
            parameters: { type: 'object' },
          },
        ],
      };

      const params = buildRequestParams('claude-sonnet-4-20250514', messages, options);

      expect(params.tools).toHaveLength(1);
      expect(params.tools![0].name).toBe('search');
    });

    it('should enable extended thinking when configured', () => {
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hi' }];
      const options = {
        thinking: {
          enabled: true,
          budgetTokens: 5000,
        },
      };

      const params = buildRequestParams('claude-sonnet-4-20250514', messages, options);

      expect((params as Record<string, unknown>).thinking).toEqual({
        type: 'enabled',
        budget_tokens: 5000,
      });
    });
  });
});
