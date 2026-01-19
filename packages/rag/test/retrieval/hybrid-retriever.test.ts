import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HybridRetriever,
  DenseRetriever,
  RetrieverError,
  InMemoryVectorStore,
  type BM25Document,
  type ChunkWithEmbedding,
} from '../../src/index.js';
import type { EmbeddingProvider, EmbeddingResult } from '../../src/embeddings/types.js';
import type { Chunk } from '../../src/vector-store/types.js';

// ============================================================================
// Mock Embedding Provider
// ============================================================================

/**
 * Simple mock embedding provider for testing.
 * Generates deterministic embeddings based on content hash.
 */
class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'MockEmbedding';
  readonly dimensions = 3;
  readonly maxBatchSize = 100;

  embed = async (text: string): Promise<EmbeddingResult> => {
    // Create a simple embedding based on character codes
    const hash = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const embedding = this.normalize([
      Math.sin(hash),
      Math.cos(hash),
      Math.sin(hash * 2),
    ]);

    return {
      embedding,
      tokenCount: text.split(' ').length,
      model: 'mock-model',
    };
  };

  embedBatch = async (texts: string[]): Promise<EmbeddingResult[]> => {
    return Promise.all(texts.map((t) => this.embed(t)));
  };

  isAvailable = async (): Promise<boolean> => true;

  private normalize(v: number[]): number[] {
    const mag = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    return v.map((x) => x / mag);
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

function createChunk(id: string, content: string): Chunk {
  return { id, content, metadata: {} };
}

function createBM25Document(id: string, content: string): BM25Document {
  return { id, content, chunk: createChunk(id, content) };
}

async function createChunkWithEmbedding(
  id: string,
  content: string,
  provider: EmbeddingProvider
): Promise<ChunkWithEmbedding> {
  const result = await provider.embed(content);
  return {
    id,
    content,
    metadata: {},
    embedding: result.embedding,
  };
}

// ============================================================================
// Hybrid Retriever Tests
// ============================================================================

describe('HybridRetriever', () => {
  let vectorStore: InMemoryVectorStore;
  let embeddingProvider: MockEmbeddingProvider;
  let retriever: HybridRetriever;
  let testDocs: BM25Document[];

  beforeEach(async () => {
    embeddingProvider = new MockEmbeddingProvider();
    vectorStore = new InMemoryVectorStore({ dimensions: 3 });

    // Create test documents
    testDocs = [
      createBM25Document('1', 'PostgreSQL is a powerful database system'),
      createBM25Document('2', 'MySQL is a popular database'),
      createBM25Document('3', 'Redis is an in-memory data store'),
      createBM25Document('4', 'MongoDB is a NoSQL database'),
    ];

    // Insert into vector store
    const chunks = await Promise.all(
      testDocs.map((doc) =>
        createChunkWithEmbedding(doc.id, doc.content, embeddingProvider)
      )
    );
    await vectorStore.insert(chunks);

    // Create retriever and build index
    retriever = new HybridRetriever(vectorStore, embeddingProvider);
    retriever.buildIndex(testDocs);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const r = new HybridRetriever(vectorStore, embeddingProvider);
      expect(r.name).toBe('HybridRetriever');
    });

    it('should accept custom name', () => {
      const r = new HybridRetriever(vectorStore, embeddingProvider, {
        name: 'CustomHybrid',
      });
      expect(r.name).toBe('CustomHybrid');
    });

    it('should throw on invalid defaultAlpha (< 0)', () => {
      expect(
        () => new HybridRetriever(vectorStore, embeddingProvider, { defaultAlpha: -0.1 })
      ).toThrow(RetrieverError);
    });

    it('should throw on invalid defaultAlpha (> 1)', () => {
      expect(
        () => new HybridRetriever(vectorStore, embeddingProvider, { defaultAlpha: 1.5 })
      ).toThrow(RetrieverError);
    });
  });

  describe('retrieve', () => {
    it('should throw on empty query', async () => {
      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
    });

    it('should throw on invalid alpha in options', async () => {
      await expect(
        retriever.retrieve('database', { alpha: 1.5 })
      ).rejects.toThrow(RetrieverError);
    });

    it('should return results for matching query', async () => {
      const results = await retriever.retrieve('database');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results sorted by fused score', async () => {
      const results = await retriever.retrieve('database', { topK: 10 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect topK parameter', async () => {
      const results = await retriever.retrieve('database', { topK: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should include HybridScore breakdown', async () => {
      const results = await retriever.retrieve('database', { alpha: 0.5 });

      expect(results.length).toBeGreaterThan(0);
      const first = results[0];

      expect(first.scores).toBeDefined();
      expect(first.scores!.dense).toBeGreaterThanOrEqual(0);
      expect(first.scores!.sparse).toBeGreaterThanOrEqual(0);
      expect(first.scores!.fused).toBeGreaterThanOrEqual(0);
    });

    it('should include rank information', async () => {
      const results = await retriever.retrieve('database', { alpha: 0.5 });

      expect(results.length).toBeGreaterThan(0);
      // At least one result should have dense and/or sparse rank
      const hasRankInfo = results.some(
        (r) => r.denseRank !== undefined || r.sparseRank !== undefined
      );
      expect(hasRankInfo).toBe(true);
    });
  });

  describe('alpha parameter', () => {
    it('should use pure dense when alpha=1', async () => {
      const results = await retriever.retrieve('database', { alpha: 1.0 });

      expect(results.length).toBeGreaterThan(0);
      // All results should have sparse=0
      for (const result of results) {
        expect(result.scores?.sparse).toBe(0);
      }
    });

    it('should use pure sparse when alpha=0', async () => {
      const results = await retriever.retrieve('database', { alpha: 0.0 });

      expect(results.length).toBeGreaterThan(0);
      // All results should have dense=0
      for (const result of results) {
        expect(result.scores?.dense).toBe(0);
      }
    });

    it('should use hybrid when alpha=0.5', async () => {
      const results = await retriever.retrieve('database', { alpha: 0.5 });

      expect(results.length).toBeGreaterThan(0);
      // Results should potentially have both dense and sparse scores
      // (at least one result should have non-zero in at least one dimension)
    });
  });

  describe('minScore filtering', () => {
    it('should filter results below minScore', async () => {
      const results = await retriever.retrieve('database', {
        topK: 10,
        minScore: 0.9,
      });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      }
    });
  });

  describe('accessors', () => {
    it('should expose dense retriever', () => {
      expect(retriever.dense).toBeInstanceOf(DenseRetriever);
    });

    it('should expose sparse retriever', () => {
      expect(retriever.sparse).toBeDefined();
      expect(retriever.sparse.documentCount).toBe(4);
    });

    it('should report isIndexBuilt', () => {
      expect(retriever.isIndexBuilt).toBe(true);

      const freshRetriever = new HybridRetriever(vectorStore, embeddingProvider);
      expect(freshRetriever.isIndexBuilt).toBe(false);
    });
  });
});

// ============================================================================
// Dense Retriever Tests
// ============================================================================

describe('DenseRetriever', () => {
  let vectorStore: InMemoryVectorStore;
  let embeddingProvider: MockEmbeddingProvider;
  let retriever: DenseRetriever;

  beforeEach(async () => {
    embeddingProvider = new MockEmbeddingProvider();
    vectorStore = new InMemoryVectorStore({ dimensions: 3 });

    // Insert test chunks
    const chunks = await Promise.all([
      createChunkWithEmbedding('1', 'PostgreSQL is a database', embeddingProvider),
      createChunkWithEmbedding('2', 'MySQL is also a database', embeddingProvider),
      createChunkWithEmbedding('3', 'Redis is a cache', embeddingProvider),
    ]);
    await vectorStore.insert(chunks);

    retriever = new DenseRetriever(vectorStore, embeddingProvider);
  });

  describe('constructor', () => {
    it('should create with defaults', () => {
      const r = new DenseRetriever(vectorStore, embeddingProvider);
      expect(r.name).toBe('DenseRetriever');
    });

    it('should accept custom name', () => {
      const r = new DenseRetriever(vectorStore, embeddingProvider, {
        name: 'CustomDense',
      });
      expect(r.name).toBe('CustomDense');
    });
  });

  describe('retrieve', () => {
    it('should throw on empty query', async () => {
      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
    });

    it('should return results', async () => {
      const results = await retriever.retrieve('database');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect topK', async () => {
      const results = await retriever.retrieve('database', { topK: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return results sorted by score', async () => {
      const results = await retriever.retrieve('database', { topK: 10 });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('accessors', () => {
    it('should expose store', () => {
      expect(retriever.store).toBe(vectorStore);
    });

    it('should expose provider', () => {
      expect(retriever.provider).toBe(embeddingProvider);
    });
  });
});
