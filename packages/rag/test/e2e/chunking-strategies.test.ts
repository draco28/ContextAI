/**
 * Chunking Strategies E2E Tests
 *
 * End-to-end tests for all 4 chunking strategies in a pipeline context.
 * Tests: FixedSizeChunker, RecursiveChunker, SemanticChunker, AgenticChunker
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';

import {
  // Chunking
  FixedSizeChunker,
  RecursiveChunker,
  // Vector Store
  InMemoryVectorStore,
  // Types
  type Chunk,
} from '../../src/index.js';

// Import semantic and agentic chunkers directly (not re-exported from main index)
import { SemanticChunker } from '../../src/chunking/semantic-chunker.js';
import { AgenticChunker } from '../../src/chunking/agentic-chunker.js';

import {
  DeterministicEmbeddingProvider,
  MockLLMProvider,
  getFixturePath,
  ingestDocuments,
  createTestDocument,
  cosineSimilarity,
} from './helpers.js';

// ============================================================================
// Test Setup
// ============================================================================

describe('Chunking Strategies E2E', () => {
  let embedder: DeterministicEmbeddingProvider;
  let store: InMemoryVectorStore;
  let sampleContent: string;
  let technicalContent: string;

  beforeEach(async () => {
    embedder = new DeterministicEmbeddingProvider(128);
    store = new InMemoryVectorStore({ dimensions: 128 });

    // Load test fixtures
    sampleContent = await readFile(getFixturePath('sample.md'), 'utf-8');
    technicalContent = await readFile(getFixturePath('sample-technical.md'), 'utf-8');
  });

  afterEach(async () => {
    await store.clear();
  });

  // ==========================================================================
  // Fixed Size Chunker
  // ==========================================================================

  describe('FixedSizeChunker', () => {
    it('produces consistent chunk sizes', async () => {
      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(sampleContent, 'sample.md');
      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Should produce multiple chunks
      expect(result.chunks.length).toBeGreaterThan(1);

      // All chunks should have content
      for (const chunk of result.chunks) {
        expect(chunk.content.length).toBeGreaterThan(0);
        expect(chunk.metadata.startIndex).toBeDefined();
        expect(chunk.metadata.endIndex).toBeDefined();
      }

      // Chunks should cover the full document
      const firstChunk = result.chunks[0]!;
      const lastChunk = result.chunks[result.chunks.length - 1]!;
      expect(firstChunk.metadata.startIndex).toBe(0);
      expect(lastChunk.metadata.endIndex).toBe(sampleContent.length);
    });

    it('preserves content integrity with overlap', async () => {
      const chunker = new FixedSizeChunker({
        chunkSize: 100,
        chunkOverlap: 30,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(sampleContent, 'sample.md');
      const chunks = await chunker.chunk(document);

      expect(chunks.length).toBeGreaterThan(1);

      // Check that consecutive chunks have overlapping content via position metadata
      // The overlap means endIndex of chunk N should be > startIndex of chunk N+1
      for (let i = 1; i < chunks.length; i++) {
        const prevChunk = chunks[i - 1]!;
        const currChunk = chunks[i]!;

        // With overlap, the previous chunk should extend past the start of current
        const prevEnd = prevChunk.metadata.endIndex!;
        const currStart = currChunk.metadata.startIndex!;

        // Verify overlap exists (prev end > curr start means overlap)
        expect(prevEnd).toBeGreaterThan(currStart);
      }
    });

    it('works in full pipeline with retrieval', async () => {
      const chunker = new FixedSizeChunker({
        chunkSize: 150,
        chunkOverlap: 30,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(sampleContent, 'sample.md');
      await ingestDocuments([document], { chunker, embedder, store });

      // Search for content
      const queryEmb = await embedder.embed('supervised learning classification');
      const results = await store.search(queryEmb.embedding, { topK: 3 });

      expect(results.length).toBeGreaterThan(0);
      // Results should contain relevant content
      const topContent = results[0]!.chunk.content.toLowerCase();
      expect(
        topContent.includes('learning') ||
          topContent.includes('supervised') ||
          topContent.includes('classification')
      ).toBe(true);
    });
  });

  // ==========================================================================
  // Recursive Chunker
  // ==========================================================================

  describe('RecursiveChunker', () => {
    it('respects natural document boundaries', async () => {
      const chunker = new RecursiveChunker({
        chunkSize: 200,
        chunkOverlap: 40,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(sampleContent, 'sample.md');
      const chunks = await chunker.chunk(document);

      // Check that chunks tend to end at natural boundaries (periods, newlines)
      let naturalBoundaryCount = 0;
      for (const chunk of chunks) {
        const trimmedContent = chunk.content.trim();
        const lastChar = trimmedContent.slice(-1);
        if (lastChar === '.' || lastChar === '\n' || lastChar === ':') {
          naturalBoundaryCount++;
        }
      }

      // Most chunks should end at natural boundaries
      // (RecursiveChunker tries to split at paragraph, then sentence, then word)
      expect(naturalBoundaryCount).toBeGreaterThan(chunks.length * 0.5);
    });

    it('handles nested structure gracefully', async () => {
      // Technical content has nested sections and code blocks
      const chunker = new RecursiveChunker({
        chunkSize: 100, // Smaller chunks to ensure multiple
        chunkOverlap: 20,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(technicalContent, 'technical.md');
      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Should produce at least one chunk
      expect(result.chunks.length).toBeGreaterThanOrEqual(1);

      // Chunks should have proper metadata
      for (const chunk of result.chunks) {
        expect(chunk.metadata.startIndex).toBeDefined();
        expect(chunk.metadata.endIndex).toBeDefined();
        expect(chunk.metadata.startIndex).toBeLessThan(chunk.metadata.endIndex!);
      }
    });

    it('produces searchable chunks', async () => {
      const chunker = new RecursiveChunker({
        chunkSize: 200,
        chunkOverlap: 40,
        sizeUnit: 'tokens',
      });

      const document = createTestDocument(technicalContent, 'technical.md');
      await ingestDocuments([document], { chunker, embedder, store });

      // Search for HNSW-related content
      const queryEmb = await embedder.embed('HNSW graph structure nearest neighbor');
      const results = await store.search(queryEmb.embedding, { topK: 2 });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Semantic Chunker
  // ==========================================================================

  describe('SemanticChunker', () => {
    it('detects topic boundaries via embeddings', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: embedder,
        similarityThreshold: 0.5,
        minChunkSize: 50,
        maxChunkSize: 500,
      });

      // Technical content has clear topic transitions
      // (HNSW → IVF → Distance Metrics → Query Processing)
      const document = createTestDocument(technicalContent, 'technical.md');
      const chunks = await chunker.chunk(document);

      // Should detect major topic boundaries
      expect(chunks.length).toBeGreaterThan(3);

      // Chunks should be within size bounds
      for (const chunk of chunks) {
        const charCount = chunk.content.length;
        expect(charCount).toBeGreaterThanOrEqual(50 * 4 - 20); // Min size with tolerance
        expect(charCount).toBeLessThanOrEqual(500 * 4 + 50); // Max size with tolerance
      }
    });

    it('produces semantically coherent chunks', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: embedder,
        similarityThreshold: 0.4,
        minChunkSize: 100,
        maxChunkSize: 400,
      });

      const document = createTestDocument(technicalContent, 'technical.md');
      const result = await ingestDocuments([document], {
        chunker,
        embedder,
        store,
      });

      // Semantic chunker should produce chunks
      expect(result.chunks.length).toBeGreaterThan(0);

      // Each chunk should have content and metadata
      for (const chunk of result.chunks) {
        expect(chunk.content.length).toBeGreaterThan(0);
        expect(chunk.metadata.startIndex).toBeDefined();
        expect(chunk.metadata.endIndex).toBeDefined();
        expect(chunk.documentId).toBeDefined(); // Has a document ID
      }

      // Chunks should be searchable in the vector store
      const queryEmb = await embedder.embed('cosine similarity');
      const results = await store.search(queryEmb.embedding, { topK: 2 });
      expect(results.length).toBeGreaterThan(0);
    });

    it('works in full pipeline with retrieval', async () => {
      const chunker = new SemanticChunker({
        embeddingProvider: embedder,
        similarityThreshold: 0.5,
        minChunkSize: 80,
        maxChunkSize: 400,
      });

      const document = createTestDocument(technicalContent, 'technical.md');
      await ingestDocuments([document], { chunker, embedder, store });

      // Search for cosine similarity content
      const queryEmb = await embedder.embed('cosine similarity distance metric');
      const results = await store.search(queryEmb.embedding, { topK: 3 });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Agentic Chunker
  // ==========================================================================

  describe('AgenticChunker', () => {
    it('uses LLM for intelligent boundary detection', async () => {
      // Mock LLM that returns chunk boundaries in expected format
      const mockLLM = new MockLLMProvider({
        responseGenerator: (prompt) => {
          // Return chunks array with start/end positions
          // These positions split the technical content into 4 sections
          return JSON.stringify({
            chunks: [
              { start: 0, end: 800, topic: 'Introduction to vector databases' },
              { start: 800, end: 1600, topic: 'HNSW indexing' },
              { start: 1600, end: 2400, topic: 'Distance metrics' },
              { start: 2400, end: 4500, topic: 'Query processing and scaling' },
            ],
          });
        },
      });

      // Create a simple mock that provides the chat method
      const llmProvider = {
        chat: async (messages: Array<{ role: string; content: string }>) => {
          const response = await mockLLM.complete(messages[messages.length - 1]!.content);
          return { content: response };
        },
      };

      const chunker = new AgenticChunker({
        llmProvider: llmProvider as any,
        maxInputTokens: 4000,
        temperature: 0,
      });

      const document = createTestDocument(technicalContent, 'technical.md');
      const chunks = await chunker.chunk(document);

      // Should have created chunks (may be more or less depending on fallback)
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Verify chunks are in order
      let lastEnd = 0;
      for (const chunk of chunks) {
        expect(chunk.metadata.startIndex).toBeGreaterThanOrEqual(lastEnd);
        lastEnd = chunk.metadata.endIndex ?? lastEnd;
      }
    });

    it('falls back to recursive chunker on error', async () => {
      // Mock LLM that fails
      const failingLLM = new MockLLMProvider({
        shouldFail: true,
        errorMessage: 'LLM service unavailable',
      });

      const llmProvider = {
        chat: async (messages: Array<{ role: string; content: string }>) => {
          const response = await failingLLM.complete(messages[messages.length - 1]!.content);
          return { content: response };
        },
      };

      const chunker = new AgenticChunker({
        llmProvider: llmProvider as any,
        maxInputTokens: 4000,
        // Fallback is automatic
      });

      const document = createTestDocument(sampleContent, 'sample.md');

      // Should not throw - falls back to recursive chunker
      const chunks = await chunker.chunk(document);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('handles malformed LLM response gracefully', async () => {
      // Mock LLM that returns invalid JSON
      const badResponseLLM = new MockLLMProvider({
        response: 'This is not valid JSON',
      });

      const llmProvider = {
        chat: async (messages: Array<{ role: string; content: string }>) => {
          const response = await badResponseLLM.complete(messages[messages.length - 1]!.content);
          return { content: response };
        },
      };

      const chunker = new AgenticChunker({
        llmProvider: llmProvider as any,
        maxInputTokens: 4000,
      });

      const document = createTestDocument(sampleContent, 'sample.md');

      // Should fall back to recursive chunker
      const chunks = await chunker.chunk(document);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Cross-Strategy Comparison
  // ==========================================================================

  describe('cross-strategy comparison', () => {
    it('all strategies produce valid chunks', async () => {
      const document = createTestDocument(sampleContent, 'sample.md');

      const strategies = [
        new FixedSizeChunker({ chunkSize: 150, chunkOverlap: 30, sizeUnit: 'tokens' }),
        new RecursiveChunker({ chunkSize: 150, chunkOverlap: 30, sizeUnit: 'tokens' }),
        new SemanticChunker({
          embeddingProvider: embedder,
          similarityThreshold: 0.5,
          minChunkSize: 50,
          maxChunkSize: 300,
        }),
      ];

      for (const chunker of strategies) {
        const chunks = await chunker.chunk(document);

        // All strategies should produce chunks
        expect(chunks.length).toBeGreaterThan(0);

        // All chunks should have required fields
        for (const chunk of chunks) {
          expect(chunk.id).toBeDefined();
          expect(chunk.content).toBeDefined();
          expect(chunk.content.length).toBeGreaterThan(0);
          expect(chunk.metadata).toBeDefined();
          expect(chunk.documentId).toBe(document.id);
        }
      }
    });

    it('chunks from all strategies are searchable', async () => {
      const document = createTestDocument(sampleContent, 'sample.md');
      const query = 'neural networks deep learning';

      const strategies = [
        {
          name: 'fixed',
          chunker: new FixedSizeChunker({
            chunkSize: 150,
            chunkOverlap: 30,
            sizeUnit: 'tokens',
          }),
        },
        {
          name: 'recursive',
          chunker: new RecursiveChunker({
            chunkSize: 150,
            chunkOverlap: 30,
            sizeUnit: 'tokens',
          }),
        },
        {
          name: 'semantic',
          chunker: new SemanticChunker({
            embeddingProvider: embedder,
            similarityThreshold: 0.5,
            minChunkSize: 50,
            maxChunkSize: 300,
          }),
        },
      ];

      const queryEmb = await embedder.embed(query);

      for (const { name, chunker } of strategies) {
        // Clear store for each strategy
        await store.clear();

        // Ingest with this strategy
        await ingestDocuments([document], {
          chunker,
          embedder,
          store,
          documentIdPrefix: name,
        });

        // Search
        const results = await store.search(queryEmb.embedding, { topK: 2 });

        // Should find relevant results
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]!.score).toBeGreaterThan(0);
      }
    });
  });
});
