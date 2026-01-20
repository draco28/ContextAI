/**
 * Adaptive RAG Tests
 *
 * Tests for the AdaptiveRAG wrapper implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveRAG } from '../../src/adaptive/adaptive-rag.js';
import { AdaptiveRAGError } from '../../src/adaptive/errors.js';
import type { RAGEngine, RAGResult, RAGSearchOptions } from '../../src/engine/types.js';
import type { AdaptiveSearchOptions } from '../../src/adaptive/types.js';

/**
 * Mock RAG Engine for testing.
 */
class MockRAGEngine implements RAGEngine {
  readonly name = 'MockRAGEngine';

  public searchCallCount = 0;
  public lastQuery = '';
  public lastOptions: RAGSearchOptions | undefined;
  public shouldThrow = false;
  public mockResult: RAGResult;

  constructor() {
    this.mockResult = this.createMockResult('Mock content');
  }

  search = async (query: string, options?: RAGSearchOptions): Promise<RAGResult> => {
    this.searchCallCount++;
    this.lastQuery = query;
    this.lastOptions = options;

    if (this.shouldThrow) {
      throw new Error('Mock search error');
    }

    return this.mockResult;
  };

  clearCache = async (): Promise<void> => {
    // No-op for mock
  };

  private createMockResult(content: string): RAGResult {
    return {
      content,
      estimatedTokens: 100,
      sources: [],
      assembly: {
        content,
        estimatedTokens: 100,
        chunkCount: 1,
        deduplicatedCount: 0,
        droppedCount: 0,
        sources: [],
        chunks: [],
      },
      retrievalResults: [],
      metadata: {
        effectiveQuery: 'test query',
        retrievedCount: 5,
        assembledCount: 3,
        deduplicatedCount: 0,
        droppedCount: 2,
        fromCache: false,
        timings: {
          retrievalMs: 50,
          assemblyMs: 10,
          totalMs: 60,
        },
      },
    };
  }
}

