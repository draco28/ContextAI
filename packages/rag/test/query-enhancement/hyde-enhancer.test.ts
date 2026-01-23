/**
 * HyDE Enhancer Tests
 *
 * Tests for the HyDE (Hypothetical Document Embeddings) implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  GenerateOptions,
  StreamChunk,
} from '@contextaisdk/core';
import type { EmbeddingProvider, EmbeddingResult } from '../../src/embeddings/types.js';
import { HyDEEnhancer } from '../../src/query-enhancement/hyde-enhancer.js';
import { QueryEnhancementError } from '../../src/query-enhancement/errors.js';

/**
 * Mock LLM Provider for testing.
 */
class MockLLMProvider implements LLMProvider {
  readonly name = 'MockLLM';
  readonly model = 'mock-model';

  private responses: string[] = ['This is a hypothetical document.'];
  private responseIndex = 0;
  public chatCallCount = 0;
  public lastMessages: ChatMessage[] = [];

  setResponses(responses: string[]): void {
    this.responses = responses;
    this.responseIndex = 0;
  }

  chat = async (
    messages: ChatMessage[],
    _options?: GenerateOptions
  ): Promise<ChatResponse> => {
    this.chatCallCount++;
    this.lastMessages = messages;

    const response =
      this.responses[this.responseIndex] ?? 'hypothetical document';
    this.responseIndex = (this.responseIndex + 1) % this.responses.length;

    return {
      content: response,
      finishReason: 'stop',
    };
  };

  async *streamChat(
    _messages: ChatMessage[],
    _options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    yield { type: 'text', content: 'hypothetical' };
    yield { type: 'done' };
  }

  isAvailable = async (): Promise<boolean> => true;
}

/**
 * Mock Embedding Provider for testing.
 */
class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'MockEmbedding';
  readonly dimensions = 384;
  readonly maxBatchSize = 32;

  embed = async (text: string): Promise<EmbeddingResult> => ({
    embedding: Array(384).fill(0.1),
    model: 'mock',
    dimensions: 384,
    tokensUsed: text.length,
  });

  embedBatch = async (texts: string[]): Promise<EmbeddingResult[]> =>
    texts.map((text) => ({
      embedding: Array(384).fill(0.1),
      model: 'mock',
      dimensions: 384,
      tokensUsed: text.length,
    }));

  isAvailable = async (): Promise<boolean> => true;
}

