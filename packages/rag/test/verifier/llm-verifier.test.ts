/**
 * LLM Verifier Tests
 *
 * Tests for LLM-based document relevance verification.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  GenerateOptions,
  StreamChunk,
} from '@contextaisdk/core';
import type { RetrievalResult, ConfidenceScore } from '../../src/retrieval/types.js';
import { LLMVerifier } from '../../src/verifier/llm-verifier.js';
import { VerifierError } from '../../src/verifier/errors.js';

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

    const response =
      this.responses[this.responseIndex] ?? '{"verified": true, "score": 5}';
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
    yield { type: 'text', content: '{"verified": true, "score": 5}' };
    yield { type: 'done' };
  }

  isAvailable = async (): Promise<boolean> => true;

  reset(): void {
    this.chatCallCount = 0;
    this.responseIndex = 0;
  }
}

// Helper to create mock retrieval results with optional confidence
function createMockResults(
  count: number,
  confidences?: number[]
): RetrievalResult[] {
  return Array.from({ length: count }, (_, i) => {
    const confidence = confidences?.[i];
    const result: RetrievalResult = {
      id: `chunk-${i}`,
      chunk: {
        id: `chunk-${i}`,
        content: `Content for chunk ${i}. This document discusses topic ${i} in detail.`,
        metadata: { source: `source-${i}` },
      },
      score: (count - i) / count,
    };

    if (confidence !== undefined) {
      result.confidence = {
        overall: confidence,
        signals: { vectorSimilarity: confidence },
        factors: {
          rankAgreement: confidence,
          scoreConsistency: 1.0,
          signalCount: 1,
          multiSignalPresence: false,
        },
      };
    }

    return result;
  });
}

describe('LLMVerifier', () => {
  let mockProvider: MockLLMProvider;
  let verifier: LLMVerifier;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    verifier = new LLMVerifier({ llmProvider: mockProvider });
  });

  describe('configuration', () => {
    it('should throw without llmProvider', () => {
      expect(() => new LLMVerifier({} as any)).toThrow(VerifierError);
      expect(() => new LLMVerifier({} as any)).toThrow('llmProvider is required');
    });

    it('should use custom name', () => {
      const custom = new LLMVerifier({
        llmProvider: mockProvider,
        name: 'CustomVerifier',
      });
      expect(custom.name).toBe('CustomVerifier');
    });

    it('should use default name', () => {
      expect(verifier.name).toBe('LLMVerifier');
    });

    it('should allow custom verification threshold', () => {
      const custom = new LLMVerifier({
        llmProvider: mockProvider,
        verificationThreshold: 8, // Stricter threshold
      });
      expect(custom.name).toBe('LLMVerifier');
    });
  });

  describe('confidence-based categorization', () => {
    it('should skip verification for high confidence results', async () => {
      // All results have confidence >= 0.8 (default skipThreshold)
      const results = createMockResults(3, [0.9, 0.85, 0.95]);

      const verified = await verifier.verify('query', results);

      // No LLM calls should be made
      expect(mockProvider.chatCallCount).toBe(0);
      // All should be auto-verified
      verified.forEach((r) => {
        expect(r.verification?.verified).toBe(true);
        expect(r.verification?.verificationScore).toBe(10);
      });
    });

    it('should filter out low confidence results', async () => {
      // All results have confidence < 0.3 (default filterThreshold)
      const results = createMockResults(3, [0.1, 0.2, 0.25]);

      const verified = await verifier.verify('query', results);

      // No LLM calls should be made
      expect(mockProvider.chatCallCount).toBe(0);
      // All should be auto-rejected
      verified.forEach((r) => {
        expect(r.verification?.verified).toBe(false);
        expect(r.verification?.verificationScore).toBe(0);
      });
    });

    it('should verify mid-confidence results with LLM', async () => {
      // All results have mid-range confidence (0.3-0.8)
      const results = createMockResults(3, [0.5, 0.6, 0.4]);
      mockProvider.setResponses([
        '{"verified": true, "score": 8}',
        '{"verified": false, "score": 3}',
        '{"verified": true, "score": 7}',
      ]);

      const verified = await verifier.verify('query', results);

      // All 3 should trigger LLM calls
      expect(mockProvider.chatCallCount).toBe(3);
      // Verify based on LLM response
      expect(verified[0]!.verification?.verified).toBe(true);
      expect(verified[1]!.verification?.verified).toBe(false);
      expect(verified[2]!.verification?.verified).toBe(true);
    });

    it('should handle mixed confidence levels', async () => {
      // Mix of high, mid, and low confidence
      const results = createMockResults(5, [0.9, 0.5, 0.1, 0.7, 0.2]);
      mockProvider.setResponses([
        '{"verified": true, "score": 8}', // For 0.5
        '{"verified": true, "score": 7}', // For 0.7
      ]);

      const verified = await verifier.verify('query', results);

      // Only 2 LLM calls for mid-confidence (0.5, 0.7)
      expect(mockProvider.chatCallCount).toBe(2);

      // High confidence (0.9) - auto-verified
      expect(verified[0]!.verification?.verified).toBe(true);
      expect(verified[0]!.verification?.verificationScore).toBe(10);

      // Mid confidence (0.5, 0.7) - LLM verified
      expect(verified[1]!.verification?.verified).toBe(true);
      expect(verified[3]!.verification?.verified).toBe(true);

      // Low confidence (0.1, 0.2) - auto-rejected
      expect(verified[2]!.verification?.verified).toBe(false);
      expect(verified[4]!.verification?.verified).toBe(false);
    });

    it('should use default confidence (0.5) when missing', async () => {
      // Results without confidence scores
      const results = createMockResults(2); // No confidences provided
      mockProvider.setResponses([
        '{"verified": true, "score": 8}',
        '{"verified": true, "score": 7}',
      ]);

      const verified = await verifier.verify('query', results);

      // Both should be treated as mid-confidence and verified
      expect(mockProvider.chatCallCount).toBe(2);
    });

    it('should respect custom thresholds', async () => {
      const results = createMockResults(3, [0.7, 0.5, 0.2]);
      mockProvider.setResponses(['{"verified": true, "score": 8}']);

      const verified = await verifier.verify('query', results, {
        skipThreshold: 0.6, // Lower threshold - 0.7 will be skipped
        filterThreshold: 0.4, // Higher threshold - 0.2 will be filtered
      });

      // Only 0.5 should trigger LLM (between 0.4 and 0.6)
      expect(mockProvider.chatCallCount).toBe(1);
    });
  });

  describe('individual verification', () => {
    it('should include query and document in prompt', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8}']);

      await verifier.verify('my search query', results);

      const userMessage = mockProvider.lastMessages.find((m) => m.role === 'user');
      expect(userMessage?.content).toContain('my search query');
      expect(userMessage?.content).toContain('Content for chunk 0');
    });

    it('should respect concurrency limit', async () => {
      const results = createMockResults(10, Array(10).fill(0.5));
      mockProvider.setResponses(Array(10).fill('{"verified": true, "score": 8}'));

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

      await verifier.verify('query', results, { concurrency: 3 });

      expect(maxActiveCalls).toBeLessThanOrEqual(3);
    });
  });

  describe('batch verification', () => {
    it('should verify all documents in one call when batchMode=true', async () => {
      const results = createMockResults(3, [0.5, 0.5, 0.5]);
      mockProvider.setResponses([
        '[{"verified": true, "score": 8}, {"verified": false, "score": 3}, {"verified": true, "score": 7}]',
      ]);

      const verified = await verifier.verify('query', results, { batchMode: true });

      expect(mockProvider.chatCallCount).toBe(1);
      expect(verified[0]!.verification?.verified).toBe(true);
      expect(verified[1]!.verification?.verified).toBe(false);
      expect(verified[2]!.verification?.verified).toBe(true);
    });

    it('should handle malformed batch response gracefully', async () => {
      const results = createMockResults(2, [0.5, 0.5]);
      mockProvider.setResponses(['not a valid json']);

      const verified = await verifier.verify('query', results, { batchMode: true });

      // Should fallback to default verification
      expect(verified).toHaveLength(2);
      verified.forEach((r) => {
        expect(r.verification).toBeDefined();
      });
    });
  });

  describe('response parsing', () => {
    it('should parse JSON verification response', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8, "reasoning": "Directly relevant"}']);

      const verified = await verifier.verify('query', results, {
        includeReasoning: true,
      });

      expect(verified[0]!.verification?.verified).toBe(true);
      expect(verified[0]!.verification?.verificationScore).toBe(8);
      expect(verified[0]!.verification?.confidence).toBe(0.8);
      expect(verified[0]!.verification?.reasoning).toBe('Directly relevant');
    });

    it('should extract score from verbose response', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['Based on analysis, I give this document 8 points out of 10']);

      const verified = await verifier.verify('query', results);

      expect(verified[0]!.verification?.verificationScore).toBe(8);
    });

    it('should clamp scores to 0-10 range', async () => {
      const results = createMockResults(2, [0.5, 0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 15}', '{"verified": false, "score": -5}']);

      const verified = await verifier.verify('query', results);

      expect(verified[0]!.verification?.verificationScore).toBe(10);
      expect(verified[1]!.verification?.verificationScore).toBe(0);
    });

    it('should default to score 5 for unparseable responses', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['completely invalid response']);

      const verified = await verifier.verify('query', results);

      expect(verified[0]!.verification?.verificationScore).toBe(5);
    });

    it('should use threshold to determine verified status', async () => {
      const strictVerifier = new LLMVerifier({
        llmProvider: mockProvider,
        verificationThreshold: 8, // Stricter threshold
      });

      const results = createMockResults(2, [0.5, 0.5]);
      mockProvider.setResponses(['{"score": 7}', '{"score": 9}']);

      const verified = await strictVerifier.verify('query', results);

      // Score 7 < threshold 8 = not verified
      expect(verified[0]!.verification?.verified).toBe(false);
      // Score 9 >= threshold 8 = verified
      expect(verified[1]!.verification?.verified).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw on empty query', async () => {
      const results = createMockResults(1, [0.5]);

      await expect(verifier.verify('', results)).rejects.toThrow(VerifierError);
      await expect(verifier.verify('   ', results)).rejects.toThrow('Query cannot be empty');
    });

    it('should handle empty results', async () => {
      const verified = await verifier.verify('query', []);
      expect(verified).toEqual([]);
      expect(mockProvider.chatCallCount).toBe(0);
    });

    it('should wrap LLM errors in VerifierError', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.chat = async () => {
        throw new Error('API rate limit exceeded');
      };

      await expect(verifier.verify('query', results)).rejects.toThrow(VerifierError);
      await expect(verifier.verify('query', results)).rejects.toThrow('rate limit');
    });
  });

  describe('result ordering', () => {
    it('should preserve original result order', async () => {
      const results = createMockResults(5, [0.9, 0.5, 0.1, 0.7, 0.2]);
      mockProvider.setResponses([
        '{"verified": true, "score": 8}',
        '{"verified": true, "score": 7}',
      ]);

      const verified = await verifier.verify('query', results);

      // Order should match original
      expect(verified[0]!.id).toBe('chunk-0');
      expect(verified[1]!.id).toBe('chunk-1');
      expect(verified[2]!.id).toBe('chunk-2');
      expect(verified[3]!.id).toBe('chunk-3');
      expect(verified[4]!.id).toBe('chunk-4');
    });
  });

  describe('reasoning inclusion', () => {
    it('should not include reasoning by default', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8, "reasoning": "Test reason"}']);

      const verified = await verifier.verify('query', results);

      expect(verified[0]!.verification?.reasoning).toBeUndefined();
    });

    it('should include reasoning when requested', async () => {
      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8, "reasoning": "Test reason"}']);

      const verified = await verifier.verify('query', results, {
        includeReasoning: true,
      });

      expect(verified[0]!.verification?.reasoning).toBe('Test reason');
    });

    it('should include auto-skip reason for high confidence', async () => {
      const results = createMockResults(1, [0.9]);

      const verified = await verifier.verify('query', results, {
        includeReasoning: true,
      });

      expect(verified[0]!.verification?.reasoning).toContain('high retrieval confidence');
    });

    it('should include auto-reject reason for low confidence', async () => {
      const results = createMockResults(1, [0.1]);

      const verified = await verifier.verify('query', results, {
        includeReasoning: true,
      });

      expect(verified[0]!.verification?.reasoning).toContain('low retrieval confidence');
    });
  });

  describe('custom prompts', () => {
    it('should use custom prompt template', async () => {
      const customVerifier = new LLMVerifier({
        llmProvider: mockProvider,
        promptTemplate: 'CUSTOM: Query={query} Document={document}',
      });

      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8}']);

      await customVerifier.verify('my query', results);

      const userMessage = mockProvider.lastMessages.find((m) => m.role === 'user');
      expect(userMessage?.content).toContain('CUSTOM:');
      expect(userMessage?.content).toContain('Query=my query');
    });

    it('should use custom system prompt', async () => {
      const customVerifier = new LLMVerifier({
        llmProvider: mockProvider,
        systemPrompt: 'You are a strict verifier.',
      });

      const results = createMockResults(1, [0.5]);
      mockProvider.setResponses(['{"verified": true, "score": 8}']);

      await customVerifier.verify('query', results);

      const systemMessage = mockProvider.lastMessages.find((m) => m.role === 'system');
      expect(systemMessage?.content).toBe('You are a strict verifier.');
    });
  });
});
