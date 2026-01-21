/**
 * RAG Pipeline E2E Tests
 *
 * End-to-end tests validating the complete document→chunks→embeddings→storage→retrieval pipeline.
 * These tests use real components (not mocks) to ensure integration works correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';

import {
  // Document Loaders
  defaultRegistry,
  LoaderError,
  // Chunking
  FixedSizeChunker,
  RecursiveChunker,
  // Vector Store
  InMemoryVectorStore,
  // Retrieval
  DenseRetriever,
  // Assembly
  XMLAssembler,
  MarkdownAssembler,
  // RAG Engine
  RAGEngineImpl,
  RAGEngineError,
} from '../../src/index.js';

import {
  DeterministicEmbeddingProvider,
  getFixturePath,
  ingestDocuments,
  measureLatency,
  cosineSimilarity,
  assertResultsSortedByScore,
  createTestDocument,
  generateTestDocuments,
} from './helpers.js';

// ============================================================================
// Test Setup
// ============================================================================

describe('RAG Pipeline E2E', () => {
  let embedder: DeterministicEmbeddingProvider;
  let store: InMemoryVectorStore;

  beforeEach(() => {
    embedder = new DeterministicEmbeddingProvider(128);
    store = new InMemoryVectorStore({ dimensions: 128 });
  });

  afterEach(async () => {
    await store.clear();
  });

  // ==========================================================================
  // Basic Pipeline Tests
  // ==========================================================================

  describe('basic pipeline', () => {
    it('ingests markdown document and retrieves relevant chunks', async () => {
      // Step 1: Load document
      const filePath = getFixturePath('sample.md');
      const content = await readFile(filePath, 'utf-8');
      const document = createTestDocument(content, filePath);

      // Step 2: Chunk the document
      const chunker = new FixedSizeChunker({
        chunkSize: 200,
        chunkOverlap: 50,
        sizeUnit: 'tokens',
      });

      // Step 3: Ingest through pipeline
      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Verify chunking
      expect(result.chunks.length).toBeGreaterThan(1); // Should have multiple chunks
      expect(result.storedIds).toHaveLength(result.chunks.length);

      // Step 4: Search for relevant content
      const query = 'What is supervised learning?';
      const queryEmbedding = await embedder.embed(query);

      const searchResults = await store.search(queryEmbedding.embedding, {
        topK: 3,
        minScore: 0,
      });

      // Verify search results
      expect(searchResults.length).toBeGreaterThan(0);
      assertResultsSortedByScore(searchResults);

      // The top result should contain relevant content
      const topContent = searchResults[0]!.chunk.content.toLowerCase();
      // Should find something related to machine learning topics
      expect(
        topContent.includes('learning') ||
          topContent.includes('machine') ||
          topContent.includes('supervised') ||
          topContent.includes('classification')
      ).toBe(true);
    });

    it('maintains chunk metadata through pipeline', async () => {
      const document = createTestDocument(
        'First section about machine learning. Second section about testing.',
        'test.md',
        { author: 'Test Author', version: 1 }
      );

      const chunker = new RecursiveChunker({
        chunkSize: 50,
        chunkOverlap: 10,
        sizeUnit: 'tokens',
      });

      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
        documentIdPrefix: 'meta-test',
      });

      // Verify metadata preservation
      for (const chunk of result.chunks) {
        expect(chunk.documentId).toBe('meta-test-0'); // documentId is on chunk, not metadata
        expect(chunk.metadata.startIndex).toBeDefined();
        expect(chunk.metadata.endIndex).toBeDefined();
      }

      // Search and verify metadata comes through
      const queryEmbedding = await embedder.embed('machine learning');
      const searchResults = await store.search(queryEmbedding.embedding, { topK: 1 });

      expect(searchResults[0]!.chunk.documentId).toBe('meta-test-0');
    });

    it('returns scored results sorted by relevance', async () => {
      // Create documents with distinct topics
      const docs = [
        createTestDocument(
          'Python is a popular programming language for machine learning and data science.',
          'python.md'
        ),
        createTestDocument(
          'JavaScript is used for web development, both frontend and backend.',
          'javascript.md'
        ),
        createTestDocument(
          'Machine learning algorithms learn patterns from data to make predictions.',
          'ml.md'
        ),
      ];

      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      await ingestDocuments(docs, { chunker, embedder, store });

      // Search for machine learning
      const queryEmbedding = await embedder.embed('machine learning algorithms');
      const results = await store.search(queryEmbedding.embedding, { topK: 5 });

      // Results should be sorted by score
      assertResultsSortedByScore(results);

      // All scores should be between 0 and 1 (for cosine similarity)
      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    });

    it('handles empty search results gracefully', async () => {
      // Don't ingest anything
      const queryEmbedding = await embedder.embed('random query');
      const results = await store.search(queryEmbedding.embedding, { topK: 5 });

      expect(results).toHaveLength(0);
    });

    it('filters results by minScore', async () => {
      const document = createTestDocument(
        'Machine learning is a subset of artificial intelligence.',
        'test.md'
      );

      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });
      await ingestDocuments([document], { chunker, embedder, store });

      // High minScore should filter out low-relevance results
      const queryEmbedding = await embedder.embed('completely unrelated quantum physics topic');
      const results = await store.search(queryEmbedding.embedding, {
        topK: 10,
        minScore: 0.99, // Very high threshold
      });

      // May return no results due to high threshold
      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.99);
      }
    });
  });

  // ==========================================================================
  // Full Pipeline with RAG Engine
  // ==========================================================================

  describe('full pipeline with RAG engine', () => {
    it('orchestrates retrieval and assembly', async () => {
      // Setup: Ingest documents
      const content = await readFile(getFixturePath('sample.md'), 'utf-8');
      const document = createTestDocument(content, 'sample.md');

      const chunker = new FixedSizeChunker({
        chunkSize: 150,
        chunkOverlap: 30,
        sizeUnit: 'tokens',
      });

      await ingestDocuments([document], { chunker, embedder, store });

      // Create RAG engine components
      const retriever = new DenseRetriever(store, embedder);

      const assembler = new XMLAssembler();

      const engine = new RAGEngineImpl({
        retriever,
        assembler,
      });

      // Execute search
      const result = await engine.search('What is deep learning?', {
        topK: 3,
      });

      // Verify result structure
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.estimatedTokens).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
      expect(result.retrievalResults).toBeDefined();
      expect(result.metadata.fromCache).toBe(false);
      expect(result.metadata.retrievedCount).toBeGreaterThan(0);

      // Verify XML format
      expect(result.content).toContain('<source');
    });

    it('respects token budget constraints', async () => {
      // Create a large document
      const largeContent = generateTestDocuments(5)
        .map((d) => d.content)
        .join('\n\n');
      const document = createTestDocument(largeContent, 'large.md');

      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      await ingestDocuments([document], { chunker, embedder, store });

      const retriever = new DenseRetriever(store, embedder);
      const assembler = new MarkdownAssembler();

      const engine = new RAGEngineImpl({
        retriever,
        assembler,
      });

      // Search with small token budget
      const result = await engine.search('software development', {
        topK: 10,
        maxTokens: 200, // Small budget
      });

      // Token count should respect budget
      expect(result.estimatedTokens).toBeLessThanOrEqual(250); // Some overhead allowed
    });

    it('handles search with no results', async () => {
      const retriever = new DenseRetriever(store, embedder);
      const assembler = new XMLAssembler();

      const engine = new RAGEngineImpl({
        retriever,
        assembler,
      });

      // Search empty store
      const result = await engine.search('any query');

      expect(result.content).toBeDefined();
      expect(result.retrievalResults).toHaveLength(0);
      expect(result.metadata.retrievedCount).toBe(0);
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('propagates loader errors with context', async () => {
      // Try to load non-existent file
      await expect(
        defaultRegistry.load('/non/existent/file.md')
      ).rejects.toThrow(LoaderError);
    });

    it('handles empty document gracefully', async () => {
      const document = createTestDocument('', 'empty.md');

      const chunker = new FixedSizeChunker({ chunkSize: 100, sizeUnit: 'tokens' });

      // Empty document should throw ChunkerError
      await expect(
        ingestDocuments([document], { chunker, embedder, store })
      ).rejects.toThrow('Document content is empty');
    });

    it('validates embedding dimensions', async () => {
      // Create embedder with different dimensions
      const wrongEmbedder = new DeterministicEmbeddingProvider(256); // Store expects 128

      const document = createTestDocument('Test content for dimension validation', 'test.md');
      const chunker = new FixedSizeChunker({ chunkSize: 50, sizeUnit: 'tokens' });

      // Chunk the document properly (needs full Document type)
      const chunks = await chunker.chunk(document);
      const texts = chunks.map((c) => c.content);
      const embeddings = await wrongEmbedder.embedBatch(texts);

      const chunksWithEmbeddings = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings[i]!.embedding,
      }));

      // Store should reject wrong dimensions
      await expect(store.insert(chunksWithEmbeddings)).rejects.toThrow();
    });

    it('throws on empty query in RAG engine', async () => {
      const retriever = new DenseRetriever(store, embedder);
      const assembler = new XMLAssembler();
      const engine = new RAGEngineImpl({ retriever, assembler });

      await expect(engine.search('')).rejects.toThrow(RAGEngineError);
      await expect(engine.search('   ')).rejects.toThrow(RAGEngineError);
    });
  });

  // ==========================================================================
  // Performance Benchmarks
  // ==========================================================================

  describe('performance benchmarks', () => {
    it('ingests 20 documents within acceptable time', async () => {
      const docs = generateTestDocuments(20);

      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      const { latencyMs } = await measureLatency(() =>
        ingestDocuments(docs, { chunker, embedder, store })
      );

      // Should complete in reasonable time (adjust threshold as needed)
      expect(latencyMs).toBeLessThan(5000); // 5 seconds

      // Verify ingestion succeeded
      const count = await store.count();
      expect(count).toBeGreaterThanOrEqual(20); // At least 1 chunk per doc
    });

    it('search latency is acceptable', async () => {
      // Setup: Ingest some documents
      const docs = generateTestDocuments(10);
      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });
      await ingestDocuments(docs, { chunker, embedder, store });

      // Measure search latency
      const queryEmbedding = await embedder.embed('software testing');

      const { latencyMs } = await measureLatency(() =>
        store.search(queryEmbedding.embedding, { topK: 5 })
      );

      // Search should be fast with InMemoryVectorStore
      expect(latencyMs).toBeLessThan(100); // 100ms
    });

    it('full RAG engine query latency', async () => {
      // Setup
      const docs = generateTestDocuments(10);
      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });
      await ingestDocuments(docs, { chunker, embedder, store });

      const retriever = new DenseRetriever(store, embedder);
      const assembler = new XMLAssembler();
      const engine = new RAGEngineImpl({ retriever, assembler });

      // Measure end-to-end latency
      const { result, latencyMs } = await measureLatency(() =>
        engine.search('machine learning best practices', { topK: 5 })
      );

      // Should complete quickly
      expect(latencyMs).toBeLessThan(500); // 500ms

      // Verify timing metadata
      expect(result.metadata.timings.totalMs).toBeLessThan(latencyMs + 10);
    });
  });

  // ==========================================================================
  // Embedding Similarity Verification
  // ==========================================================================

  describe('embedding similarity verification', () => {
    it('similar texts produce similar embeddings', async () => {
      const text1 = 'Machine learning is a subset of artificial intelligence.';
      const text2 = 'Artificial intelligence includes machine learning as a subset.';
      const text3 = 'The weather is sunny today with clear skies.';

      const [emb1, emb2, emb3] = await embedder.embedBatch([text1, text2, text3]);

      const sim12 = cosineSimilarity(emb1!.embedding, emb2!.embedding);
      const sim13 = cosineSimilarity(emb1!.embedding, emb3!.embedding);
      const sim23 = cosineSimilarity(emb2!.embedding, emb3!.embedding);

      // Similar texts should have higher similarity
      expect(sim12).toBeGreaterThan(sim13);
      expect(sim12).toBeGreaterThan(sim23);
    });

    it('same text produces identical embeddings', async () => {
      const text = 'Deterministic embeddings are reproducible.';

      const emb1 = await embedder.embed(text);
      const emb2 = await embedder.embed(text);

      expect(emb1.embedding).toEqual(emb2.embedding);
      expect(cosineSimilarity(emb1.embedding, emb2.embedding)).toBe(1);
    });

    it('embeddings are normalized', async () => {
      const texts = [
        'Short text.',
        'A much longer text that contains many more words and tokens.',
        'Machine learning algorithms process data.',
      ];

      const embeddings = await embedder.embedBatch(texts);

      for (const result of embeddings) {
        // L2 norm should be ~1 for normalized vectors
        const norm = Math.sqrt(
          result.embedding.reduce((sum, v) => sum + v * v, 0)
        );
        expect(norm).toBeCloseTo(1, 5);
      }
    });
  });
});
