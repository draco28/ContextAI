/**
 * Vector Stores E2E Tests
 *
 * End-to-end tests for all 3 vector store implementations:
 * - InMemoryVectorStore (always available)
 * - PgVectorStore (requires PostgreSQL)
 * - ChromaVectorStore (requires Chroma server)
 *
 * Tests run against InMemory by default. PG and Chroma tests skip gracefully
 * if their services are unavailable, ensuring CI passes.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';

import {
  // Chunking
  FixedSizeChunker,
  // Vector Stores
  InMemoryVectorStore,
  VectorStoreError,
  // Types
  type VectorStore,
  type ChunkWithEmbedding,
} from '../../src/index.js';

import {
  DeterministicEmbeddingProvider,
  getFixturePath,
  ingestDocuments,
  createTestDocument,
  isPgAvailable,
  isChromaAvailable,
  cosineSimilarity,
} from './helpers.js';

// Lazy imports for optional stores
let PgVectorStore: typeof import('../../src/vector-store/pg-store.js').PgVectorStore | undefined;
let ChromaVectorStore: typeof import('../../src/vector-store/chroma-store.js').ChromaVectorStore | undefined;

// ============================================================================
// Environment Detection
// ============================================================================

let pgAvailable = false;
let chromaAvailable = false;

beforeAll(async () => {
  [pgAvailable, chromaAvailable] = await Promise.all([
    isPgAvailable(),
    isChromaAvailable(),
  ]);

  // Lazy load stores only if available
  if (pgAvailable) {
    try {
      const module = await import('../../src/vector-store/pg-store.js');
      PgVectorStore = module.PgVectorStore;
    } catch {
      pgAvailable = false;
    }
  }

  if (chromaAvailable) {
    try {
      const module = await import('../../src/vector-store/chroma-store.js');
      ChromaVectorStore = module.ChromaVectorStore;
    } catch {
      chromaAvailable = false;
    }
  }
});

// ============================================================================
// Test Helpers
// ============================================================================

const DIMENSIONS = 128;

function createTestChunks(count: number, embedder: DeterministicEmbeddingProvider): ChunkWithEmbedding[] {
  const chunks: ChunkWithEmbedding[] = [];

  for (let i = 0; i < count; i++) {
    const content = `Test chunk ${i}: This is sample content about topic ${i % 5}`;
    const embedding = Array(DIMENSIONS).fill(0).map((_, j) => Math.sin((i + j) * 0.1));

    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    const normalizedEmbedding = embedding.map((v) => v / magnitude);

    chunks.push({
      id: `chunk-${i}`,
      content,
      metadata: {
        index: i,
        topic: i % 5,
        startIndex: i * 100,
        endIndex: (i + 1) * 100,
      },
      documentId: `doc-${Math.floor(i / 10)}`,
      embedding: normalizedEmbedding,
    });
  }

  return chunks;
}

// ============================================================================
// InMemory Vector Store Tests
// ============================================================================

describe('Vector Stores E2E', () => {
  describe('InMemoryVectorStore', () => {
    let embedder: DeterministicEmbeddingProvider;
    let store: InMemoryVectorStore;

    beforeEach(() => {
      embedder = new DeterministicEmbeddingProvider(DIMENSIONS);
      store = new InMemoryVectorStore({ dimensions: DIMENSIONS });
    });

    afterEach(async () => {
      await store.clear();
    });

    it('stores and retrieves chunks with metadata filtering', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      // Verify count
      expect(await store.count()).toBe(20);

      // Search without filter
      const query = chunks[0]!.embedding;
      const allResults = await store.search(query, { topK: 10 });
      expect(allResults.length).toBe(10);

      // Search with metadata filter
      const filteredResults = await store.search(query, {
        topK: 10,
        filter: { topic: 0 }, // Only topic 0 chunks
      });

      // All filtered results should have topic 0
      for (const result of filteredResults) {
        expect(result.chunk.metadata.topic).toBe(0);
      }
    });

    it('handles concurrent insert operations', async () => {
      const batches = [
        createTestChunks(10, embedder).map((c) => ({ ...c, id: `batch1-${c.id}` })),
        createTestChunks(10, embedder).map((c) => ({ ...c, id: `batch2-${c.id}` })),
        createTestChunks(10, embedder).map((c) => ({ ...c, id: `batch3-${c.id}` })),
      ];

      // Insert all batches concurrently
      await Promise.all(batches.map((batch) => store.insert(batch)));

      // All chunks should be stored
      expect(await store.count()).toBe(30);
    });

    it('handles upsert correctly', async () => {
      const chunks = createTestChunks(5, embedder);
      await store.insert(chunks);

      // Modify and upsert
      const updatedChunks = chunks.map((c) => ({
        ...c,
        content: `Updated: ${c.content}`,
      }));
      await store.upsert(updatedChunks);

      // Count should remain the same
      expect(await store.count()).toBe(5);

      // Content should be updated
      const results = await store.search(chunks[0]!.embedding, { topK: 1 });
      expect(results[0]!.chunk.content).toContain('Updated');
    });

    it('deletes chunks by ID', async () => {
      const chunks = createTestChunks(10, embedder);
      await store.insert(chunks);

      // Delete some chunks
      await store.delete(['chunk-0', 'chunk-1', 'chunk-2']);

      // Count should reflect deletion
      expect(await store.count()).toBe(7);

      // Deleted chunks should not appear in search
      const results = await store.search(chunks[0]!.embedding, { topK: 10 });
      const resultIds = results.map((r) => r.id);
      expect(resultIds).not.toContain('chunk-0');
      expect(resultIds).not.toContain('chunk-1');
      expect(resultIds).not.toContain('chunk-2');
    });

    it('returns results sorted by similarity', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      const results = await store.search(chunks[5]!.embedding, { topK: 10 });

      // Results should be sorted by score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]!.score).toBeLessThanOrEqual(results[i - 1]!.score);
      }

      // First result should be the query chunk itself (score = 1)
      expect(results[0]!.id).toBe('chunk-5');
      expect(results[0]!.score).toBeCloseTo(1, 5);
    });

    it('applies minScore filter', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      // Search with high minScore
      const results = await store.search(chunks[0]!.embedding, {
        topK: 20,
        minScore: 0.9,
      });

      // All results should meet minimum score
      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('works in full pipeline with document ingestion', async () => {
      const content = await readFile(getFixturePath('sample.md'), 'utf-8');
      const document = createTestDocument(content, 'sample.md');

      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Verify pipeline success
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(await store.count()).toBe(result.chunks.length);

      // Search should work
      const queryEmb = await embedder.embed('machine learning algorithms');
      const searchResults = await store.search(queryEmb.embedding, { topK: 3 });
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('supports complex metadata filters', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      // Filter with $gte operator
      const results = await store.search(chunks[0]!.embedding, {
        topK: 10,
        filter: { index: { $gte: 10 } },
      });

      for (const result of results) {
        expect(result.chunk.metadata.index).toBeGreaterThanOrEqual(10);
      }
    });

    it('handles empty filter gracefully', async () => {
      const chunks = createTestChunks(10, embedder);
      await store.insert(chunks);

      // Empty filter should return all matching results
      const results = await store.search(chunks[0]!.embedding, {
        topK: 5,
        filter: {},
      });

      expect(results.length).toBe(5);
    });
  });

  // ==========================================================================
  // PgVector Store Tests (Skip if not available)
  // ==========================================================================

  describe.skipIf(!pgAvailable)('PgVectorStore', () => {
    let embedder: DeterministicEmbeddingProvider;
    let store: VectorStore;

    beforeEach(async () => {
      embedder = new DeterministicEmbeddingProvider(DIMENSIONS);

      // Create store with test table
      store = new PgVectorStore!({
        dimensions: DIMENSIONS,
        connectionString: process.env.PG_CONNECTION_STRING ?? 'postgresql://localhost:5432/test',
        tableName: `test_vectors_${Date.now()}`, // Unique table per test
        indexType: 'none', // No index for faster test setup
      });
    });

    afterEach(async () => {
      await store.clear();
    });

    it('creates table and stores chunks', async () => {
      const chunks = createTestChunks(10, embedder);
      await store.insert(chunks);

      expect(await store.count()).toBe(10);
    });

    it('performs vector similarity search', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      const results = await store.search(chunks[5]!.embedding, { topK: 5 });

      expect(results.length).toBe(5);
      expect(results[0]!.id).toBe('chunk-5');
    });

    it('supports metadata JSONB filtering', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      const results = await store.search(chunks[0]!.embedding, {
        topK: 10,
        filter: { topic: 0 },
      });

      for (const result of results) {
        expect(result.chunk.metadata.topic).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Chroma Store Tests (Skip if not available)
  // ==========================================================================

  describe.skipIf(!chromaAvailable)('ChromaVectorStore', () => {
    let embedder: DeterministicEmbeddingProvider;
    let store: VectorStore;

    beforeEach(async () => {
      embedder = new DeterministicEmbeddingProvider(DIMENSIONS);

      // Create store with test collection
      store = new ChromaVectorStore!({
        dimensions: DIMENSIONS,
        collectionName: `test_collection_${Date.now()}`,
        mode: 'server',
        serverUrl: process.env.CHROMA_URL ?? 'http://localhost:8000',
      });
    });

    afterEach(async () => {
      await store.clear();
    });

    it('manages collections and stores chunks', async () => {
      const chunks = createTestChunks(10, embedder);
      await store.insert(chunks);

      expect(await store.count()).toBe(10);
    });

    it('performs similarity search', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      const results = await store.search(chunks[5]!.embedding, { topK: 5 });

      expect(results.length).toBe(5);
    });

    it('translates metadata filters correctly', async () => {
      const chunks = createTestChunks(20, embedder);
      await store.insert(chunks);

      const results = await store.search(chunks[0]!.embedding, {
        topK: 10,
        filter: { topic: 0 },
      });

      for (const result of results) {
        expect(result.chunk.metadata.topic).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Cross-Store Consistency Tests
  // ==========================================================================

  describe('cross-store consistency', () => {
    it('produces equivalent results across stores (InMemory)', async () => {
      // This test validates that our test framework works consistently
      const embedder = new DeterministicEmbeddingProvider(DIMENSIONS);
      const store1 = new InMemoryVectorStore({ dimensions: DIMENSIONS });
      const store2 = new InMemoryVectorStore({ dimensions: DIMENSIONS });

      const chunks = createTestChunks(20, embedder);

      // Insert into both stores
      await Promise.all([store1.insert(chunks), store2.insert(chunks)]);

      // Search in both stores
      const query = chunks[0]!.embedding;
      const [results1, results2] = await Promise.all([
        store1.search(query, { topK: 5 }),
        store2.search(query, { topK: 5 }),
      ]);

      // Results should be identical
      expect(results1.length).toBe(results2.length);
      for (let i = 0; i < results1.length; i++) {
        expect(results1[i]!.id).toBe(results2[i]!.id);
        expect(results1[i]!.score).toBeCloseTo(results2[i]!.score, 5);
      }
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    let store: InMemoryVectorStore;

    beforeEach(() => {
      store = new InMemoryVectorStore({ dimensions: DIMENSIONS });
    });

    it('rejects chunks with wrong dimensions', async () => {
      const wrongDimensionChunk: ChunkWithEmbedding = {
        id: 'wrong-dim',
        content: 'Test',
        metadata: {},
        embedding: new Array(256).fill(0.1), // Wrong dimensions
      };

      await expect(store.insert([wrongDimensionChunk])).rejects.toThrow();
    });

    it('rejects query with wrong dimensions', async () => {
      const chunks = createTestChunks(5, new DeterministicEmbeddingProvider(DIMENSIONS));
      await store.insert(chunks);

      const wrongQuery = new Array(256).fill(0.1);
      await expect(store.search(wrongQuery, { topK: 5 })).rejects.toThrow();
    });

    it('handles delete of non-existent IDs gracefully', async () => {
      const chunks = createTestChunks(5, new DeterministicEmbeddingProvider(DIMENSIONS));
      await store.insert(chunks);

      // Should not throw for non-existent IDs
      await expect(
        store.delete(['non-existent-1', 'non-existent-2'])
      ).resolves.not.toThrow();

      // Count should remain unchanged
      expect(await store.count()).toBe(5);
    });
  });
});
