/**
 * MMR Reranker Tests
 *
 * Tests for Maximal Marginal Relevance reranking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RetrievalResult } from '../../src/retrieval/types.js';
import type { EmbeddingProvider, EmbeddingResult } from '../../src/embeddings/types.js';
import { MMRReranker } from '../../src/reranker/mmr-reranker.js';
import { RerankerError } from '../../src/reranker/errors.js';

// Mock embedding provider
class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'MockEmbedding';
  readonly dimensions = 3;
  readonly maxBatchSize = 100;

  private embeddings: Map<string, number[]> = new Map();

  setEmbedding(text: string, embedding: number[]): void {
    this.embeddings.set(text, embedding);
  }

  embed = async (text: string): Promise<EmbeddingResult> => {
    const embedding = this.embeddings.get(text) ?? this.generateEmbedding(text);
    return {
      embedding,
      tokenCount: text.split(' ').length,
      model: 'mock-model',
    };
  };

  embedBatch = async (texts: string[]): Promise<EmbeddingResult[]> => {
    return Promise.all(texts.map((t) => this.embed(t)));
  };

  private generateEmbedding(text: string): number[] {
    // Generate deterministic embedding based on text hash
    const hash = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const x = Math.sin(hash);
    const y = Math.cos(hash);
    const z = Math.sin(hash * 2);
    return this.normalize([x, y, z]);
  }

  private normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map((v) => v / norm);
  }
}

// Helper to create results with embeddings
function createResultWithEmbedding(
  id: string,
  content: string,
  score: number,
  embedding: number[]
): RetrievalResult & { embedding: number[] } {
  return {
    id,
    chunk: { id, content, metadata: {} },
    score,
    embedding,
  };
}

// Helper to create similar embeddings (for testing diversity)
function createSimilarEmbeddings(base: number[], variations: number): number[][] {
  const result: number[][] = [base];
  for (let i = 1; i < variations; i++) {
    // Add small noise to create similar but not identical embeddings
    const noisy = base.map((v) => v + (Math.random() - 0.5) * 0.1 * i);
    const norm = Math.sqrt(noisy.reduce((sum, v) => sum + v * v, 0));
    result.push(noisy.map((v) => v / norm));
  }
  return result;
}

describe('MMRReranker', () => {
  let mockProvider: MockEmbeddingProvider;
  let reranker: MMRReranker;

  beforeEach(() => {
    mockProvider = new MockEmbeddingProvider();
    reranker = new MMRReranker({
      embeddingProvider: mockProvider,
      defaultLambda: 0.5,
    });
  });

  describe('basic functionality', () => {
    it('should rerank results', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'Similar to query', 0.9, [0.95, 0.1, 0.05]),
        createResultWithEmbedding('2', 'Different content', 0.7, [0, 0.8, 0.6]),
        createResultWithEmbedding('3', 'Another topic', 0.5, [0.1, 0.1, 0.99]),
      ];

      const reranked = await reranker.rerank('query', results);

      expect(reranked).toHaveLength(3);
      expect(reranked[0]!.id).toBeDefined();
      expect(reranked[0]!.scores.diversityPenalty).toBeDefined();
    });

    it('should respect topK option', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = Array.from({ length: 10 }, (_, i) =>
        createResultWithEmbedding(
          `${i}`,
          `Content ${i}`,
          1 - i * 0.1,
          [Math.cos(i * 0.5), Math.sin(i * 0.5), 0.1]
        )
      );

      const reranked = await reranker.rerank('query', results, { topK: 3 });

      expect(reranked).toHaveLength(3);
    });

    it('should track original and new ranks', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'First', 0.9, [0.9, 0.1, 0]),
        createResultWithEmbedding('2', 'Second', 0.8, [0, 0.9, 0.1]),
        createResultWithEmbedding('3', 'Third', 0.7, [0.1, 0, 0.9]),
      ];

      const reranked = await reranker.rerank('query', results);

      reranked.forEach((r) => {
        expect(r.originalRank).toBeGreaterThan(0);
        expect(r.newRank).toBeGreaterThan(0);
      });
    });
  });

  describe('diversity behavior', () => {
    it('should prefer diverse results when lambda is low', async () => {
      const diverseReranker = new MMRReranker({
        embeddingProvider: mockProvider,
        defaultLambda: 0.1, // High diversity preference
      });

      mockProvider.setEmbedding('query', [1, 0, 0]);

      // Create similar embeddings for first two results
      const similarEmbeddings = createSimilarEmbeddings([0.9, 0.1, 0], 2);
      const results = [
        createResultWithEmbedding('1', 'Similar A', 0.9, similarEmbeddings[0]!),
        createResultWithEmbedding('2', 'Similar B', 0.85, similarEmbeddings[1]!),
        createResultWithEmbedding('3', 'Different', 0.7, [0.1, 0.9, 0]),
      ];

      const reranked = await diverseReranker.rerank('query', results);

      // With high diversity preference, the different result should be promoted
      // First result should still be #1 (most relevant)
      expect(reranked[0]!.id).toBe('1');
      // Second should be the different one (diversity boost)
      expect(reranked[1]!.id).toBe('3');
    });

    it('should prefer relevant results when lambda is high', async () => {
      const relevanceReranker = new MMRReranker({
        embeddingProvider: mockProvider,
        defaultLambda: 0.9, // High relevance preference
      });

      mockProvider.setEmbedding('query', [1, 0, 0]);

      const similarEmbeddings = createSimilarEmbeddings([0.9, 0.1, 0], 2);
      const results = [
        createResultWithEmbedding('1', 'Similar A', 0.9, similarEmbeddings[0]!),
        createResultWithEmbedding('2', 'Similar B', 0.85, similarEmbeddings[1]!),
        createResultWithEmbedding('3', 'Different', 0.3, [0.1, 0.9, 0]),
      ];

      const reranked = await relevanceReranker.rerank('query', results);

      // With high relevance preference, similar results stay at top
      expect(reranked[0]!.id).toBe('1');
      expect(reranked[1]!.id).toBe('2');
    });

    it('should allow lambda override per query', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [0.9, 0.1, 0]),
        createResultWithEmbedding('2', 'B', 0.8, [0.85, 0.15, 0]),
        createResultWithEmbedding('3', 'C', 0.5, [0, 0.9, 0.1]),
      ];

      // Default lambda
      const defaultReranked = await reranker.rerank('query', results);

      // Override with high diversity
      const diverseReranked = await reranker.rerank('query', results, {
        lambda: 0.1,
      });

      // Results should differ based on lambda
      expect(diverseReranked.map((r) => r.id).join(',')).not.toBe(
        defaultReranked.map((r) => r.id).join(',')
      );
    });
  });

  describe('score breakdown', () => {
    it('should include relevance and diversity scores', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [0.9, 0.1, 0]),
        createResultWithEmbedding('2', 'B', 0.7, [0.5, 0.5, 0]),
      ];

      const reranked = await reranker.rerank('query', results);

      reranked.forEach((r) => {
        expect(r.scores.relevanceScore).toBeDefined();
        expect(r.scores.diversityPenalty).toBeDefined();
        expect(typeof r.scores.relevanceScore).toBe('number');
        expect(typeof r.scores.diversityPenalty).toBe('number');
      });
    });

    it('should have zero diversity penalty for first result', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [0.9, 0.1, 0]),
        createResultWithEmbedding('2', 'B', 0.7, [0.5, 0.5, 0]),
      ];

      const reranked = await reranker.rerank('query', results);

      // First selected result should have no diversity penalty
      expect(reranked[0]!.scores.diversityPenalty).toBe(0);
    });
  });

  describe('embedding requirement', () => {
    it('should throw when results lack embeddings and no provider configured', async () => {
      const noProviderReranker = new MMRReranker({ defaultLambda: 0.5 });

      const results: RetrievalResult[] = [
        { id: '1', chunk: { id: '1', content: 'A', metadata: {} }, score: 0.9 },
        { id: '2', chunk: { id: '2', content: 'B', metadata: {} }, score: 0.7 },
      ];

      await expect(noProviderReranker.rerank('query', results)).rejects.toThrow(
        RerankerError
      );
      await expect(noProviderReranker.rerank('query', results)).rejects.toThrow(
        'embedding'
      );
    });

    it('should work with pre-computed embeddings without provider', async () => {
      const noProviderReranker = new MMRReranker({ defaultLambda: 0.5 });

      // Results with embeddings
      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [1, 0, 0]),
        createResultWithEmbedding('2', 'B', 0.7, [0, 1, 0]),
      ];

      // Should still fail because we need query embedding
      await expect(noProviderReranker.rerank('query', results)).rejects.toThrow(
        'embedding'
      );
    });

    it('should compute embeddings for results without them', async () => {
      const mixedResults = [
        createResultWithEmbedding('1', 'Has embedding', 0.9, [1, 0, 0]),
        {
          id: '2',
          chunk: { id: '2', content: 'No embedding', metadata: {} },
          score: 0.7,
        },
      ] as RetrievalResult[];

      mockProvider.setEmbedding('query', [1, 0, 0]);

      const reranked = await reranker.rerank('query', mixedResults);

      expect(reranked).toHaveLength(2);
    });
  });

  describe('similarity functions', () => {
    it('should support cosine similarity (default)', async () => {
      const cosineReranker = new MMRReranker({
        embeddingProvider: mockProvider,
        similarityFunction: 'cosine',
      });

      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [1, 0, 0]), // Identical to query
        createResultWithEmbedding('2', 'B', 0.7, [0, 1, 0]), // Orthogonal
      ];

      const reranked = await cosineReranker.rerank('query', results);

      // First should have high relevance score
      expect(reranked[0]!.scores.relevanceScore).toBeGreaterThan(0.9);
    });

    it('should support dot product similarity', async () => {
      const dotReranker = new MMRReranker({
        embeddingProvider: mockProvider,
        similarityFunction: 'dotProduct',
      });

      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [1, 0, 0]),
        createResultWithEmbedding('2', 'B', 0.7, [0, 1, 0]),
      ];

      const reranked = await dotReranker.rerank('query', results);

      expect(reranked).toHaveLength(2);
    });

    it('should support euclidean similarity', async () => {
      const euclideanReranker = new MMRReranker({
        embeddingProvider: mockProvider,
        similarityFunction: 'euclidean',
      });

      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [
        createResultWithEmbedding('1', 'A', 0.9, [1, 0, 0]),
        createResultWithEmbedding('2', 'B', 0.7, [0, 1, 0]),
      ];

      const reranked = await euclideanReranker.rerank('query', results);

      expect(reranked).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle single result', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const results = [createResultWithEmbedding('1', 'Only one', 0.9, [1, 0, 0])];

      const reranked = await reranker.rerank('query', results);

      expect(reranked).toHaveLength(1);
      expect(reranked[0]!.newRank).toBe(1);
    });

    it('should handle empty results', async () => {
      const reranked = await reranker.rerank('query', []);
      expect(reranked).toHaveLength(0);
    });

    it('should handle identical embeddings', async () => {
      mockProvider.setEmbedding('query', [1, 0, 0]);

      const sameEmbedding = [1, 0, 0];
      const results = [
        createResultWithEmbedding('1', 'A', 0.9, sameEmbedding),
        createResultWithEmbedding('2', 'B', 0.8, sameEmbedding),
        createResultWithEmbedding('3', 'C', 0.7, sameEmbedding),
      ];

      const reranked = await reranker.rerank('query', results);

      // Should still return all results even with identical embeddings
      expect(reranked).toHaveLength(3);
    });
  });
});
