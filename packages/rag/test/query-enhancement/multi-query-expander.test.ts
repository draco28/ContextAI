/**
 * Multi-Query Expander Tests
 *
 * Tests for the MultiQueryExpander implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  GenerateOptions,
  StreamChunk,
} from '@contextaisdk/core';
import { MultiQueryExpander } from '../../src/query-enhancement/multi-query-expander.js';
import { QueryEnhancementError } from '../../src/query-enhancement/errors.js';

/**
 * Mock LLM Provider for testing.
 */
class MockLLMProvider implements LLMProvider {
  readonly name = 'MockLLM';
  readonly model = 'mock-model';

  private response = 'variant 1\nvariant 2\nvariant 3';
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

describe('MultiQueryExpander', () => {
  let mockProvider: MockLLMProvider;
  let expander: MultiQueryExpander;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    expander = new MultiQueryExpander({ llmProvider: mockProvider });
  });

  describe('configuration', () => {
    it('should throw without llmProvider', () => {
      expect(() => new MultiQueryExpander({} as any)).toThrow(
        QueryEnhancementError
      );
      expect(() => new MultiQueryExpander({} as any)).toThrow(
        'llmProvider is required'
      );
    });

    it('should use default name', () => {
      expect(expander.name).toBe('MultiQueryExpander');
    });

    it('should use custom name', () => {
      const custom = new MultiQueryExpander({
        llmProvider: mockProvider,
        name: 'CustomExpander',
      });
      expect(custom.name).toBe('CustomExpander');
    });

    it('should have multi-query strategy', () => {
      expect(expander.strategy).toBe('multi-query');
    });
  });

  describe('query expansion', () => {
    it('should expand query into variants', async () => {
      mockProvider.setResponse(
        'AWS deployment tutorial\nEC2 instance setup\nCloud infrastructure guide'
      );

      const result = await expander.enhance('How do I deploy to AWS?');

      expect(result.original).toBe('How do I deploy to AWS?');
      expect(result.enhanced).toHaveLength(3);
      expect(result.enhanced[0]).toBe('AWS deployment tutorial');
      expect(result.strategy).toBe('multi-query');
    });

    it('should include query and numVariants in prompt', async () => {
      await expander.enhance('test query');

      expect(mockProvider.lastMessages[1]!.content).toContain('test query');
      expect(mockProvider.lastMessages[1]!.content).toContain('3'); // default numVariants
    });

    it('should call LLM once for all variants', async () => {
      await expander.enhance('test');

      expect(mockProvider.chatCallCount).toBe(1);
    });
  });

  describe('variant count', () => {
    it('should use default of 3 variants', async () => {
      mockProvider.setResponse('variant one\nvariant two\nvariant three\nvariant four\nvariant five');

      const result = await expander.enhance('test query');

      expect(result.enhanced).toHaveLength(3);
    });

    it('should respect configured numVariants', async () => {
      const custom = new MultiQueryExpander({
        llmProvider: mockProvider,
        numVariants: 5,
      });
      mockProvider.setResponse('variant one\nvariant two\nvariant three\nvariant four\nvariant five');

      const result = await custom.enhance('test query');

      expect(result.enhanced).toHaveLength(5);
    });

    it('should respect maxVariants option', async () => {
      mockProvider.setResponse('variant one\nvariant two\nvariant three\nvariant four\nvariant five');

      const result = await expander.enhance('test query', { maxVariants: 4 });

      expect(result.enhanced).toHaveLength(4);
    });

    it('should handle fewer variants than requested', async () => {
      mockProvider.setResponse('variant one\nvariant two'); // Only 2 variants

      const result = await expander.enhance('test query');

      expect(result.enhanced).toHaveLength(2);
    });
  });

