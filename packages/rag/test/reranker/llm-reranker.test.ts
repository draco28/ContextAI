/**
 * LLM Reranker Tests
 *
 * Tests for LLM-based reranking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LLMProvider, ChatMessage, ChatResponse, GenerateOptions, StreamChunk } from '@contextai/core';
import type { RetrievalResult } from '../../src/retrieval/types.js';
import { LLMReranker } from '../../src/reranker/llm-reranker.js';
import { RerankerError } from '../../src/reranker/errors.js';

// Mock LLM Provider
class MockLLMProvider implements LLMProvider {
  readonly name = 'MockLLM';
  readonly model = 'mock-model';

  private responses: string[] = [];
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

    const response = this.responses[this.responseIndex] ?? '5';
    this.responseIndex = (this.responseIndex + 1) % Math.max(1, this.responses.length);

    return {
      content: response,
      finishReason: 'stop',
    };
  };

  async *streamChat(
    _messages: ChatMessage[],
    _options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    yield { type: 'text', content: '5' };
    yield { type: 'done' };
  }

  isAvailable = async (): Promise<boolean> => true;
}

// Helper to create mock retrieval results
function createMockResults(count: number): RetrievalResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    chunk: {
      id: `chunk-${i}`,
      content: `Content for chunk ${i}. This is a document about topic ${i}.`,
      metadata: { source: `source-${i}` },
    },
    score: (count - i) / count,
  }));
}

describe('LLMReranker', () => {
  let mockProvider: MockLLMProvider;
  let reranker: LLMReranker;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    reranker = new LLMReranker({ llmProvider: mockProvider });
  });

  describe('configuration', () => {
    it('should throw without llmProvider', () => {
      expect(() => new LLMReranker({} as any)).toThrow(RerankerError);
      expect(() => new LLMReranker({} as any)).toThrow('llmProvider is required');
    });

    it('should use custom name', () => {
      const custom = new LLMReranker({
        llmProvider: mockProvider,
        name: 'CustomReranker',
      });
      expect(custom.name).toBe('CustomReranker');
    });

    it('should use default name', () => {
      expect(reranker.name).toBe('LLMReranker');
    });
  });

  describe('individual scoring', () => {
    it('should score each document individually', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['8', '6', '9']);

      const reranked = await reranker.rerank('What is the best topic?', results);

      expect(reranked).toHaveLength(3);
      expect(mockProvider.chatCallCount).toBe(3); // One call per document
    });

    it('should sort by LLM score descending', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['3', '9', '6']); // Second doc gets highest score

      const reranked = await reranker.rerank('query', results);

      // Should be sorted by score: 9 (chunk-1), 6 (chunk-2), 3 (chunk-0)
      expect(reranked[0]!.id).toBe('chunk-1'); // Score 9
      expect(reranked[1]!.id).toBe('chunk-2'); // Score 6
      expect(reranked[2]!.id).toBe('chunk-0'); // Score 3
    });

    it('should normalize scores to 0-1 range', async () => {
      const results = createMockResults(2);
      mockProvider.setResponses(['10', '5']);

      const reranked = await reranker.rerank('query', results);

      // 10/10 = 1.0, 5/10 = 0.5
      expect(reranked[0]!.score).toBe(1.0);
      expect(reranked[1]!.score).toBe(0.5);
    });

    it('should include query and document in prompt', async () => {
      const results = createMockResults(1);
      mockProvider.setResponses(['7']);

      await reranker.rerank('my search query', results);

      const userMessage = mockProvider.lastMessages.find((m) => m.role === 'user');
      expect(userMessage?.content).toContain('my search query');
      expect(userMessage?.content).toContain('Content for chunk 0');
    });
  });

  describe('concurrency control', () => {
    it('should respect concurrency option', async () => {
      const results = createMockResults(10);
      mockProvider.setResponses(Array(10).fill('5'));

      // Track when each call completes
      let activeCalls = 0;
      let maxActiveCalls = 0;
      const originalChat = mockProvider.chat;

      mockProvider.chat = async (...args) => {
        activeCalls++;
        maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
        const result = await originalChat(...args);
        activeCalls--;
        return result;
      };

      await reranker.rerank('query', results, { concurrency: 3 });

      expect(maxActiveCalls).toBeLessThanOrEqual(3);
    });

    it('should use default concurrency', async () => {
      const results = createMockResults(10);
      mockProvider.setResponses(Array(10).fill('5'));

      // Should complete without error with default concurrency
      const reranked = await reranker.rerank('query', results);
      expect(reranked).toHaveLength(10);
    });
  });

  describe('batch mode', () => {
    it('should score all documents in one call when batchMode=true', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['[8, 6, 9]']);

      const reranked = await reranker.rerank('query', results, { batchMode: true });

      expect(reranked).toHaveLength(3);
      expect(mockProvider.chatCallCount).toBe(1); // Single batch call
    });

    it('should parse JSON array response', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['[10, 5, 7]']);

      const reranked = await reranker.rerank('query', results, { batchMode: true });

      // Should be sorted: 10 (chunk-0), 7 (chunk-2), 5 (chunk-1)
      expect(reranked[0]!.id).toBe('chunk-0');
      expect(reranked[1]!.id).toBe('chunk-2');
      expect(reranked[2]!.id).toBe('chunk-1');
    });

    it('should handle malformed batch response', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['not a valid json']);

      // Should fall back to default scores
      const reranked = await reranker.rerank('query', results, { batchMode: true });

      expect(reranked).toHaveLength(3);
      // All should have default score (5/10 = 0.5)
      reranked.forEach((r) => {
        expect(r.score).toBe(0.5);
      });
    });
  });

  describe('score parsing', () => {
    it('should parse integer scores', async () => {
      const results = createMockResults(1);
      mockProvider.setResponses(['8']);

      const reranked = await reranker.rerank('query', results);
      expect(reranked[0]!.scores.relevanceScore).toBe(8);
    });

    it('should parse decimal scores', async () => {
      const results = createMockResults(1);
      mockProvider.setResponses(['7.5']);

      const reranked = await reranker.rerank('query', results);
      expect(reranked[0]!.scores.relevanceScore).toBe(7.5);
    });

    it('should extract score from verbose response', async () => {
      const results = createMockResults(1);
      mockProvider.setResponses(['Based on my analysis, I rate this document 8 out of 10.']);

      const reranked = await reranker.rerank('query', results);
      expect(reranked[0]!.scores.relevanceScore).toBe(8);
    });

    it('should clamp scores to 0-10 range', async () => {
      const results = createMockResults(2);
      mockProvider.setResponses(['15', '-5']); // Out of range

      const reranked = await reranker.rerank('query', results);

      // 15 should be clamped to 10, -5 to 0
      const scores = reranked.map((r) => r.scores.relevanceScore);
      expect(scores).toContain(10);
      expect(scores).toContain(0);
    });

    it('should default to 5 for unparseable scores', async () => {
      const results = createMockResults(1);
      mockProvider.setResponses(['completely invalid response with no numbers']);

      const reranked = await reranker.rerank('query', results);
      expect(reranked[0]!.scores.relevanceScore).toBe(5);
    });
  });

  describe('custom prompts', () => {
    it('should use custom prompt template', async () => {
      const customReranker = new LLMReranker({
        llmProvider: mockProvider,
        promptTemplate: 'CUSTOM: {query} vs {document}',
      });

      const results = createMockResults(1);
      mockProvider.setResponses(['7']);

      await customReranker.rerank('my query', results);

      const userMessage = mockProvider.lastMessages.find((m) => m.role === 'user');
      expect(userMessage?.content).toContain('CUSTOM:');
      expect(userMessage?.content).toContain('my query');
    });

    it('should use custom system prompt', async () => {
      const customReranker = new LLMReranker({
        llmProvider: mockProvider,
        systemPrompt: 'You are a custom judge.',
      });

      const results = createMockResults(1);
      mockProvider.setResponses(['7']);

      await customReranker.rerank('query', results);

      const systemMessage = mockProvider.lastMessages.find((m) => m.role === 'system');
      expect(systemMessage?.content).toBe('You are a custom judge.');
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors', async () => {
      mockProvider.chat = async () => {
        throw new Error('API rate limit exceeded');
      };

      const results = createMockResults(1);

      await expect(reranker.rerank('query', results)).rejects.toThrow(RerankerError);
      await expect(reranker.rerank('query', results)).rejects.toThrow('rate limit');
    });

    it('should handle empty results', async () => {
      const reranked = await reranker.rerank('query', []);
      expect(reranked).toEqual([]);
    });
  });

  describe('score breakdown', () => {
    it('should include original and reranker scores', async () => {
      const results = createMockResults(2);
      mockProvider.setResponses(['8', '6']);

      const reranked = await reranker.rerank('query', results);

      reranked.forEach((r) => {
        expect(r.scores.originalScore).toBeDefined();
        expect(r.scores.rerankerScore).toBeDefined();
        expect(r.scores.relevanceScore).toBeDefined(); // Raw 0-10 score
      });
    });

    it('should track rank changes', async () => {
      const results = createMockResults(3);
      // Give lowest original score the highest LLM score
      mockProvider.setResponses(['3', '5', '9']);

      const reranked = await reranker.rerank('query', results);

      // chunk-2 had originalRank 3 but should have newRank 1
      const promoted = reranked.find((r) => r.id === 'chunk-2');
      expect(promoted?.originalRank).toBe(3);
      expect(promoted?.newRank).toBe(1);
    });
  });

  describe('options', () => {
    it('should respect topK option', async () => {
      const results = createMockResults(10);
      mockProvider.setResponses(Array(10).fill('5'));

      const reranked = await reranker.rerank('query', results, { topK: 3 });

      expect(reranked).toHaveLength(3);
    });

    it('should respect minScore option', async () => {
      const results = createMockResults(3);
      mockProvider.setResponses(['9', '2', '7']); // 0.9, 0.2, 0.7 after normalization

      const reranked = await reranker.rerank('query', results, { minScore: 0.5 });

      // Only scores >= 0.5 should pass (9/10 and 7/10)
      expect(reranked.length).toBe(2);
    });
  });
});
