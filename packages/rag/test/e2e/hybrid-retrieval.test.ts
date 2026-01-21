/**
 * Hybrid Retrieval E2E Tests
 *
 * End-to-end tests for the retrieval system:
 * - DenseRetriever (vector similarity search)
 * - BM25Retriever (keyword/sparse search)
 * - HybridRetriever (RRF fusion of dense + sparse)
 *
 * Tests validate:
 * - Individual retriever functionality
 * - Alpha parameter tuning (dense vs sparse balance)
 * - RRF fusion correctness
 * - Score transparency and ranking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';

import {
  // Vector Store
  InMemoryVectorStore,
  // Retrieval
  DenseRetriever,
  BM25Retriever,
  HybridRetriever,
  RetrieverError,
  // RRF utilities
  reciprocalRankFusion,
  rrfScore,
  maxRRFScore,
  DEFAULT_RRF_K,
  // Types
  type BM25Document,
  type RankingList,
  type ChunkWithEmbedding,
} from '../../src/index.js';

import {
  DeterministicEmbeddingProvider,
  getFixturePath,
  ingestDocuments,
  createTestDocument,
  cosineSimilarity,
} from './helpers.js';

// ============================================================================
// Test Setup
// ============================================================================

describe('Hybrid Retrieval E2E', () => {
  const DIMENSIONS = 128;
  let embedder: DeterministicEmbeddingProvider;
  let store: InMemoryVectorStore;

  beforeEach(() => {
    embedder = new DeterministicEmbeddingProvider(DIMENSIONS);
    store = new InMemoryVectorStore({ dimensions: DIMENSIONS });
  });

  afterEach(async () => {
    await store.clear();
  });

  // ==========================================================================
  // Dense Retriever Tests
  // ==========================================================================

  describe('DenseRetriever', () => {
    it('retrieves semantically similar chunks', async () => {
      // Create documents with distinct topics
      const docs = [
        createTestDocument(
          'Machine learning algorithms use neural networks for pattern recognition.',
          'ml.md'
        ),
        createTestDocument(
          'Database indexing improves query performance in PostgreSQL.',
          'db.md'
        ),
        createTestDocument(
          'Deep learning models require large amounts of training data.',
          'dl.md'
        ),
      ];

      // Ingest with fixed-size chunking
      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });
      await ingestDocuments(docs, { chunker, embedder, store });

      // Create dense retriever
      const retriever = new DenseRetriever(store, embedder);

      // Query about machine learning
      const results = await retriever.retrieve('neural network training', {
        topK: 3,
      });

      // Should return results
      expect(results.length).toBeGreaterThan(0);

      // Results should be sorted by score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]!.score).toBeLessThanOrEqual(results[i - 1]!.score);
      }

      // Top result should be ML-related content
      const topContent = results[0]!.chunk.content.toLowerCase();
      expect(
        topContent.includes('learning') ||
          topContent.includes('neural') ||
          topContent.includes('training')
      ).toBe(true);
    });

    it('respects topK limit', async () => {
      const docs = [
        createTestDocument('Document one about testing.', 'doc1.md'),
        createTestDocument('Document two about testing.', 'doc2.md'),
        createTestDocument('Document three about testing.', 'doc3.md'),
        createTestDocument('Document four about testing.', 'doc4.md'),
        createTestDocument('Document five about testing.', 'doc5.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      await ingestDocuments(docs, { chunker, embedder, store });

      const retriever = new DenseRetriever(store, embedder);
      const results = await retriever.retrieve('testing documents', { topK: 2 });

      expect(results.length).toBe(2);
    });

    it('applies minScore filter', async () => {
      const docs = [
        createTestDocument('Machine learning is fascinating.', 'ml.md'),
        createTestDocument('The weather is nice today.', 'weather.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      await ingestDocuments(docs, { chunker, embedder, store });

      const retriever = new DenseRetriever(store, embedder);

      // High minScore should filter low-relevance results
      const results = await retriever.retrieve('machine learning algorithms', {
        topK: 10,
        minScore: 0.8,
      });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('throws error for empty query', async () => {
      const retriever = new DenseRetriever(store, embedder);

      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
      await expect(retriever.retrieve('   ')).rejects.toThrow(RetrieverError);
    });
  });

  // ==========================================================================
  // BM25 Retriever Tests
  // ==========================================================================

  describe('BM25Retriever', () => {
    it('retrieves documents by keyword matching', async () => {
      const retriever = new BM25Retriever({ k1: 1.2, b: 0.75 });

      // Build index with documents
      const documents: BM25Document[] = [
        {
          id: 'doc1',
          content: 'PostgreSQL is a powerful relational database system.',
          chunk: {
            id: 'doc1',
            content: 'PostgreSQL is a powerful relational database system.',
            metadata: {},
          },
        },
        {
          id: 'doc2',
          content: 'MySQL is another popular database management system.',
          chunk: {
            id: 'doc2',
            content: 'MySQL is another popular database management system.',
            metadata: {},
          },
        },
        {
          id: 'doc3',
          content: 'Redis is an in-memory key-value store.',
          chunk: {
            id: 'doc3',
            content: 'Redis is an in-memory key-value store.',
            metadata: {},
          },
        },
      ];

      retriever.buildIndex(documents);

      // Search for PostgreSQL
      const results = await retriever.retrieve('PostgreSQL database', { topK: 3 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.id).toBe('doc1'); // PostgreSQL doc should be first
      expect(results[0]!.chunk.content).toContain('PostgreSQL');
    });

    it('handles exact keyword matches effectively', async () => {
      const retriever = new BM25Retriever();

      const documents: BM25Document[] = [
        {
          id: 'hnsw',
          content: 'HNSW is a graph-based algorithm for approximate nearest neighbor search.',
          chunk: {
            id: 'hnsw',
            content: 'HNSW is a graph-based algorithm for approximate nearest neighbor search.',
            metadata: {},
          },
        },
        {
          id: 'ivf',
          content: 'IVF uses clustering for fast similarity search in high-dimensional spaces.',
          chunk: {
            id: 'ivf',
            content: 'IVF uses clustering for fast similarity search in high-dimensional spaces.',
            metadata: {},
          },
        },
        {
          id: 'general',
          content: 'Vector databases enable semantic search over embeddings.',
          chunk: {
            id: 'general',
            content: 'Vector databases enable semantic search over embeddings.',
            metadata: {},
          },
        },
      ];

      retriever.buildIndex(documents);

      // Exact keyword search for HNSW
      const results = await retriever.retrieve('HNSW algorithm', { topK: 3 });

      expect(results[0]!.id).toBe('hnsw');
    });

    it('normalizes scores to 0-1 range', async () => {
      const retriever = new BM25Retriever();

      const documents: BM25Document[] = [
        {
          id: 'doc1',
          content: 'Testing document one about software quality.',
          chunk: { id: 'doc1', content: 'Testing document one.', metadata: {} },
        },
        {
          id: 'doc2',
          content: 'Testing document two about testing methodologies.',
          chunk: { id: 'doc2', content: 'Testing document two.', metadata: {} },
        },
      ];

      retriever.buildIndex(documents);

      const results = await retriever.retrieve('testing software', { topK: 10 });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    });

    it('throws error if index not built', async () => {
      const retriever = new BM25Retriever();

      await expect(retriever.retrieve('query')).rejects.toThrow(RetrieverError);
    });

    it('returns document count and vocabulary size', async () => {
      const retriever = new BM25Retriever();

      const documents: BM25Document[] = [
        {
          id: 'doc1',
          content: 'Hello world from document one.',
          chunk: { id: 'doc1', content: 'Hello world.', metadata: {} },
        },
        {
          id: 'doc2',
          content: 'Hello there from document two.',
          chunk: { id: 'doc2', content: 'Hello there.', metadata: {} },
        },
      ];

      retriever.buildIndex(documents);

      expect(retriever.documentCount).toBe(2);
      expect(retriever.vocabularySize).toBeGreaterThan(0);
      expect(retriever.averageDocumentLength).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // RRF Utility Tests
  // ==========================================================================

  describe('RRF (Reciprocal Rank Fusion)', () => {
    it('calculates RRF score correctly', () => {
      // RRF score for rank 1 with default k=60 should be 1/(60+1) = 0.0164
      const score1 = rrfScore(1, 60);
      expect(score1).toBeCloseTo(1 / 61, 5);

      // Rank 10 should be 1/(60+10) = 1/70
      const score10 = rrfScore(10, 60);
      expect(score10).toBeCloseTo(1 / 70, 5);
    });

    it('calculates max RRF score for multiple rankers', () => {
      // Max score with 2 rankers = 2 * 1/(k+1)
      const max2 = maxRRFScore(2, 60);
      expect(max2).toBeCloseTo(2 / 61, 5);

      // Max score with 3 rankers = 3 * 1/(k+1)
      const max3 = maxRRFScore(3, 60);
      expect(max3).toBeCloseTo(3 / 61, 5);
    });

    it('fuses rankings correctly', () => {
      const denseRanking: RankingList = {
        name: 'dense',
        items: [
          { id: 'a', rank: 1, score: 0.95, chunk: { id: 'a', content: 'A', metadata: {} } },
          { id: 'b', rank: 2, score: 0.85, chunk: { id: 'b', content: 'B', metadata: {} } },
          { id: 'c', rank: 3, score: 0.75, chunk: { id: 'c', content: 'C', metadata: {} } },
        ],
      };

      const sparseRanking: RankingList = {
        name: 'sparse',
        items: [
          { id: 'b', rank: 1, score: 0.90, chunk: { id: 'b', content: 'B', metadata: {} } },
          { id: 'a', rank: 2, score: 0.80, chunk: { id: 'a', content: 'A', metadata: {} } },
          { id: 'd', rank: 3, score: 0.70, chunk: { id: 'd', content: 'D', metadata: {} } },
        ],
      };

      const fused = reciprocalRankFusion([denseRanking, sparseRanking], DEFAULT_RRF_K);

      // 'b' appears in both lists (rank 2 in dense, rank 1 in sparse)
      // 'a' appears in both lists (rank 1 in dense, rank 2 in sparse)
      // Both should have equal fused scores since (1/61 + 1/62) = (1/62 + 1/61)

      // Items appearing in both lists should be ranked higher
      const topIds = fused.slice(0, 2).map((r) => r.id);
      expect(topIds).toContain('a');
      expect(topIds).toContain('b');

      // 'c' only in dense, 'd' only in sparse - should be ranked lower
      expect(fused.length).toBe(4); // a, b, c, d
    });

    it('provides contribution transparency', () => {
      const ranking1: RankingList = {
        name: 'dense',
        items: [
          { id: 'doc1', rank: 1, score: 0.9, chunk: { id: 'doc1', content: 'Test', metadata: {} } },
        ],
      };

      const ranking2: RankingList = {
        name: 'sparse',
        items: [
          { id: 'doc2', rank: 1, score: 0.8, chunk: { id: 'doc2', content: 'Test 2', metadata: {} } },
        ],
      };

      const fused = reciprocalRankFusion([ranking1, ranking2]);

      // Each result should have contributions from both rankers
      for (const result of fused) {
        expect(result.contributions).toHaveLength(2);

        const denseContrib = result.contributions.find((c) => c.name === 'dense');
        const sparseContrib = result.contributions.find((c) => c.name === 'sparse');

        expect(denseContrib).toBeDefined();
        expect(sparseContrib).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Hybrid Retriever Tests
  // ==========================================================================

  describe('HybridRetriever', () => {
    it('combines dense and sparse retrieval', async () => {
      // Ingest documents into vector store
      const docs = [
        createTestDocument(
          'PostgreSQL is a powerful open-source relational database.',
          'pg.md'
        ),
        createTestDocument(
          'MySQL is another popular relational database system.',
          'mysql.md'
        ),
        createTestDocument(
          'Redis is an in-memory data structure store.',
          'redis.md'
        ),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      // Create hybrid retriever
      const retriever = new HybridRetriever(store, embedder);

      // Build BM25 index
      const bm25Docs: BM25Document[] = chunksWithEmbeddings.map((c) => ({
        id: c.id,
        content: c.content,
        chunk: { id: c.id, content: c.content, metadata: c.metadata },
      }));
      retriever.buildIndex(bm25Docs);

      // Hybrid search
      const results = await retriever.retrieve('PostgreSQL database', {
        topK: 3,
        alpha: 0.5, // Balanced
      });

      expect(results.length).toBeGreaterThan(0);

      // Results should have hybrid scores
      for (const result of results) {
        expect(result.scores).toBeDefined();
        expect(result.scores!.dense).toBeGreaterThanOrEqual(0);
        expect(result.scores!.sparse).toBeGreaterThanOrEqual(0);
        expect(result.scores!.fused).toBeGreaterThanOrEqual(0);
      }
    });

    it('respects alpha=0 for pure sparse search', async () => {
      const docs = [
        createTestDocument('HNSW algorithm for vector search.', 'hnsw.md'),
        createTestDocument('IVF indexing technique.', 'ivf.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      // Pure sparse search (BM25 only)
      const results = await retriever.retrieve('HNSW', { topK: 2, alpha: 0 });

      expect(results.length).toBeGreaterThan(0);

      // Should have sparse score but zero dense
      expect(results[0]!.scores!.dense).toBe(0);
      expect(results[0]!.scores!.sparse).toBeGreaterThan(0);
    });

    it('respects alpha=1 for pure dense search', async () => {
      const docs = [
        createTestDocument('Machine learning with neural networks.', 'ml.md'),
        createTestDocument('Deep learning models.', 'dl.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      // Pure dense search (vector only)
      const results = await retriever.retrieve('neural network training', {
        topK: 2,
        alpha: 1,
      });

      expect(results.length).toBeGreaterThan(0);

      // Should have dense score but zero sparse
      expect(results[0]!.scores!.dense).toBeGreaterThan(0);
      expect(results[0]!.scores!.sparse).toBe(0);
    });

    it('provides rank transparency', async () => {
      const docs = [
        createTestDocument('Document about PostgreSQL database administration.', 'pg.md'),
        createTestDocument('Guide to MySQL database management.', 'mysql.md'),
        createTestDocument('Overview of database concepts and systems.', 'overview.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      const results = await retriever.retrieve('database management system', {
        topK: 3,
        alpha: 0.5,
      });

      // Results should have rank transparency
      for (const result of results) {
        // At least one rank should be defined (found in at least one retriever)
        expect(result.denseRank !== undefined || result.sparseRank !== undefined).toBe(
          true
        );
      }
    });

    it('validates alpha parameter range', async () => {
      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex([]);

      // Alpha < 0 should throw
      await expect(
        retriever.retrieve('test', { alpha: -0.1 })
      ).rejects.toThrow(RetrieverError);

      // Alpha > 1 should throw
      await expect(
        retriever.retrieve('test', { alpha: 1.5 })
      ).rejects.toThrow(RetrieverError);
    });

    it('throws on invalid default alpha in config', () => {
      expect(() => {
        new HybridRetriever(store, embedder, { defaultAlpha: -0.5 });
      }).toThrow(RetrieverError);

      expect(() => {
        new HybridRetriever(store, embedder, { defaultAlpha: 2 });
      }).toThrow(RetrieverError);
    });

    it('exposes underlying retrievers', async () => {
      const retriever = new HybridRetriever(store, embedder, {
        name: 'TestHybrid',
      });

      // Should be able to access component retrievers
      expect(retriever.dense).toBeInstanceOf(DenseRetriever);
      expect(retriever.sparse).toBeInstanceOf(BM25Retriever);
      expect(retriever.name).toBe('TestHybrid');
      expect(retriever.isIndexBuilt).toBe(false);

      // After building index with documents
      retriever.buildIndex([
        {
          id: 'test-doc',
          content: 'Test document content',
          chunk: { id: 'test-doc', content: 'Test document content', metadata: {} },
        },
      ]);
      expect(retriever.isIndexBuilt).toBe(true);
    });
  });

  // ==========================================================================
  // Integration: Full Pipeline with Hybrid Retrieval
  // ==========================================================================

  describe('full pipeline integration', () => {
    it('ingests documents and retrieves with hybrid search', async () => {
      // Load real fixture content
      const content = await readFile(getFixturePath('sample-technical.md'), 'utf-8');
      const document = createTestDocument(content, 'technical.md');

      // Chunk the document
      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({
        chunkSize: 150,
        chunkOverlap: 30,
        sizeUnit: 'tokens',
      });

      const { chunksWithEmbeddings } = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Create hybrid retriever and build index
      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      // Query that benefits from both dense and sparse
      const results = await retriever.retrieve('HNSW graph nearest neighbor search', {
        topK: 5,
        alpha: 0.6, // Slightly favor dense for semantic matching
      });

      expect(results.length).toBeGreaterThan(0);

      // Top result should be about HNSW (exact keyword) or nearest neighbor (semantic)
      const topContent = results[0]!.chunk.content.toLowerCase();
      expect(
        topContent.includes('hnsw') ||
          topContent.includes('nearest') ||
          topContent.includes('graph')
      ).toBe(true);

      // Should have score transparency
      expect(results[0]!.scores).toBeDefined();
    });

    it('handles semantic paraphrase queries', async () => {
      const docs = [
        createTestDocument(
          'Vector similarity search finds documents with similar embeddings.',
          'semantic.md'
        ),
        createTestDocument(
          'BM25 algorithm matches documents by term frequency.',
          'bm25.md'
        ),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      // Paraphrased query (no exact keywords match "embeddings" or "similarity")
      const results = await retriever.retrieve('finding related content using vectors', {
        topK: 2,
        alpha: 0.8, // Favor dense for semantic understanding
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('handles exact technical term queries', async () => {
      const docs = [
        createTestDocument('HNSW uses a hierarchical graph structure.', 'hnsw.md'),
        createTestDocument('IVF partitions data into clusters.', 'ivf.md'),
      ];

      const { FixedSizeChunker } = await import('../../src/index.js');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      const { chunksWithEmbeddings } = await ingestDocuments(docs, {
        chunker,
        embedder,
        store,
      });

      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex(
        chunksWithEmbeddings.map((c) => ({
          id: c.id,
          content: c.content,
          chunk: { id: c.id, content: c.content, metadata: c.metadata },
        }))
      );

      // Exact technical term that BM25 excels at
      const results = await retriever.retrieve('HNSW', {
        topK: 2,
        alpha: 0.3, // Favor sparse for exact keyword
      });

      expect(results.length).toBeGreaterThan(0);

      // HNSW document should rank higher with sparse-favoring alpha
      const hnswResult = results.find((r) =>
        r.chunk.content.toLowerCase().includes('hnsw')
      );
      expect(hnswResult).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('DenseRetriever throws on empty query', async () => {
      const retriever = new DenseRetriever(store, embedder);

      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
    });

    it('BM25Retriever throws on empty query', async () => {
      const retriever = new BM25Retriever();
      retriever.buildIndex([]);

      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
    });

    it('HybridRetriever throws on empty query', async () => {
      const retriever = new HybridRetriever(store, embedder);
      retriever.buildIndex([]);

      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
    });

    it('BM25Retriever handles empty document set', async () => {
      const retriever = new BM25Retriever();
      retriever.buildIndex([]);

      const results = await retriever.retrieve('any query');
      expect(results).toHaveLength(0);
    });
  });
});