  describe('response parsing', () => {
    it('should remove numbering', async () => {
      mockProvider.setResponse('1. first query\n2. second query\n3. third query');

      const result = await expander.enhance('test');

      expect(result.enhanced[0]).toBe('first query');
      expect(result.enhanced[1]).toBe('second query');
    });

    it('should remove bullet points', async () => {
      mockProvider.setResponse('- first variant\n* second variant\n• third variant');

      const result = await expander.enhance('test query');

      expect(result.enhanced[0]).toBe('first variant');
      expect(result.enhanced[1]).toBe('second variant');
    });

    it('should remove quotes', async () => {
      mockProvider.setResponse('"query one"\n\'query two\'\nquery three');

      const result = await expander.enhance('test');

      expect(result.enhanced[0]).toBe('query one');
      expect(result.enhanced[1]).toBe('query two');
    });

    it('should deduplicate variants', async () => {
      mockProvider.setResponse('same query\nsame query\ndifferent query');

      const result = await expander.enhance('test');

      expect(result.enhanced).toContain('same query');
      expect(result.enhanced.filter((v) => v === 'same query').length).toBe(1);
    });

    it('should filter out original query if included', async () => {
      mockProvider.setResponse('test\nvariant one\nvariant two');

      const result = await expander.enhance('test');

      expect(result.enhanced).not.toContain('test');
    });

    it('should filter out very short variants', async () => {
      mockProvider.setResponse('ab\nproper variant\nx');

      const result = await expander.enhance('test');

      expect(result.enhanced).not.toContain('ab');
      expect(result.enhanced).not.toContain('x');
      expect(result.enhanced).toContain('proper variant');
    });

    it('should handle common prefixes', async () => {
      mockProvider.setResponse(
        'Query: variant one\nAlternative: variant two\nVariant: variant three'
      );

      const result = await expander.enhance('test');

      expect(result.enhanced[0]).toBe('variant one');
      expect(result.enhanced[1]).toBe('variant two');
    });
  });

  describe('temperature', () => {
    it('should use default temperature of 0.5', async () => {
      await expander.enhance('test');

      expect(mockProvider.lastOptions?.temperature).toBe(0.5);
    });

    it('should respect configured temperature', async () => {
      const custom = new MultiQueryExpander({
        llmProvider: mockProvider,
        temperature: 0.8,
      });

      await custom.enhance('test');

      expect(mockProvider.lastOptions?.temperature).toBe(0.8);
    });

    it('should respect temperature option', async () => {
      await expander.enhance('test', { temperature: 0.9 });

      expect(mockProvider.lastOptions?.temperature).toBe(0.9);
    });
  });

  describe('custom prompts', () => {
    it('should use custom system prompt', async () => {
      const custom = new MultiQueryExpander({
        llmProvider: mockProvider,
        systemPrompt: 'Custom expansion instructions',
      });

      await custom.enhance('test');

      expect(mockProvider.lastMessages[0]!.content).toBe(
        'Custom expansion instructions'
      );
    });

    it('should use custom prompt template', async () => {
      const custom = new MultiQueryExpander({
        llmProvider: mockProvider,
        promptTemplate: 'EXPAND ({numVariants}): {query}',
      });

      await custom.enhance('my query');

      expect(mockProvider.lastMessages[1]!.content).toBe('EXPAND (3): my query');
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors', async () => {
      mockProvider.chat = async () => {
        throw new Error('API timeout');
      };

      await expect(expander.enhance('test')).rejects.toThrow(
        QueryEnhancementError
      );
      await expect(expander.enhance('test')).rejects.toThrow(
        'Failed to expand query'
      );
    });
  });

  describe('metadata', () => {
    it('should include llmLatencyMs', async () => {
      const result = await expander.enhance('test');

      expect(result.metadata.llmLatencyMs).toBeDefined();
      expect(typeof result.metadata.llmLatencyMs).toBe('number');
    });

    it('should not mark as skipped', async () => {
      const result = await expander.enhance('test query');

      expect(result.metadata.skipped).toBe(false);
    });
  });
});