describe('AdaptiveRAG', () => {
  let mockEngine: MockRAGEngine;
  let adaptiveRag: AdaptiveRAG;

  beforeEach(() => {
    mockEngine = new MockRAGEngine();
    adaptiveRag = new AdaptiveRAG({ engine: mockEngine });
  });

  describe('configuration', () => {
    it('should throw without engine', () => {
      expect(() => new AdaptiveRAG({} as any)).toThrow(AdaptiveRAGError);
      expect(() => new AdaptiveRAG({} as any)).toThrow('RAGEngine is required');
    });

    it('should use default name', () => {
      expect(adaptiveRag.name).toBe('AdaptiveRAG');
    });

    it('should use custom name', () => {
      const custom = new AdaptiveRAG({
        engine: mockEngine,
        name: 'CustomAdaptive',
      });
      expect(custom.name).toBe('CustomAdaptive');
    });

    it('should expose underlying engine', () => {
      expect(adaptiveRag.engine).toBe(mockEngine);
    });

    it('should expose classifier', () => {
      expect(adaptiveRag.classifier).toBeDefined();
      expect(adaptiveRag.classifier.name).toBe('QueryClassifier');
    });

    it('should use custom classifier config', () => {
      const custom = new AdaptiveRAG({
        engine: mockEngine,
        classifierConfig: { name: 'CustomClassifier' },
      });
      expect(custom.classifier.name).toBe('CustomClassifier');
    });
  });

  describe('SIMPLE queries (skip retrieval)', () => {
    it('should skip retrieval for greetings', async () => {
      const result = await adaptiveRag.search('Hello!');

      expect(mockEngine.searchCallCount).toBe(0);
      expect(result.skippedRetrieval).toBe(true);
      expect(result.skipReason).toContain('simple');
    });

    it('should return empty content when retrieval is skipped', async () => {
      const result = await adaptiveRag.search('thanks');

      expect(result.content).toBe('');
      expect(result.estimatedTokens).toBe(0);
      expect(result.sources).toHaveLength(0);
    });

    it('should include classification in result', async () => {
      const result = await adaptiveRag.search('hello');

      expect(result.classification).toBeDefined();
      expect(result.classification?.type).toBe('simple');
      expect(result.classification?.confidence).toBeGreaterThan(0.9);
    });

    it('should use custom skip retrieval options', async () => {
      const custom = new AdaptiveRAG({
        engine: mockEngine,
        skipRetrievalDefaults: {
          content: 'No retrieval needed',
          skipReason: 'Custom skip reason',
        },
      });

      const result = await custom.search('hello');

      expect(result.content).toBe('No retrieval needed');
      expect(result.skipReason).toBe('Custom skip reason');
    });

    it('should force retrieval when forceRetrieval is true', async () => {
      const result = await adaptiveRag.search('hello', { forceRetrieval: true });

      expect(mockEngine.searchCallCount).toBe(1);
      expect(result.skippedRetrieval).toBe(false);
    });
  });

  describe('FACTUAL queries', () => {
    it('should execute retrieval for factual questions', async () => {
      const result = await adaptiveRag.search('What is TypeScript?');

      expect(mockEngine.searchCallCount).toBe(1);
      expect(mockEngine.lastQuery).toBe('What is TypeScript?');
      expect(result.skippedRetrieval).toBe(false);
    });

    it('should pass classification to result', async () => {
      const result = await adaptiveRag.search('What is TypeScript?');

      expect(result.classification?.type).toBe('factual');
    });

    it('should apply recommended options', async () => {
      await adaptiveRag.search('What is TypeScript?');

      // FACTUAL: enableEnhancement=false, enableReranking=true, topK=5
      expect(mockEngine.lastOptions?.enhance).toBe(false);
      expect(mockEngine.lastOptions?.rerank).toBe(true);
      expect(mockEngine.lastOptions?.topK).toBe(5);
    });

    it('should allow user options to override recommendations', async () => {
      await adaptiveRag.search('What is TypeScript?', {
        topK: 20,
        enhance: true,
      });

      expect(mockEngine.lastOptions?.topK).toBe(20);
      expect(mockEngine.lastOptions?.enhance).toBe(true);
    });
  });

  describe('COMPLEX queries', () => {
    it('should execute retrieval with enhancement for complex queries', async () => {
      const result = await adaptiveRag.search('Compare React and Vue frameworks');

      expect(mockEngine.searchCallCount).toBe(1);
      expect(result.classification?.type).toBe('complex');
    });

    it('should apply recommended options for complex', async () => {
      await adaptiveRag.search('Compare React and Vue frameworks');

      // COMPLEX: enableEnhancement=true, enableReranking=true, topK=10
      expect(mockEngine.lastOptions?.enhance).toBe(true);
      expect(mockEngine.lastOptions?.rerank).toBe(true);
      expect(mockEngine.lastOptions?.topK).toBe(10);
    });

    it('should handle very long complex queries', async () => {
      // Need > 20 words to trigger multi-query suggestion
      const longQuery = 'Compare the performance, ecosystem, and developer experience of React, Vue, and Angular for building large scale enterprise-grade applications in production environments';
      const result = await adaptiveRag.search(longQuery);

      expect(result.classification?.type).toBe('complex');
      expect(result.classification?.features.wordCount).toBeGreaterThan(20);
      expect(result.classification?.recommendation.suggestedStrategy).toBe('multi-query');
    });
  });

  describe('CONVERSATIONAL queries', () => {
    it('should execute retrieval for conversational queries', async () => {
      const result = await adaptiveRag.search('What about it?');

      expect(mockEngine.searchCallCount).toBe(1);
      expect(result.classification?.type).toBe('conversational');
    });

    it('should flag that conversation context is needed', async () => {
      const result = await adaptiveRag.search('Tell me more about that');

      expect(result.classification?.recommendation.needsConversationContext).toBe(true);
    });

    it('should still search even without conversation history', async () => {
      // Graceful degradation - search works but may be suboptimal
      const result = await adaptiveRag.search('What about it?');

      expect(mockEngine.searchCallCount).toBe(1);
      expect(result.skippedRetrieval).toBe(false);
    });

    it('should accept conversation history option', async () => {
      await adaptiveRag.search('What about it?', {
        conversationHistory: [
          { role: 'user', content: 'Tell me about TypeScript' },
          { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript...' },
        ],
      });

      expect(mockEngine.searchCallCount).toBe(1);
    });
  });

  describe('overrideType option', () => {
    it('should use override type instead of classification', async () => {
      // "Hello" would normally be SIMPLE, but we override to FACTUAL
      const result = await adaptiveRag.search('Hello', { overrideType: 'factual' });

      expect(result.classification?.type).toBe('factual');
      expect(result.classification?.confidence).toBe(1.0); // Override is explicit
      expect(mockEngine.searchCallCount).toBe(1); // Should search, not skip
    });

    it('should validate override type', async () => {
      try {
        await adaptiveRag.search('hello', { overrideType: 'invalid' as any });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AdaptiveRAGError);
        // Error is wrapped with CLASSIFICATION_ERROR code
        expect((error as AdaptiveRAGError).code).toBe('CLASSIFICATION_ERROR');
        expect((error as AdaptiveRAGError).cause?.message).toContain('Invalid override type');
      }
    });

    it('should force retrieval for SIMPLE override', async () => {
      // "What is TypeScript?" would be FACTUAL, override to SIMPLE
      const result = await adaptiveRag.search('What is TypeScript?', {
        overrideType: 'simple',
      });

      expect(result.skippedRetrieval).toBe(true);
      expect(mockEngine.searchCallCount).toBe(0);
    });
  });

  describe('classifyOnly', () => {
    it('should classify without executing search', () => {
      const result = adaptiveRag.classifyOnly('Compare React and Vue');

      expect(mockEngine.searchCallCount).toBe(0);
      expect(result.type).toBe('complex');
    });

    it('should throw for invalid input', () => {
      expect(() => adaptiveRag.classifyOnly('')).toThrow(AdaptiveRAGError);
      expect(() => adaptiveRag.classifyOnly(null as any)).toThrow(AdaptiveRAGError);
    });
  });

  describe('error handling', () => {
    it('should throw for empty query', async () => {
      await expect(adaptiveRag.search('')).rejects.toThrow(AdaptiveRAGError);
      await expect(adaptiveRag.search('')).rejects.toThrow('non-empty string');
    });

    it('should throw for null query', async () => {
      await expect(adaptiveRag.search(null as any)).rejects.toThrow(AdaptiveRAGError);
    });

    it('should throw for whitespace-only query', async () => {
      await expect(adaptiveRag.search('   ')).rejects.toThrow(AdaptiveRAGError);
    });

    it('should wrap underlying engine errors', async () => {
      mockEngine.shouldThrow = true;

      try {
        await adaptiveRag.search('What is TypeScript?');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AdaptiveRAGError);
        expect((error as AdaptiveRAGError).code).toBe('UNDERLYING_ENGINE_ERROR');
        expect((error as AdaptiveRAGError).cause).toBeDefined();
      }
    });

    it('should include query type in error when available', async () => {
      mockEngine.shouldThrow = true;

      try {
        await adaptiveRag.search('What is TypeScript?');
      } catch (error) {
        expect((error as AdaptiveRAGError).queryType).toBe('factual');
      }
    });
  });

  describe('includeClassificationInMetadata option', () => {
    it('should include classification by default', async () => {
      const result = await adaptiveRag.search('What is TypeScript?');
      expect(result.classification).toBeDefined();
    });

    it('should exclude classification when disabled', async () => {
      const custom = new AdaptiveRAG({
        engine: mockEngine,
        includeClassificationInMetadata: false,
      });

      const result = await custom.search('What is TypeScript?');
      expect(result.classification).toBeUndefined();
    });
  });

  describe('result structure', () => {
    it('should have all required fields for normal search', async () => {
      const result = await adaptiveRag.search('What is TypeScript?');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('estimatedTokens');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('assembly');
      expect(result).toHaveProperty('retrievalResults');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('skippedRetrieval');
    });

    it('should have all required fields for skipped search', async () => {
      const result = await adaptiveRag.search('hello');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('estimatedTokens');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('assembly');
      expect(result).toHaveProperty('retrievalResults');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('skippedRetrieval');
      expect(result).toHaveProperty('skipReason');
    });

    it('should have valid timings for skipped search', async () => {
      const result = await adaptiveRag.search('hello');

      expect(result.metadata.timings.totalMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.timings.retrievalMs).toBe(0);
      expect(result.metadata.timings.assemblyMs).toBe(0);
    });
  });

  describe('query trimming', () => {
    it('should trim whitespace from query', async () => {
      await adaptiveRag.search('  What is TypeScript?  ');

      expect(mockEngine.lastQuery).toBe('What is TypeScript?');
    });
  });
});
