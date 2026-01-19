/**
 * Query Rewriter Tests
 *
 * Tests for the QueryRewriter implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  GenerateOptions,
  StreamChunk,
} from '@contextai/core';
import { QueryRewriter } from '../../src/query-enhancement/query-rewriter.js';
import { QueryEnhancementError } from '../../src/query-enhancement/errors.js';

/**
 * Mock LLM Provider for testing.
 */
class MockLLMProvider implements LLMProvider {
  readonly name = 'MockLLM';
  readonly model = 'mock-model';

  private response = 'rewritten query';
  public chatCallCount = 0;
  public lastMessages: ChatMessage[] = [];
  public lastOptions: GenerateOptions | undefined;

  setResponse(response: string): void {
    this.response = response;
  }

  chat = async (
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<ChatResponse> => {
    this.chatCallCount++;
    this.lastMessages = messages;
    this.lastOptions = options;

    return {
      content: this.response,
      finishReason: 'stop',
    };
  };

  async *streamChat(
    _messages: ChatMessage[],
    _options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    yield { type: 'text', content: this.response };
    yield { type: 'done' };
  }

  isAvailable = async (): Promise<boolean> => true;
}

describe('QueryRewriter', () => {
  let mockProvider: MockLLMProvider;
  let rewriter: QueryRewriter;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    rewriter = new QueryRewriter({ llmProvider: mockProvider });
  });

  describe('configuration', () => {
    it('should throw without llmProvider', () => {
      expect(() => new QueryRewriter({} as any)).toThrow(QueryEnhancementError);
      expect(() => new QueryRewriter({} as any)).toThrow(
        'llmProvider is required'
      );
    });

    it('should use default name', () => {
      expect(rewriter.name).toBe('QueryRewriter');
    });

    it('should use custom name', () => {
      const custom = new QueryRewriter({
        llmProvider: mockProvider,
        name: 'CustomRewriter',
      });
      expect(custom.name).toBe('CustomRewriter');
    });

    it('should have rewrite strategy', () => {
      expect(rewriter.strategy).toBe('rewrite');
    });
  });

  describe('basic rewriting', () => {
    it('should rewrite a query', async () => {
      mockProvider.setResponse('How do I reset my password?');

      const result = await rewriter.enhance('hw do i reset pasword');

      expect(result.original).toBe('hw do i reset pasword');
      expect(result.enhanced).toHaveLength(1);
      expect(result.enhanced[0]).toBe('How do I reset my password?');
      expect(result.strategy).toBe('rewrite');
    });

    it('should call LLM with correct messages', async () => {
      mockProvider.setResponse('rewritten');

      await rewriter.enhance('test query');

      expect(mockProvider.lastMessages).toHaveLength(2);
      expect(mockProvider.lastMessages[0]!.role).toBe('system');
      expect(mockProvider.lastMessages[1]!.role).toBe('user');
      expect(mockProvider.lastMessages[1]!.content).toContain('test query');
    });

    it('should use default temperature', async () => {
      mockProvider.setResponse('rewritten');

      await rewriter.enhance('test');

      expect(mockProvider.lastOptions?.temperature).toBe(0.3);
    });

    it('should respect temperature option', async () => {
      mockProvider.setResponse('rewritten');

      await rewriter.enhance('test', { temperature: 0.8 });

      expect(mockProvider.lastOptions?.temperature).toBe(0.8);
    });
  });

  describe('response parsing', () => {
    it('should strip common prefixes', async () => {
      mockProvider.setResponse('Rewritten query: cleaned up query');

      const result = await rewriter.enhance('test');

      expect(result.enhanced[0]).toBe('cleaned up query');
    });

    it('should remove surrounding quotes', async () => {
      mockProvider.setResponse('"How do I reset my password?"');

      const result = await rewriter.enhance('test');

      expect(result.enhanced[0]).toBe('How do I reset my password?');
    });

    it('should handle single quotes', async () => {
      mockProvider.setResponse("'cleaned query'");

      const result = await rewriter.enhance('test');

      expect(result.enhanced[0]).toBe('cleaned query');
    });

    it('should fall back to original on empty response', async () => {
      mockProvider.setResponse('   ');

      const result = await rewriter.enhance('original query');

      expect(result.enhanced[0]).toBe('original query');
    });

    it('should handle verbose responses', async () => {
      mockProvider.setResponse(
        'Here is the rewritten query: How do I configure SSL?'
      );

      const result = await rewriter.enhance('test');

      expect(result.enhanced[0]).toBe('How do I configure SSL?');
    });
  });

  describe('custom prompts', () => {
    it('should use custom prompt template', async () => {
      const custom = new QueryRewriter({
        llmProvider: mockProvider,
        promptTemplate: 'CUSTOM: {query}',
      });
      mockProvider.setResponse('rewritten');

      await custom.enhance('my query');

      expect(mockProvider.lastMessages[1]!.content).toContain('CUSTOM:');
      expect(mockProvider.lastMessages[1]!.content).toContain('my query');
    });

    it('should use custom system prompt', async () => {
      const custom = new QueryRewriter({
        llmProvider: mockProvider,
        systemPrompt: 'Custom system instructions',
      });
      mockProvider.setResponse('rewritten');

      await custom.enhance('test');

      expect(mockProvider.lastMessages[0]!.content).toBe(
        'Custom system instructions'
      );
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors', async () => {
      mockProvider.chat = async () => {
        throw new Error('API rate limit');
      };

      await expect(rewriter.enhance('test')).rejects.toThrow(
        QueryEnhancementError
      );
      await expect(rewriter.enhance('test')).rejects.toThrow('rate limit');
    });
  });

  describe('metadata', () => {
    it('should include llmLatencyMs', async () => {
      mockProvider.setResponse('rewritten');

      const result = await rewriter.enhance('test');

      expect(result.metadata.llmLatencyMs).toBeDefined();
      expect(typeof result.metadata.llmLatencyMs).toBe('number');
    });

    it('should not set skipped for successful rewrites', async () => {
      mockProvider.setResponse('rewritten');

      const result = await rewriter.enhance('test query');

      expect(result.metadata.skipped).toBe(false);
    });
  });
});
