/**
 * RAG Package Cold Start Time Tests (NFR-104)
 *
 * Measures actual cold-start performance for the RAG package.
 * The RAG package has 327+ exports - this tests import time impact.
 *
 * NFR-104 Target: Agent initialization <500ms (excluding model loading)
 */

import { describe, it, expect } from 'vitest';

describe('NFR-104: RAG Package Startup Time', () => {
  it('should import @contextai/rag package efficiently', async () => {
    const start = performance.now();
    const rag = await import('@contextai/rag');
    const elapsed = performance.now() - start;

    console.log('\n--- RAG Package Import Time ---');
    console.log(`Import time: ${elapsed.toFixed(3)}ms`);
    console.log(`Exports available: ${Object.keys(rag).length}`);
    console.log('-------------------------------\n');

    // Should import reasonably fast (under 200ms for cached import)
    expect(elapsed).toBeLessThan(200);

    // Verify key exports are available
    expect(rag.RAGEngineImpl).toBeDefined();
  });

  it('should initialize RAGEngine efficiently', async () => {
    const {
      RAGEngineImpl,
      InMemoryVectorStore,
      MarkdownAssembler,
      DenseRetriever,
    } = await import('@contextai/rag');

    // Create minimal components
    const vectorStore = new InMemoryVectorStore({ dimensions: 384 });
    const assembler = new MarkdownAssembler();

    // Mock embedding provider
    const mockEmbeddingProvider = {
      embed: async (texts: string[]) =>
        texts.map(() => new Array(384).fill(0.1)),
      getDimensions: () => 384,
      getModel: () => 'mock',
    };

    const retriever = new DenseRetriever({
      vectorStore,
      embeddingProvider: mockEmbeddingProvider as never,
    });

    // Measure RAGEngine initialization
    const start = performance.now();
    const engine = new RAGEngineImpl({
      name: 'benchmark-engine',
      retriever,
      assembler,
    });
    const elapsed = performance.now() - start;

    console.log(`RAGEngine init time: ${elapsed.toFixed(3)}ms`);

    // RAGEngine init should be under 200ms
    expect(elapsed).toBeLessThan(200);

    void engine;
  });

  it('should measure RAGEngine with optional components', async () => {
    const {
      RAGEngineImpl,
      InMemoryVectorStore,
      MarkdownAssembler,
      DenseRetriever,
      LRUCacheProvider,
    } = await import('@contextai/rag');

    const vectorStore = new InMemoryVectorStore({ dimensions: 384 });
    const assembler = new MarkdownAssembler();

    const mockEmbeddingProvider = {
      embed: async (texts: string[]) =>
        texts.map(() => new Array(384).fill(0.1)),
      getDimensions: () => 384,
      getModel: () => 'mock',
    };

    const retriever = new DenseRetriever({
      vectorStore,
      embeddingProvider: mockEmbeddingProvider as never,
    });

    const cache = new LRUCacheProvider({ maxSize: 100 });

    // Measure RAGEngine with cache
    const start = performance.now();
    const engine = new RAGEngineImpl({
      name: 'benchmark-engine',
      retriever,
      assembler,
      cache,
      defaults: {
        topK: 10,
        minScore: 0.5,
        ordering: 'relevance',
        enhance: false,
        rerank: false,
        useCache: true,
      },
    });
    const elapsed = performance.now() - start;

    console.log(`RAGEngine with cache init time: ${elapsed.toFixed(3)}ms`);

    expect(elapsed).toBeLessThan(200);

    void engine;
  });

  it('should profile individual component import times', async () => {
    // Sub-entry points for lazy loading
    const components = [
      '@contextai/rag', // Full package (107 exports)
      '@contextai/rag/engine', // Just the engine
      '@contextai/rag/retrieval', // Just retrievers
      '@contextai/rag/embeddings', // Just embedding providers
      '@contextai/rag/vector-store', // Just vector stores
      '@contextai/rag/reranker', // Just rerankers
      '@contextai/rag/chunking', // Just chunking
      '@contextai/rag/assembly', // Just assemblers
      '@contextai/rag/memory', // Just memory utilities
    ];

    console.log('\n--- Component Import Profiling ---');

    for (const component of components) {
      const start = performance.now();
      await import(component);
      const elapsed = performance.now() - start;
      console.log(`${component}: ${elapsed.toFixed(3)}ms`);
    }

    console.log('----------------------------------\n');
  });

  it('should import only engine sub-entry point efficiently', async () => {
    // This is the key optimization - users who only need RAGEngineImpl
    // can now import just the engine instead of everything
    const start = performance.now();
    const { RAGEngineImpl, RAGEngineError } = await import(
      '@contextai/rag/engine'
    );
    const elapsed = performance.now() - start;

    console.log(`@contextai/rag/engine import: ${elapsed.toFixed(3)}ms`);

    expect(RAGEngineImpl).toBeDefined();
    expect(RAGEngineError).toBeDefined();
    expect(elapsed).toBeLessThan(100); // Should be very fast
  });
});
