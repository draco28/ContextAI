import { describe, it, expect } from 'vitest';
import type { ChatMessage, ToolDefinition, ResponseFormat } from '@contextai/core';
import {
  mapMessages,
  mapMessage,
  mapTools,
  mapResponseFormat,
  buildRequestParams,
} from '../src/message-mapper.js';

describe('message-mapper', () => {
  describe('mapMessage', () => {
    it('should map system message', () => {
      const message: ChatMessage = {
        role: 'system',
        content: 'You are a helpful assistant.',
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'system',
        content: 'You are a helpful assistant.',
      });
    });

    it('should map user message with string content', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello!',
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'user',
        content: 'Hello!',
      });
    });

    it('should map user message with multimodal content', () => {
      const message: ChatMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          { type: 'image', url: 'https://example.com/image.png', detail: 'high' },
        ],
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/image.png',
              detail: 'high',
            },
          },
        ],
      });
    });

    it('should map user message with base64 image', () => {
      const message: ChatMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this.' },
          { type: 'image', base64: 'abc123', mediaType: 'image/jpeg' },
        ],
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this.' },
          {
            type: 'image_url',
            image_url: {
              url: 'data:image/jpeg;base64,abc123',
              detail: 'auto',
            },
          },
        ],
      });
    });

    it('should map assistant message', () => {
      const message: ChatMessage = {
        role: 'assistant',
        content: 'I can help with that!',
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'assistant',
        content: 'I can help with that!',
      });
    });

    it('should map tool message', () => {
      const message: ChatMessage = {
        role: 'tool',
        content: '{"result": 42}',
        toolCallId: 'call_123',
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'tool',
        tool_call_id: 'call_123',
        content: '{"result": 42}',
      });
    });

    it('should extract text from multimodal content', () => {
      const message: ChatMessage = {
        role: 'system',
        content: [
          { type: 'text', text: 'First line.' },
          { type: 'text', text: 'Second line.' },
        ],
      };

      const result = mapMessage(message);

      expect(result).toEqual({
        role: 'system',
        content: 'First line.\nSecond line.',
      });
    });

    it('should skip document content parts', () => {
      const message: ChatMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Read this document.' },
          { type: 'document', url: 'https://example.com/doc.pdf' },
        ],
      };

      const result = mapMessage(message);

      // Document part should be filtered out
      expect(result).toEqual({
        role: 'user',
        content: [{ type: 'text', text: 'Read this document.' }],
      });
    });
  });

  describe('mapMessages', () => {
    it('should map array of messages', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Be helpful.' },
        { role: 'user', content: 'Hi!' },
        { role: 'assistant', content: 'Hello!' },
      ];

      const result = mapMessages(messages);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ role: 'system', content: 'Be helpful.' });
      expect(result[1]).toEqual({ role: 'user', content: 'Hi!' });
      expect(result[2]).toEqual({ role: 'assistant', content: 'Hello!' });
    });
  });

  describe('mapTools', () => {
    it('should map tool definitions to OpenAI format', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'search',
          description: 'Search the web',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
            required: ['query'],
          },
        },
      ];

      const result = mapTools(tools);

      expect(result).toEqual([
        {
          type: 'function',
          function: {
            name: 'search',
            description: 'Search the web',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string' },
              },
              required: ['query'],
            },
          },
        },
      ]);
    });
  });

  describe('mapResponseFormat', () => {
    it('should map text format', () => {
      const format: ResponseFormat = { type: 'text' };
      expect(mapResponseFormat(format)).toEqual({ type: 'text' });
    });

    it('should map json_object format', () => {
      const format: ResponseFormat = { type: 'json_object' };
      expect(mapResponseFormat(format)).toEqual({ type: 'json_object' });
    });

    it('should map json_schema format', () => {
      const format: ResponseFormat = {
        type: 'json_schema',
        jsonSchema: {
          name: 'person',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };

      const result = mapResponseFormat(format);

      expect(result).toEqual({
        type: 'json_schema',
        json_schema: {
          name: 'person',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          strict: true,
        },
      });
    });
  });

  describe('buildRequestParams', () => {
    it('should build basic request params', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const params = buildRequestParams('gpt-4o', messages);

      expect(params).toEqual({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello' }],
      });
    });

    it('should include all generation options', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const options = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
        stopSequences: ['END'],
        seed: 42,
        user: 'user123',
      };

      const params = buildRequestParams('gpt-4o', messages, options);

      expect(params).toMatchObject({
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        stop: ['END'],
        seed: 42,
        user: 'user123',
      });
    });

    it('should include tools when provided', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Search for cats' },
      ];

      const options = {
        tools: [
          {
            name: 'search',
            description: 'Search',
            parameters: { type: 'object' },
          },
        ],
      };

      const params = buildRequestParams('gpt-4o', messages, options);

      expect(params.tools).toBeDefined();
      expect(params.tools?.[0].function.name).toBe('search');
    });

    it('should include response format when provided', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Give JSON' },
      ];

      const options = {
        responseFormat: { type: 'json_object' as const },
      };

      const params = buildRequestParams('gpt-4o', messages, options);

      expect(params.response_format).toEqual({ type: 'json_object' });
    });
  });
});
