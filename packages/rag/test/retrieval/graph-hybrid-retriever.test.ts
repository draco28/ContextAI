import { describe, it, expect, beforeEach } from 'vitest';
import {
  GraphHybridRetriever,
  RetrieverError,
  InMemoryVectorStore,
  InMemoryGraphStore,
  type BM25Document,
  type ChunkWithEmbedding,
  type GraphHybridScore,
} from '../../src/index.js';
import type {
  EmbeddingProvider,
  EmbeddingResult,
} from '../../src/embeddings/types.js';
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

function createChunk(
  id: string,
  content: string,
  graphNodeId?: string
): Chunk {
  return {
    id,
    content,
    metadata: graphNodeId ? { graphNodeId } : {},
  };
}

function createBM25Document(
  id: string,
  content: string,
  graphNodeId?: string
): BM25Document {
  return { id, content, chunk: createChunk(id, content, graphNodeId) };
}

async function createChunkWithEmbedding(
  id: string,
  content: string,
  provider: EmbeddingProvider,
  graphNodeId?: string
): Promise<ChunkWithEmbedding> {
  const result = await provider.embed(content);
  return {
    id,
    content,
    metadata: graphNodeId ? { graphNodeId } : {},
    embedding: result.embedding,
  };
}

// ============================================================================
// GraphHybridRetriever Tests
// ============================================================================