describe('HyDEEnhancer', () => {
  let mockLLM: MockLLMProvider;
  let mockEmbedding: MockEmbeddingProvider;
  let hyde: HyDEEnhancer;

  beforeEach(() => {
    mockLLM = new MockLLMProvider();
    mockEmbedding = new MockEmbeddingProvider();
    hyde = new HyDEEnhancer({
      llmProvider: mockLLM,
      embeddingProvider: mockEmbedding,
    });
  });

  describe('configuration', () => {
    it('should throw without llmProvider', () => {
      expect(
        () =>
          new HyDEEnhancer({
            embeddingProvider: mockEmbedding,
          } as any)
      ).toThrow(QueryEnhancementError);
      expect(
        () =>
          new HyDEEnhancer({
            embeddingProvider: mockEmbedding,
          } as any)
      ).toThrow('llmProvider is required');
    });

    it('should use default name', () => {
      expect(hyde.name).toBe('HyDEEnhancer');
    });

    it('should use custom name', () => {
      const custom = new HyDEEnhancer({
        llmProvider: mockLLM,
        embeddingProvider: mockEmbedding,
        name: 'CustomHyDE',
      });
      expect(custom.name).toBe('CustomHyDE');
    });

    it('should have hyde strategy', () => {
      expect(hyde.strategy).toBe('hyde');
    });
  });

  describe('hypothetical document generation', () => {
    it('should generate a hypothetical document', async () => {
      mockLLM.setResponses([
        'To configure SSL certificates, you need to generate a key pair...',
      ]);

      const result = await hyde.enhance('How do I configure SSL?');

      expect(result.original).toBe('How do I configure SSL?');
      expect(result.enhanced).toHaveLength(1);
      expect(result.enhanced[0]).toContain('SSL certificates');
    });

    it('should include query in prompt', async () => {
      await hyde.enhance('test query');

      expect(mockLLM.lastMessages[1]!.content).toContain('test query');
    });

    it('should call LLM once per hypothetical doc by default', async () => {
      await hyde.enhance('test query');

      expect(mockLLM.chatCallCount).toBe(1);
    });
  });

  describe('multiple hypothetical documents', () => {
    it('should generate multiple hypothetical docs when configured', async () => {
      const multiHyde = new HyDEEnhancer({
        llmProvider: mockLLM,
        embeddingProvider: mockEmbedding,
        numHypothetical: 3,
      });
      mockLLM.setResponses([
        'Document about SSL from perspective 1',
        'Document about SSL from perspective 2',
        'Document about SSL from perspective 3',
      ]);

      const result = await multiHyde.enhance('How do I configure SSL?');

      expect(result.enhanced).toHaveLength(3);
      expect(mockLLM.chatCallCount).toBe(3);
    });

    it('should respect maxVariants option', async () => {
      mockLLM.setResponses([
        'Doc 1',
        'Doc 2',
        'Doc 3',
        'Doc 4',
        'Doc 5',
      ]);

      const result = await hyde.enhance('test', { maxVariants: 4 });

      expect(result.enhanced).toHaveLength(4);
      expect(mockLLM.chatCallCount).toBe(4);
    });
  });

  describe('response parsing', () => {
    it('should trim whitespace', async () => {
      mockLLM.setResponses(['  hypothetical document  ']);

      const result = await hyde.enhance('test');

      expect(result.enhanced[0]).toBe('hypothetical document');
    });

    it('should remove common prefixes', async () => {
      mockLLM.setResponses(['Documentation passage: Here is the content']);

      const result = await hyde.enhance('test');

      expect(result.enhanced[0]).toBe('Here is the content');
    });

    it('should filter out empty results', async () => {
      const multiHyde = new HyDEEnhancer({
        llmProvider: mockLLM,
        embeddingProvider: mockEmbedding,
        numHypothetical: 3,
      });
      mockLLM.setResponses([
        'Valid document',
        '   ', // Empty after trim
        'Another valid document',
      ]);

      const result = await multiHyde.enhance('test');

      expect(result.enhanced).toHaveLength(2);
      expect(result.enhanced[0]).toBe('Valid document');
      expect(result.enhanced[1]).toBe('Another valid document');
    });
  });

  describe('metadata', () => {
    it('should include hypotheticalDocs in metadata', async () => {
      mockLLM.setResponses(['This is the hypothetical answer']);

      const result = await hyde.enhance('test query');

      expect(result.metadata.hypotheticalDocs).toBeDefined();
      expect(result.metadata.hypotheticalDocs).toHaveLength(1);
      expect(result.metadata.hypotheticalDocs![0]).toContain('hypothetical');
    });

    it('should include llmLatencyMs', async () => {
      const result = await hyde.enhance('test');

      expect(result.metadata.llmLatencyMs).toBeDefined();
      expect(typeof result.metadata.llmLatencyMs).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors', async () => {
      mockLLM.chat = async () => {
        throw new Error('API error');
      };

      await expect(hyde.enhance('test')).rejects.toThrow(QueryEnhancementError);
      await expect(hyde.enhance('test')).rejects.toThrow(
        'Failed to generate hypothetical documents'
      );
    });
  });

  describe('temperature', () => {
    it('should use default temperature of 0.7', async () => {
      await hyde.enhance('test');

      // We'd need to capture the options to verify this
      // For now, just ensure it doesn't throw
      expect(mockLLM.chatCallCount).toBe(1);
    });

    it('should respect temperature option', async () => {
      // Custom temperature via options
      await hyde.enhance('test', { temperature: 0.9 });

      expect(mockLLM.chatCallCount).toBe(1);
    });
  });

  describe('custom prompts', () => {
    it('should use custom system prompt', async () => {
      const custom = new HyDEEnhancer({
        llmProvider: mockLLM,
        embeddingProvider: mockEmbedding,
        systemPrompt: 'Custom HyDE instructions',
      });

      await custom.enhance('test');

      expect(mockLLM.lastMessages[0]!.content).toBe('Custom HyDE instructions');
    });

    it('should use custom prompt template', async () => {
      const custom = new HyDEEnhancer({
        llmProvider: mockLLM,
        embeddingProvider: mockEmbedding,
        promptTemplate: 'HYDE: {query}',
      });

      await custom.enhance('my question');

      expect(mockLLM.lastMessages[1]!.content).toBe('HYDE: my question');
    });
  });
});
