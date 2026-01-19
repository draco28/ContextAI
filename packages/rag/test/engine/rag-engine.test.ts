/**
 * RAG Engine Tests
 *
 * Tests for the high-level RAG orchestrator that coordinates:
 * Query Enhancement → Retrieval → Reranking → Context Assembly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGEngineImpl, RAGEngineError } from '../../src/engine/index.js';
import type { RAGEngineConfig } from '../../src/engine/types.js';
import type { QueryEnhancer, EnhancementResult } from '../../src/query-enhancement/types.js';
import type { Retriever, RetrievalResult } from '../../src/retrieval/types.js';
import type { Reranker, RerankerResult } from '../../src/reranker/types.js';
import type { ContextAssembler, AssembledContext } from '../../src/assembly/types.js';
import type { Chunk } from '../../src/vector-store/types.js';
import type { CacheProvider } from '../../src/cache/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createChunk(id: string, content: string): Chunk {
  return { id, content, metadata: {} };
}

function createRetrievalResult(
  id: string,
  score: number,
  content: string
): RetrievalResult {
  return {
    id,
    chunk: createChunk(id, content),
    score,
  };
}

function createRerankerResult(
  id: string,
  score: number,
  content: string,
  originalRank: number,
  newRank: number
): RerankerResult {
  return {
    id,
    chunk: createChunk(id, content),
    score,
    originalRank,
    newRank,
    scores: { originalScore: score * 0.9, rerankerScore: score },
  };
}

function createAssembledContext(chunkCount: number = 2): AssembledContext {
  return {
    content: '<sources>\n  <source id="1">Content 1</source>\n</sources>',
    estimatedTokens: 50,
    chunkCount,
    deduplicatedCount: 0,
    droppedCount: 0,
    sources: [
      { index: 1, chunkId: '1', score: 0.9 },
      { index: 2, chunkId: '2', score: 0.8 },
    ].slice(0, chunkCount),
    chunks: [],
  };
}

// ============================================================================
// Mock Implementations
// ============================================================================

function createMockRetriever(
  results: RetrievalResult[] = [
    createRetrievalResult('1', 0.9, 'First chunk'),
    createRetrievalResult('2', 0.8, 'Second chunk'),
  ]
): Retriever {
  return {
    name: 'MockRetriever',
    retrieve: vi.fn().mockResolvedValue(results),
  };
}

function createMockAssembler(
  result: AssembledContext = createAssembledContext()
): ContextAssembler {
  return {
    name: 'MockAssembler',
    assemble: vi.fn().mockResolvedValue(result),
  };
}

function createMockEnhancer(
  enhanced: string[] = ['enhanced query']
): QueryEnhancer {
  return {
    name: 'MockEnhancer',
    strategy: 'rewrite' as const,
    enhance: vi.fn().mockResolvedValue({
      original: 'original query',
      enhanced,
      strategy: 'rewrite',
      metadata: { tokensUsed: 10 },
    } satisfies EnhancementResult),
  };
}

function createMockReranker(
  results: RerankerResult[] = [
    createRerankerResult('2', 0.95, 'Second chunk', 2, 1),
    createRerankerResult('1', 0.85, 'First chunk', 1, 2),
  ]
): Reranker {
  return {
    name: 'MockReranker',
    rerank: vi.fn().mockResolvedValue(results),
  };
}

function createMockCache(): CacheProvider<unknown> & {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  has: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    has: vi.fn().mockResolvedValue(false),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('RAGEngineImpl', () => {
  describe('construction', () => {
    it('creates engine with required components', () => {
      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      expect(engine.name).toBe('RAGEngine');
    });

    it('accepts custom name', () => {
      const engine = new RAGEngineImpl({
        name: 'CustomEngine',
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      expect(engine.name).toBe('CustomEngine');
    });

    it('throws if retriever is missing', () => {
      expect(() => {
        new RAGEngineImpl({
          retriever: undefined as unknown as Retriever,
          assembler: createMockAssembler(),
        });
      }).toThrow(RAGEngineError);
    });

    it('throws if assembler is missing', () => {
      expect(() => {
        new RAGEngineImpl({
          retriever: createMockRetriever(),
          assembler: undefined as unknown as ContextAssembler,
        });
      }).toThrow(RAGEngineError);
    });
  });

  describe('search - basic flow', () => {
    it('performs retrieval and assembly', async () => {
      const retriever = createMockRetriever();
      const assembler = createMockAssembler();

      const engine = new RAGEngineImpl({ retriever, assembler });
      const result = await engine.search('test query');

      // Verify retriever was called
      expect(retriever.retrieve).toHaveBeenCalledWith(
        'test query',
        expect.any(Object)
      );

      // Verify assembler was called with retrieval results
      expect(assembler.assemble).toHaveBeenCalled();

      // Verify result structure
      expect(result.content).toBeDefined();
      expect(result.estimatedTokens).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
      expect(result.metadata.fromCache).toBe(false);
      // Timing may be 0 if mocks resolve instantly, so check it's defined
      expect(result.metadata.timings.totalMs).toBeGreaterThanOrEqual(0);
    });

    it('returns retrieval results in metadata', async () => {
      const retrievalResults = [
        createRetrievalResult('1', 0.9, 'First'),
        createRetrievalResult('2', 0.8, 'Second'),
      ];

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(retrievalResults),
        assembler: createMockAssembler(),
      });

      const result = await engine.search('test');

      expect(result.retrievalResults).toHaveLength(2);
      expect(result.metadata.retrievedCount).toBe(2);
    });

    it('uses query as effective query without enhancer', async () => {
      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      const result = await engine.search('original query');

      expect(result.metadata.effectiveQuery).toBe('original query');
      expect(result.metadata.allQueries).toBeUndefined();
    });
  });

  describe('search - with query enhancement', () => {
    it('enhances query before retrieval', async () => {
      const enhancer = createMockEnhancer(['better query']);
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        enhancer,
        retriever,
        assembler: createMockAssembler(),
      });

      const result = await engine.search('original query');

      // Enhancer should be called
      expect(enhancer.enhance).toHaveBeenCalledWith('original query');

      // Retriever should use enhanced query
      expect(retriever.retrieve).toHaveBeenCalledWith(
        'better query',
        expect.any(Object)
      );

      // Metadata should reflect enhancement
      expect(result.metadata.effectiveQuery).toBe('better query');
      expect(result.metadata.allQueries).toEqual([
        'original query',
        'better query',
      ]);
      expect(result.metadata.enhancement).toBeDefined();
      expect(result.metadata.timings.enhancementMs).toBeGreaterThanOrEqual(0);
    });

    it('skips enhancement when disabled', async () => {
      const enhancer = createMockEnhancer();
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        enhancer,
        retriever,
        assembler: createMockAssembler(),
      });

      await engine.search('query', { enhance: false });

      expect(enhancer.enhance).not.toHaveBeenCalled();
      expect(retriever.retrieve).toHaveBeenCalledWith('query', expect.any(Object));
    });

    it('handles multi-query enhancement', async () => {
      const enhancer = createMockEnhancer(['query 1', 'query 2', 'query 3']);
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        enhancer,
        retriever,
        assembler: createMockAssembler(),
      });

      const result = await engine.search('original');

      // All queries should be tracked
      expect(result.metadata.allQueries).toEqual([
        'original',
        'query 1',
        'query 2',
        'query 3',
      ]);

      // Retriever should be called multiple times
      expect(retriever.retrieve).toHaveBeenCalledTimes(4);
    });

    it('uses original query when enhancement returns empty', async () => {
      const enhancer = createMockEnhancer([]);
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        enhancer,
        retriever,
        assembler: createMockAssembler(),
      });

      const result = await engine.search('original');

      expect(retriever.retrieve).toHaveBeenCalledWith(
        'original',
        expect.any(Object)
      );
      expect(result.metadata.effectiveQuery).toBe('original');
    });
  });

  describe('search - with reranking', () => {
    it('reranks retrieval results', async () => {
      const rerankerResults = [
        createRerankerResult('2', 0.95, 'Second', 2, 1),
        createRerankerResult('1', 0.85, 'First', 1, 2),
      ];
      const reranker = createMockReranker(rerankerResults);

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        reranker,
        assembler: createMockAssembler(),
      });

      const result = await engine.search('test');

      // Reranker should be called with retrieval results
      expect(reranker.rerank).toHaveBeenCalled();

      // Reranked results should be available
      expect(result.rerankerResults).toBeDefined();
      expect(result.rerankerResults![0]!.id).toBe('2');
      expect(result.metadata.rerankedCount).toBe(2);
      expect(result.metadata.timings.rerankingMs).toBeGreaterThanOrEqual(0);
    });

    it('skips reranking when disabled', async () => {
      const reranker = createMockReranker();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        reranker,
        assembler: createMockAssembler(),
      });

      const result = await engine.search('test', { rerank: false });

      expect(reranker.rerank).not.toHaveBeenCalled();
      expect(result.rerankerResults).toBeUndefined();
    });

    it('skips reranking when no results', async () => {
      const reranker = createMockReranker();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever([]),
        reranker,
        assembler: createMockAssembler(),
      });

      await engine.search('test');

      expect(reranker.rerank).not.toHaveBeenCalled();
    });
  });

  describe('search - with caching', () => {
    it('returns cached result when available', async () => {
      const cachedResult = {
        content: 'cached content',
        estimatedTokens: 10,
        sources: [],
        assembly: createAssembledContext(0),
        retrievalResults: [],
        metadata: {
          effectiveQuery: 'test',
          retrievedCount: 1,
          assembledCount: 1,
          deduplicatedCount: 0,
          droppedCount: 0,
          fromCache: false,
          timings: { retrievalMs: 10, assemblyMs: 5, totalMs: 15 },
        },
      };

      const cache = createMockCache();
      cache.get.mockResolvedValue(cachedResult);

      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        retriever,
        assembler: createMockAssembler(),
        cache,
      });

      const result = await engine.search('test');

      // Cache should be checked
      expect(cache.get).toHaveBeenCalled();

      // Retriever should NOT be called
      expect(retriever.retrieve).not.toHaveBeenCalled();

      // Result should have fromCache flag
      expect(result.metadata.fromCache).toBe(true);
    });

    it('stores result in cache after search', async () => {
      const cache = createMockCache();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
        cache,
      });

      await engine.search('test');

      // Cache should be set
      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ content: expect.any(String) }),
        expect.any(Number)
      );
    });

    it('skips cache when disabled', async () => {
      const cache = createMockCache();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
        cache,
      });

      await engine.search('test', { useCache: false });

      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('continues on cache errors', async () => {
      const cache = createMockCache();
      cache.get.mockRejectedValue(new Error('Cache error'));

      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        retriever,
        assembler: createMockAssembler(),
        cache,
      });

      // Should not throw
      const result = await engine.search('test');

      // Should fallback to normal search
      expect(retriever.retrieve).toHaveBeenCalled();
      expect(result.metadata.fromCache).toBe(false);
    });
  });

  describe('search - options', () => {
    it('passes topK to retriever', async () => {
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        retriever,
        assembler: createMockAssembler(),
      });

      await engine.search('test', { topK: 5 });

      expect(retriever.retrieve).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ topK: 5 })
      );
    });

    it('passes minScore to retriever', async () => {
      const retriever = createMockRetriever();

      const engine = new RAGEngineImpl({
        retriever,
        assembler: createMockAssembler(),
      });

      await engine.search('test', { minScore: 0.5 });

      expect(retriever.retrieve).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ minScore: 0.5 })
      );
    });

    it('passes ordering to assembler', async () => {
      const assembler = createMockAssembler();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler,
      });

      await engine.search('test', { ordering: 'sandwich' });

      expect(assembler.assemble).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ ordering: 'sandwich' })
      );
    });

    it('passes maxTokens to assembler', async () => {
      const assembler = createMockAssembler();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler,
      });

      await engine.search('test', { maxTokens: 2000 });

      expect(assembler.assemble).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ maxTokens: 2000 })
      );
    });
  });

  describe('search - error handling', () => {
    it('throws on empty query', async () => {
      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      await expect(engine.search('')).rejects.toThrow(RAGEngineError);
      await expect(engine.search('   ')).rejects.toThrow(RAGEngineError);
    });

    it('throws on retrieval error', async () => {
      const retriever: Retriever = {
        name: 'FailingRetriever',
        retrieve: vi.fn().mockRejectedValue(new Error('Retrieval failed')),
      };

      const engine = new RAGEngineImpl({
        retriever,
        assembler: createMockAssembler(),
      });

      await expect(engine.search('test')).rejects.toThrow(RAGEngineError);
    });

    it('throws on enhancement error', async () => {
      const enhancer: QueryEnhancer = {
        name: 'FailingEnhancer',
        strategy: 'rewrite',
        enhance: vi.fn().mockRejectedValue(new Error('Enhancement failed')),
      };

      const engine = new RAGEngineImpl({
        enhancer,
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      await expect(engine.search('test')).rejects.toThrow(RAGEngineError);
    });

    it('throws on reranking error', async () => {
      const reranker: Reranker = {
        name: 'FailingReranker',
        rerank: vi.fn().mockRejectedValue(new Error('Reranking failed')),
      };

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        reranker,
        assembler: createMockAssembler(),
      });

      await expect(engine.search('test')).rejects.toThrow(RAGEngineError);
    });

    it('throws on assembly error', async () => {
      const assembler: ContextAssembler = {
        name: 'FailingAssembler',
        assemble: vi.fn().mockRejectedValue(new Error('Assembly failed')),
      };

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler,
      });

      await expect(engine.search('test')).rejects.toThrow(RAGEngineError);
    });
  });

  describe('search - abort signal', () => {
    it('throws on aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      await expect(
        engine.search('test', { signal: controller.signal })
      ).rejects.toThrow(RAGEngineError);
    });
  });

  describe('clearCache', () => {
    it('clears the cache', async () => {
      const cache = createMockCache();

      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
        cache,
      });

      await engine.clearCache();

      expect(cache.clear).toHaveBeenCalled();
    });

    it('does nothing without cache', async () => {
      const engine = new RAGEngineImpl({
        retriever: createMockRetriever(),
        assembler: createMockAssembler(),
      });

      // Should not throw
      await engine.clearCache();
    });
  });
});

describe('RAGEngineError', () => {
  it('creates invalid query error', () => {
    const error = RAGEngineError.invalidQuery('Engine', 'empty query');

    expect(error.code).toBe('INVALID_QUERY');
    expect(error.engineName).toBe('Engine');
    expect(error.message).toContain('Invalid query');
  });

  it('creates retrieval failed error with cause', () => {
    const cause = new Error('underlying error');
    const error = RAGEngineError.retrievalFailed('Engine', 'failed', cause);

    expect(error.code).toBe('RETRIEVAL_FAILED');
    expect(error.stage).toBe('retrieval');
    expect(error.cause).toBe(cause);
  });

  it('creates aborted error', () => {
    const error = RAGEngineError.aborted('Engine', 'retrieval');

    expect(error.code).toBe('ABORTED');
    expect(error.stage).toBe('retrieval');
  });

  it('converts to details object', () => {
    const error = RAGEngineError.configError('Engine', 'missing retriever');
    const details = error.toDetails();

    expect(details.code).toBe('CONFIG_ERROR');
    expect(details.engineName).toBe('Engine');
  });
});