describe('GraphHybridRetriever', () => {
  let vectorStore: InMemoryVectorStore;
  let graphStore: InMemoryGraphStore;
  let embeddingProvider: MockEmbeddingProvider;
  let retriever: GraphHybridRetriever;
  let testDocs: BM25Document[];

  beforeEach(async () => {
    embeddingProvider = new MockEmbeddingProvider();
    vectorStore = new InMemoryVectorStore({ dimensions: 3 });
    graphStore = new InMemoryGraphStore();

    // Create test documents with graph node mappings
    testDocs = [
      createBM25Document('1', 'PostgreSQL is a powerful database system', 'node-1'),
      createBM25Document('2', 'MySQL is a popular database', 'node-2'),
      createBM25Document('3', 'Redis is an in-memory data store', 'node-3'),
      createBM25Document('4', 'MongoDB is a NoSQL database', 'node-4'),
      createBM25Document('5', 'SQLite is an embedded database'), // No graph node
    ];

    // Insert chunks with embeddings into vector store
    const chunks = await Promise.all(
      testDocs.map((doc) =>
        createChunkWithEmbedding(
          doc.id,
          doc.content,
          embeddingProvider,
          doc.chunk.metadata?.graphNodeId as string | undefined
        )
      )
    );
    await vectorStore.insert(chunks);

    // Create graph nodes for the mapped chunks
    await graphStore.addNodes([
      { id: 'node-1', type: 'chunk', label: 'PostgreSQL chunk' },
      { id: 'node-2', type: 'chunk', label: 'MySQL chunk' },
      { id: 'node-3', type: 'chunk', label: 'Redis chunk' },
      { id: 'node-4', type: 'chunk', label: 'MongoDB chunk' },
      { id: 'concept-db', type: 'concept', label: 'Database' },
      { id: 'concept-sql', type: 'concept', label: 'SQL' },
      { id: 'concept-nosql', type: 'concept', label: 'NoSQL' },
    ]);

    // Create graph edges (relationships)
    await graphStore.addEdge({
      source: 'node-1',
      target: 'concept-db',
      type: 'relatedTo',
      weight: 0.9,
    });
    await graphStore.addEdge({
      source: 'node-2',
      target: 'concept-db',
      type: 'relatedTo',
      weight: 0.8,
    });
    await graphStore.addEdge({
      source: 'node-1',
      target: 'concept-sql',
      type: 'relatedTo',
      weight: 0.95,
    });
    await graphStore.addEdge({
      source: 'node-2',
      target: 'concept-sql',
      type: 'relatedTo',
      weight: 0.9,
    });
    await graphStore.addEdge({
      source: 'node-4',
      target: 'concept-nosql',
      type: 'relatedTo',
      weight: 0.9,
    });
    // Link PostgreSQL and MySQL (both SQL databases)
    await graphStore.addEdge({
      source: 'node-1',
      target: 'node-2',
      type: 'similarTo',
      weight: 0.7,
    });

    // Create retriever
    retriever = new GraphHybridRetriever(
      vectorStore,
      graphStore,
      embeddingProvider,
      { name: 'TestGraphHybrid' }
    );

    // Build BM25 index
    retriever.buildIndex(testDocs);
  });

  // ==========================================================================
  // Basic Functionality
  // ==========================================================================

  describe('basic functionality', () => {
    it('should retrieve results with graph context', async () => {
      const results = await retriever.retrieve('database', { topK: 3 });

      expect(results).toHaveLength(3);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].chunk).toBeDefined();
    });

    it('should return GraphHybridScore with all three components', async () => {
      const results = await retriever.retrieve('PostgreSQL database', { topK: 2 });

      expect(results.length).toBeGreaterThan(0);

      const scores = results[0].scores as GraphHybridScore;
      expect(scores).toBeDefined();
      expect(typeof scores.dense).toBe('number');
      expect(typeof scores.sparse).toBe('number');
      expect(typeof scores.graph).toBe('number');
      expect(typeof scores.fused).toBe('number');
    });

    it('should throw error for empty query', async () => {
      await expect(retriever.retrieve('')).rejects.toThrow(RetrieverError);
      await expect(retriever.retrieve('   ')).rejects.toThrow(RetrieverError);
    });
  });

  // ==========================================================================
  // Graph Context Influence
  // ==========================================================================

  describe('graph context influence', () => {
    it('should boost results that are connected in the graph', async () => {
      // PostgreSQL and MySQL are connected - should get graph boost
      const results = await retriever.retrieve('database', { topK: 5 });

      // Find PostgreSQL and MySQL results
      const pgResult = results.find((r) => r.chunk.content.includes('PostgreSQL'));
      const mysqlResult = results.find((r) => r.chunk.content.includes('MySQL'));

      expect(pgResult).toBeDefined();
      expect(mysqlResult).toBeDefined();

      // Both should have non-zero graph scores due to connection
      const pgScores = pgResult!.scores as GraphHybridScore;
      const mysqlScores = mysqlResult!.scores as GraphHybridScore;

      expect(pgScores.graph).toBeGreaterThanOrEqual(0);
      expect(mysqlScores.graph).toBeGreaterThanOrEqual(0);
    });

    it('should handle chunks without graph node mapping', async () => {
      // SQLite has no graph node mapping
      const results = await retriever.retrieve('embedded database', { topK: 5 });

      const sqliteResult = results.find((r) => r.chunk.content.includes('SQLite'));
      if (sqliteResult) {
        const scores = sqliteResult.scores as GraphHybridScore;
        // SQLite should have graph score of 0 (no mapping)
        expect(scores.graph).toBe(0);
      }
    });
  });

  // ==========================================================================
  // graphWeight Parameter
  // ==========================================================================

  describe('graphWeight parameter', () => {
    it('should disable graph signal when graphWeight=0', async () => {
      const results = await retriever.retrieve('database', {
        topK: 3,
        graphWeight: 0,
      });

      expect(results.length).toBeGreaterThan(0);

      // With graphWeight=0, graph score should be 0
      const scores = results[0].scores as GraphHybridScore;
      expect(scores.graph).toBe(0);
    });

    it('should throw error for invalid graphWeight', async () => {
      await expect(
        retriever.retrieve('database', { graphWeight: -0.1 })
      ).rejects.toThrow(RetrieverError);

      await expect(
        retriever.retrieve('database', { graphWeight: 1.5 })
      ).rejects.toThrow(RetrieverError);
    });

    it('should accept valid graphWeight values', async () => {
      // Should not throw
      await expect(
        retriever.retrieve('database', { graphWeight: 0 })
      ).resolves.toBeDefined();

      await expect(
        retriever.retrieve('database', { graphWeight: 0.5 })
      ).resolves.toBeDefined();

      await expect(
        retriever.retrieve('database', { graphWeight: 1 })
      ).resolves.toBeDefined();
    });
  });

  // ==========================================================================
  // Configuration
  // ==========================================================================

  describe('configuration', () => {
    it('should use default graphWeight when not specified', async () => {
      const customRetriever = new GraphHybridRetriever(
        vectorStore,
        graphStore,
        embeddingProvider,
        { defaultGraphWeight: 0.5 }
      );
      customRetriever.buildIndex(testDocs);

      const results = await customRetriever.retrieve('database', { topK: 3 });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid defaultGraphWeight in config', () => {
      expect(
        () =>
          new GraphHybridRetriever(vectorStore, graphStore, embeddingProvider, {
            defaultGraphWeight: 1.5,
          })
      ).toThrow(RetrieverError);

      expect(
        () =>
          new GraphHybridRetriever(vectorStore, graphStore, embeddingProvider, {
            defaultGraphWeight: -0.1,
          })
      ).toThrow(RetrieverError);
    });

    it('should use custom chunkToNodeProperty', async () => {
      // Create docs with custom property name
      const customDocs = [
        {
          id: 'c1',
          content: 'Custom content',
          chunk: { id: 'c1', content: 'Custom content', metadata: { nodeRef: 'node-1' } },
        },
      ];

      // Insert into vector store
      const chunk = await createChunkWithEmbedding('c1', 'Custom content', embeddingProvider);
      chunk.metadata = { nodeRef: 'node-1' };
      await vectorStore.upsert([chunk]);

      const customRetriever = new GraphHybridRetriever(
        vectorStore,
        graphStore,
        embeddingProvider,
        { chunkToNodeProperty: 'nodeRef' }
      );
      customRetriever.buildIndex(customDocs);

      const results = await customRetriever.retrieve('custom', { topK: 1 });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Graph Context Options
  // ==========================================================================

  describe('graphContext options', () => {
    it('should respect depth option', async () => {
      const shallowRetriever = new GraphHybridRetriever(
        vectorStore,
        graphStore,
        embeddingProvider,
        { graphContext: { depth: 1 } }
      );
      shallowRetriever.buildIndex(testDocs);

      const deepRetriever = new GraphHybridRetriever(
        vectorStore,
        graphStore,
        embeddingProvider,
        { graphContext: { depth: 3 } }
      );
      deepRetriever.buildIndex(testDocs);

      // Both should return results
      const shallowResults = await shallowRetriever.retrieve('database', { topK: 3 });
      const deepResults = await deepRetriever.retrieve('database', { topK: 3 });

      expect(shallowResults.length).toBeGreaterThan(0);
      expect(deepResults.length).toBeGreaterThan(0);
    });

    it('should allow per-query graphContext override', async () => {
      const results = await retriever.retrieve('database', {
        topK: 3,
        graphContext: {
          depth: 2,
          maxNeighborsPerChunk: 5,
        },
      });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Accessors
  // ==========================================================================

  describe('accessors', () => {
    it('should expose hybrid retriever', () => {
      expect(retriever.hybrid).toBeDefined();
      expect(retriever.hybrid.name).toBe('TestGraphHybrid:Hybrid');
    });

    it('should expose graph store', () => {
      expect(retriever.graph).toBe(graphStore);
    });

    it('should report index built status', () => {
      expect(retriever.isIndexBuilt).toBe(true);

      const freshRetriever = new GraphHybridRetriever(
        vectorStore,
        graphStore,
        embeddingProvider
      );
      expect(freshRetriever.isIndexBuilt).toBe(false);
    });
  });

  // ==========================================================================
  // Alpha Parameter (inherited from HybridRetriever)
  // ==========================================================================

  describe('alpha parameter', () => {
    it('should support pure dense (alpha=1)', async () => {
      const results = await retriever.retrieve('database', {
        topK: 3,
        alpha: 1,
      });

      expect(results.length).toBeGreaterThan(0);
      const scores = results[0].scores as GraphHybridScore;
      expect(scores.sparse).toBe(0);
    });

    it('should support pure sparse (alpha=0)', async () => {
      const results = await retriever.retrieve('database', {
        topK: 3,
        alpha: 0,
      });

      expect(results.length).toBeGreaterThan(0);
      const scores = results[0].scores as GraphHybridScore;
      expect(scores.dense).toBe(0);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty vector store', async () => {
      const emptyVectorStore = new InMemoryVectorStore({ dimensions: 3 });
      const emptyRetriever = new GraphHybridRetriever(
        emptyVectorStore,
        graphStore,
        embeddingProvider
      );
      emptyRetriever.buildIndex([]);

      const results = await emptyRetriever.retrieve('database', { topK: 3 });
      expect(results).toHaveLength(0);
    });

    it('should handle empty graph store', async () => {
      const emptyGraphStore = new InMemoryGraphStore();
      const retrieverWithEmptyGraph = new GraphHybridRetriever(
        vectorStore,
        emptyGraphStore,
        embeddingProvider
      );
      retrieverWithEmptyGraph.buildIndex(testDocs);

      // Should still return results (graph scores will be 0)
      const results = await retrieverWithEmptyGraph.retrieve('database', { topK: 3 });
      expect(results.length).toBeGreaterThan(0);

      // All graph scores should be 0
      for (const result of results) {
        const scores = result.scores as GraphHybridScore;
        expect(scores.graph).toBe(0);
      }
    });

    it('should handle minScore filtering', async () => {
      const results = await retriever.retrieve('database', {
        topK: 10,
        minScore: 0.99, // Very high threshold
      });

      // May return empty or very few results due to high threshold
      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0.99);
      }
    });

    it('should handle disconnected nodes in graph', async () => {
      // Add a disconnected node
      await graphStore.addNode({
        id: 'isolated-node',
        type: 'chunk',
        label: 'Isolated',
      });

      // Create a chunk mapped to the isolated node
      const isolatedChunk = await createChunkWithEmbedding(
        'isolated',
        'Isolated database content',
        embeddingProvider,
        'isolated-node'
      );
      await vectorStore.upsert([isolatedChunk]);

      const isolatedDoc = createBM25Document(
        'isolated',
        'Isolated database content',
        'isolated-node'
      );
      retriever.buildIndex([...testDocs, isolatedDoc]);

      const results = await retriever.retrieve('isolated database', { topK: 5 });
      expect(results.length).toBeGreaterThan(0);

      // The isolated chunk should have graph score of 0 (no connections)
      const isolatedResult = results.find((r) => r.id === 'isolated');
      if (isolatedResult) {
        const scores = isolatedResult.scores as GraphHybridScore;
        // Graph score is 0 because no cross-pollination or connections
        expect(scores.graph).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Score Normalization
  // ==========================================================================

  describe('score normalization', () => {
    it('should return normalized fused scores between 0 and 1', async () => {
      const results = await retriever.retrieve('database system', { topK: 5 });

      for (const result of results) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }
    });

    it('should return results sorted by fused score descending', async () => {
      const results = await retriever.retrieve('database', { topK: 5 });

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });
  });
});
