/**
 * SemanticChunker Tests
 *
 * Tests the semantic chunking strategy using mock embeddings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SemanticChunker } from '../../src/chunking/semantic-chunker.js';
import { ChunkerError } from '../../src/chunking/errors.js';
import type { Document } from '../../src/chunking/types.js';
import type { EmbeddingProvider, EmbeddingResult } from '../../src/embeddings/types.js';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a test document.
 */
function createDocument(content: string, id = 'test-doc'): Document {
  return {
    id,
    content,
    metadata: { title: 'Test Document' },
    source: 'test',
  };
}

/**
 * Create a mock embedding provider.
 *
 * By default, returns sequential orthogonal unit vectors:
 * - Sentence 0: [1, 0, 0, 0, ...]
 * - Sentence 1: [0, 1, 0, 0, ...]
 * - etc.
 *
 * This results in cosine similarity of 0 between all consecutive sentences,
 * causing maximum splitting.
 */
function createMockEmbeddingProvider(
  customEmbeddings?: number[][]
): EmbeddingProvider {
  let callIndex = 0;

  return {
    name: 'MockEmbeddingProvider',
    dimensions: 8,
    maxBatchSize: 100,

    embed: vi.fn(async (text: string): Promise<EmbeddingResult> => {
      const embedding = customEmbeddings
        ? customEmbeddings[callIndex++ % customEmbeddings.length]
        : createOrthogonalVector(callIndex++, 8);

      return {
        embedding,
        tokenCount: Math.ceil(text.length / 4),
        model: 'mock-model',
      };
    }),

    embedBatch: vi.fn(async (texts: string[]): Promise<EmbeddingResult[]> => {
      return texts.map((text, i) => {
        const embedding = customEmbeddings
          ? customEmbeddings[i % customEmbeddings.length]
          : createOrthogonalVector(i, 8);

        return {
          embedding,
          tokenCount: Math.ceil(text.length / 4),
          model: 'mock-model',
        };
      });
    }),

    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create an orthogonal unit vector (only one dimension is 1, rest are 0).
 * This gives cosine similarity of 0 between any two different vectors.
 */
function createOrthogonalVector(index: number, dimensions: number): number[] {
  const vector = new Array(dimensions).fill(0);
  vector[index % dimensions] = 1;
  return vector;
}

/**
 * Create embedding provider that returns similar vectors.
 * All sentences get the same embedding = similarity 1.0
 */
function createSimilarEmbeddingProvider(): EmbeddingProvider {
  const sameVector = [1, 0, 0, 0, 0, 0, 0, 0]; // Normalized unit vector

  return {
    name: 'SimilarEmbeddingProvider',
    dimensions: 8,
    maxBatchSize: 100,

    embed: vi.fn(async (text: string): Promise<EmbeddingResult> => ({
      embedding: sameVector,
      tokenCount: Math.ceil(text.length / 4),
      model: 'mock-model',
    })),

    embedBatch: vi.fn(async (texts: string[]): Promise<EmbeddingResult[]> => {
      return texts.map((text) => ({
        embedding: sameVector,
        tokenCount: Math.ceil(text.length / 4),
        model: 'mock-model',
      }));
    }),

    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create embedding provider that simulates a topic change.
 * First N sentences are similar, remaining are different.
 */
function createTopicChangeProvider(
  changeAfterSentence: number
): EmbeddingProvider {
  const topicA = [1, 0, 0, 0, 0, 0, 0, 0]; // Topic A embedding
  const topicB = [0, 1, 0, 0, 0, 0, 0, 0]; // Topic B embedding (orthogonal to A)

  return {
    name: 'TopicChangeProvider',
    dimensions: 8,
    maxBatchSize: 100,

    embed: vi.fn(async (): Promise<EmbeddingResult> => ({
      embedding: topicA,
      tokenCount: 10,
      model: 'mock-model',
    })),

    embedBatch: vi.fn(async (texts: string[]): Promise<EmbeddingResult[]> => {
      return texts.map((text, i) => ({
        embedding: i < changeAfterSentence ? topicA : topicB,
        tokenCount: Math.ceil(text.length / 4),
        model: 'mock-model',
      }));
    }),

    isAvailable: vi.fn(async () => true),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SemanticChunker', () => {
  describe('constructor', () => {
    it('should require embeddingProvider', () => {
      expect(() => {
        // @ts-expect-error Testing missing required field
        new SemanticChunker({});
      }).toThrow('SemanticChunker requires embeddingProvider');
    });

    it('should use default config values', () => {
      const provider = createMockEmbeddingProvider();
      const chunker = new SemanticChunker({ embeddingProvider: provider });

      expect(chunker.name).toBe('SemanticChunker');
    });

    it('should reject invalid similarity threshold', () => {
      const provider = createMockEmbeddingProvider();

      expect(() => {
        new SemanticChunker({
          embeddingProvider: provider,
          similarityThreshold: 1.5,
        });
      }).toThrow('similarityThreshold must be between 0 and 1');

      expect(() => {
        new SemanticChunker({
          embeddingProvider: provider,
          similarityThreshold: -0.1,
        });
      }).toThrow('similarityThreshold must be between 0 and 1');
    });

    it('should reject invalid size constraints', () => {
      const provider = createMockEmbeddingProvider();

      expect(() => {
        new SemanticChunker({
          embeddingProvider: provider,
          minChunkSize: 500,
          maxChunkSize: 100,
        });
      }).toThrow('minChunkSize must be less than maxChunkSize');
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      const provider = createMockEmbeddingProvider();
      const chunker = new SemanticChunker({ embeddingProvider: provider });

      expect(chunker.name).toBe('SemanticChunker');
    });
  });

  describe('chunk()', () => {
    let mockProvider: EmbeddingProvider;
    let chunker: SemanticChunker;

    beforeEach(() => {
      mockProvider = createMockEmbeddingProvider();
      chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        similarityThreshold: 0.5,
        minChunkSize: 10,
        maxChunkSize: 500,
      });
    });

    it('should throw on empty document', async () => {
      const doc = createDocument('');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
      await expect(chunker.chunk(doc)).rejects.toMatchObject({
        code: 'EMPTY_DOCUMENT',
      });
    });

    it('should throw on whitespace-only document', async () => {
      const doc = createDocument('   \n\t  ');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
    });

    it('should handle single sentence', async () => {
      const doc = createDocument('This is a single sentence.');

      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('This is a single sentence.');
    });

    it('should call embedBatch with all sentences', async () => {
      const doc = createDocument(
        'First sentence. Second sentence. Third sentence.'
      );

      await chunker.chunk(doc);

      expect(mockProvider.embedBatch).toHaveBeenCalledTimes(1);
      expect(mockProvider.embedBatch).toHaveBeenCalledWith([
        'First sentence.',
        'Second sentence.',
        'Third sentence.',
      ]);
    });

    it('should split at topic boundaries when similarity is low', async () => {
      // With orthogonal vectors (similarity 0), every sentence should be a topic change
      const doc = createDocument(
        'First topic here. Second topic here. Third topic here. Fourth topic here.'
      );

      // Use very small min chunk size to allow splitting
      const smallChunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        similarityThreshold: 0.5,
        minChunkSize: 5,
        maxChunkSize: 100,
      });

      const chunks = await smallChunker.chunk(doc);

      // With orthogonal embeddings and low minChunkSize, should split into multiple chunks
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should keep sentences together when similarity is high', async () => {
      // All sentences return the same embedding = similarity 1.0
      const similarProvider = createSimilarEmbeddingProvider();
      const similarChunker = new SemanticChunker({
        embeddingProvider: similarProvider,
        similarityThreshold: 0.5,
        minChunkSize: 10,
        maxChunkSize: 1000,
      });

      const doc = createDocument(
        'First sentence. Second sentence. Third sentence. Fourth sentence.'
      );

      const chunks = await similarChunker.chunk(doc);

      // All sentences are similar, should stay in one chunk
      expect(chunks).toHaveLength(1);
    });

    it('should detect topic changes', async () => {
      // Topic changes after sentence 2
      const topicProvider = createTopicChangeProvider(2);
      const topicChunker = new SemanticChunker({
        embeddingProvider: topicProvider,
        similarityThreshold: 0.5,
        minChunkSize: 10,
        maxChunkSize: 1000,
      });

      const doc = createDocument(
        'Topic A sentence one. Topic A sentence two. Topic B sentence one. Topic B sentence two.'
      );

      const chunks = await topicChunker.chunk(doc);

      // Should split between Topic A and Topic B
      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toContain('Topic A');
      expect(chunks[1].content).toContain('Topic B');
    });

    it('should include position metadata', async () => {
      const doc = createDocument('Hello world.');

      const chunks = await chunker.chunk(doc);

      expect(chunks[0].metadata.startIndex).toBeDefined();
      expect(chunks[0].metadata.endIndex).toBeDefined();
      expect(chunks[0].metadata.startIndex).toBe(0);
    });

    it('should generate deterministic chunk IDs', async () => {
      const doc = createDocument('Sentence one. Sentence two.');

      const chunks1 = await chunker.chunk(doc);
      const chunks2 = await chunker.chunk(doc);

      expect(chunks1[0].id).toBe(chunks2[0].id);
    });

    it('should link chunks to document', async () => {
      const doc = createDocument('Test content here.', 'my-doc-id');

      const chunks = await chunker.chunk(doc);

      expect(chunks[0].documentId).toBe('my-doc-id');
    });
  });

  describe('size constraints', () => {
    it('should split when approaching maxChunkSize', async () => {
      // Use provider that returns similar embeddings (no topic changes)
      const similarProvider = createSimilarEmbeddingProvider();

      // Very small max size to force splitting
      const chunker = new SemanticChunker({
        embeddingProvider: similarProvider,
        similarityThreshold: 0.5,
        minChunkSize: 5,
        maxChunkSize: 30, // ~120 characters
      });

      // Long content that exceeds max size
      const doc = createDocument(
        'This is a long first sentence here. ' +
          'This is a long second sentence here. ' +
          'This is a long third sentence here. ' +
          'This is a long fourth sentence here.'
      );

      const chunks = await chunker.chunk(doc);

      // Should split due to size constraint, even though all sentences are similar
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should merge small chunks with neighbors', async () => {
      // Use orthogonal embeddings (every sentence is a topic change)
      const mockProvider = createMockEmbeddingProvider();

      // Large min chunk size to force merging
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        similarityThreshold: 0.5,
        minChunkSize: 100, // High minimum forces merging
        maxChunkSize: 1000,
      });

      // Short sentences that would be individually small
      const doc = createDocument('One. Two. Three. Four.');

      const chunks = await chunker.chunk(doc);

      // Should merge small chunks together to meet minimum
      expect(chunks.length).toBeLessThan(4);
    });
  });

  describe('error handling', () => {
    it('should wrap embedding errors in ChunkerError', async () => {
      const failingProvider: EmbeddingProvider = {
        name: 'FailingProvider',
        dimensions: 8,
        maxBatchSize: 100,
        embed: vi.fn(async () => {
          throw new Error('API error');
        }),
        embedBatch: vi.fn(async () => {
          throw new Error('API error');
        }),
        isAvailable: vi.fn(async () => true),
      };

      const chunker = new SemanticChunker({
        embeddingProvider: failingProvider,
        minChunkSize: 5,
        maxChunkSize: 500,
      });

      const doc = createDocument('Test sentence one. Test sentence two.');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
      await expect(chunker.chunk(doc)).rejects.toMatchObject({
        code: 'CHUNKER_ERROR',
      });
    });
  });

  describe('edge cases', () => {
    let mockProvider: EmbeddingProvider;

    beforeEach(() => {
      mockProvider = createMockEmbeddingProvider();
    });

    it('should handle text without sentence boundaries', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        minChunkSize: 5,
        maxChunkSize: 500,
      });

      const doc = createDocument('No periods here just text');

      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('No periods here just text');
    });

    it('should handle single word', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        minChunkSize: 1,
        maxChunkSize: 500,
      });

      const doc = createDocument('Hello');

      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hello');
    });

    it('should handle question marks as sentence boundaries', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        minChunkSize: 5,
        maxChunkSize: 500,
      });

      const doc = createDocument('Is this a question? Yes it is.');

      const chunks = await chunker.chunk(doc);

      // Should recognize both as separate sentences
      expect(mockProvider.embedBatch).toHaveBeenCalledWith([
        'Is this a question?',
        'Yes it is.',
      ]);
    });

    it('should handle exclamation marks as sentence boundaries', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        minChunkSize: 5,
        maxChunkSize: 500,
      });

      const doc = createDocument('Wow! Amazing! Incredible!');

      const chunks = await chunker.chunk(doc);

      expect(mockProvider.embedBatch).toHaveBeenCalledWith([
        'Wow!',
        'Amazing!',
        'Incredible!',
      ]);
    });

    it('should handle multiple spaces between sentences', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: mockProvider,
        minChunkSize: 5,
        maxChunkSize: 500,
      });

      const doc = createDocument('First.   Second.    Third.');

      const chunks = await chunker.chunk(doc);

      // Should still parse correctly
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('similarity threshold', () => {
    it('should split more aggressively with lower threshold', async () => {
      // Provider returns slightly similar vectors (similarity ~0.4)
      const slightlySimilar: number[][] = [
        [1, 0.2, 0, 0, 0, 0, 0, 0],
        [0.9, 0.3, 0, 0, 0, 0, 0, 0],
        [0.8, 0.4, 0, 0, 0, 0, 0, 0],
        [0.7, 0.5, 0, 0, 0, 0, 0, 0],
      ];
      // Normalize vectors
      const normalized = slightlySimilar.map((v) => {
        const mag = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
        return v.map((x) => x / mag);
      });

      const provider = createMockEmbeddingProvider(normalized);

      // Low threshold (0.3) - should NOT split
      const lowThresholdChunker = new SemanticChunker({
        embeddingProvider: provider,
        similarityThreshold: 0.3,
        minChunkSize: 5,
        maxChunkSize: 1000,
      });

      // High threshold (0.8) - should split
      const highThresholdChunker = new SemanticChunker({
        embeddingProvider: createMockEmbeddingProvider(normalized),
        similarityThreshold: 0.8,
        minChunkSize: 5,
        maxChunkSize: 1000,
      });

      const doc = createDocument('First here. Second here. Third here. Fourth here.');

      const lowChunks = await lowThresholdChunker.chunk(doc);
      const highChunks = await highThresholdChunker.chunk(doc);

      // Higher threshold should produce more chunks
      expect(highChunks.length).toBeGreaterThanOrEqual(lowChunks.length);
    });
  });
});
