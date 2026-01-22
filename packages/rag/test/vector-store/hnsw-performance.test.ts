/**
 * HNSW Performance Validation Tests
 *
 * Validates NFR-102: Vector search shall complete within 100ms for 10,000 chunks
 *
 * These are actual tests (not benchmarks) that verify performance requirements.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { InMemoryVectorStore } from '../../src/index.js';
import type { ChunkWithEmbedding } from '../../src/index.js';

// ============================================================================
// Test Configuration
// ============================================================================

const DIMENSIONS = 384; // BGE-small dimension (common for local embeddings)
const TOPK = 10;

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a random normalized vector.
 */
function randomVector(dimensions: number): number[] {
  const vec = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / norm);
}

/**
 * Generate test chunks with random embeddings.
 */
function generateChunks(
  count: number,
  dimensions: number
): ChunkWithEmbedding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    content: `Test content for chunk ${i}`,
    embedding: randomVector(dimensions),
    metadata: { index: i },
  }));
}

/**
 * Measure search latency over multiple queries.
 */
async function measureSearchLatency(
  store: InMemoryVectorStore,
  dimensions: number,
  numQueries: number
): Promise<{ p50: number; p95: number; p99: number; mean: number }> {
  const latencies: number[] = [];

  for (let i = 0; i < numQueries; i++) {
    const query = randomVector(dimensions);
    const start = performance.now();
    await store.search(query, { topK: TOPK });
    const end = performance.now();
    latencies.push(end - start);
  }

  // Sort for percentile calculations
  latencies.sort((a, b) => a - b);

  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  return {
    p50: latencies[p50Index]!,
    p95: latencies[p95Index]!,
    p99: latencies[p99Index]!,
    mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
  };
}

// ============================================================================
// Performance Tests
// ============================================================================

describe('HNSW Performance Validation', () => {
  describe('1K Vectors (Baseline)', () => {
    let hnswStore: InMemoryVectorStore;
    let bruteForceStore: InMemoryVectorStore;

    beforeAll(async () => {
      const chunks = generateChunks(1000, DIMENSIONS);

      hnswStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'hnsw',
        hnswConfig: { M: 16, efConstruction: 200, efSearch: 50 },
      });
      await hnswStore.insert(chunks);

      bruteForceStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'brute-force',
      });
      await bruteForceStore.insert(chunks);
    });

    it('HNSW should complete in <10ms (p95)', async () => {
      const latency = await measureSearchLatency(hnswStore, DIMENSIONS, 20);

      console.log(`\n1K Vectors - HNSW:`);
      console.log(`  p50: ${latency.p50.toFixed(2)}ms`);
      console.log(`  p95: ${latency.p95.toFixed(2)}ms`);
      console.log(`  p99: ${latency.p99.toFixed(2)}ms`);
      console.log(`  mean: ${latency.mean.toFixed(2)}ms`);

      expect(latency.p95).toBeLessThan(10);
    });

    it('brute-force should complete in <20ms (p95)', async () => {
      const latency = await measureSearchLatency(
        bruteForceStore,
        DIMENSIONS,
        20
      );

      console.log(`\n1K Vectors - Brute-Force:`);
      console.log(`  p50: ${latency.p50.toFixed(2)}ms`);
      console.log(`  p95: ${latency.p95.toFixed(2)}ms`);
      console.log(`  p99: ${latency.p99.toFixed(2)}ms`);
      console.log(`  mean: ${latency.mean.toFixed(2)}ms`);

      expect(latency.p95).toBeLessThan(20);
    });
  });

  describe('10K Vectors (NFR-102 Target)', () => {
    let hnswStore: InMemoryVectorStore;

    beforeAll(async () => {
      const chunks = generateChunks(10_000, DIMENSIONS);

      hnswStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'hnsw',
        hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
      });
      await hnswStore.insert(chunks);
    }, 60000); // 60s timeout for setup

    it('HNSW should complete in <100ms (p95) - NFR-102', async () => {
      const latency = await measureSearchLatency(hnswStore, DIMENSIONS, 20);

      console.log(`\n10K Vectors - HNSW (NFR-102 Target):`);
      console.log(`  p50: ${latency.p50.toFixed(2)}ms`);
      console.log(`  p95: ${latency.p95.toFixed(2)}ms`);
      console.log(`  p99: ${latency.p99.toFixed(2)}ms`);
      console.log(`  mean: ${latency.mean.toFixed(2)}ms`);

      // NFR-102: Vector search shall complete within 100ms for 10,000 chunks
      expect(latency.p95).toBeLessThan(100);
    });
  });

  describe('50K Vectors (Stretch Goal)', () => {
    let hnswStore: InMemoryVectorStore;

    beforeAll(async () => {
      const chunks = generateChunks(50_000, DIMENSIONS);

      hnswStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'hnsw',
        hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
      });
      await hnswStore.insert(chunks);
    }, 300000); // 5 min timeout for setup

    it('HNSW should complete in <200ms (p95)', async () => {
      const latency = await measureSearchLatency(hnswStore, DIMENSIONS, 20);

      console.log(`\n50K Vectors - HNSW (Stretch Goal):`);
      console.log(`  p50: ${latency.p50.toFixed(2)}ms`);
      console.log(`  p95: ${latency.p95.toFixed(2)}ms`);
      console.log(`  p99: ${latency.p99.toFixed(2)}ms`);
      console.log(`  mean: ${latency.mean.toFixed(2)}ms`);

      expect(latency.p95).toBeLessThan(200);
    });
  });

  describe('Recall vs Speed Tradeoff', () => {
    let chunks: ChunkWithEmbedding[];
    const vectors = new Map<string, number[]>();

    beforeAll(async () => {
      chunks = generateChunks(5000, DIMENSIONS);
      chunks.forEach((c) => vectors.set(c.id, c.embedding));
    });

    /**
     * Calculate recall by comparing HNSW results to brute-force.
     */
    async function measureRecall(
      store: InMemoryVectorStore,
      bruteForce: InMemoryVectorStore,
      numQueries: number
    ): Promise<number> {
      let totalRecall = 0;

      for (let i = 0; i < numQueries; i++) {
        const query = randomVector(DIMENSIONS);

        const hnswResults = await store.search(query, { topK: TOPK });
        const exactResults = await bruteForce.search(query, { topK: TOPK });

        const hnswIds = new Set(hnswResults.map((r) => r.id));
        const exactIds = exactResults.map((r) => r.id);

        let correct = 0;
        for (const id of exactIds) {
          if (hnswIds.has(id)) correct++;
        }

        totalRecall += correct / TOPK;
      }

      return totalRecall / numQueries;
    }

    it('should achieve >80% recall with efSearch=100', async () => {
      // Note: HNSW trades some recall for speed. 80%+ recall is excellent
      // for RAG use cases where we over-retrieve and rerank anyway.
      // Higher recall can be achieved by increasing efSearch (but slower).
      const hnswStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'hnsw',
        hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
      });
      await hnswStore.insert(chunks);

      const bruteForceStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'brute-force',
      });
      await bruteForceStore.insert(chunks);

      const recall = await measureRecall(hnswStore, bruteForceStore, 20);
      console.log(`\nRecall@${TOPK} with efSearch=100: ${(recall * 100).toFixed(1)}%`);

      // 80% recall is a reasonable target for approximate search
      // Production systems typically achieve 85-95% with tuned parameters
      expect(recall).toBeGreaterThanOrEqual(0.80);
    });

    it('should achieve >90% recall with efSearch=200', async () => {
      // Higher efSearch gives better recall at the cost of speed
      const hnswStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'hnsw',
        hnswConfig: { M: 16, efConstruction: 200, efSearch: 200 },
      });
      await hnswStore.insert(chunks);

      const bruteForceStore = new InMemoryVectorStore({
        dimensions: DIMENSIONS,
        indexType: 'brute-force',
      });
      await bruteForceStore.insert(chunks);

      const recall = await measureRecall(hnswStore, bruteForceStore, 20);
      console.log(`\nRecall@${TOPK} with efSearch=200: ${(recall * 100).toFixed(1)}%`);

      expect(recall).toBeGreaterThanOrEqual(0.90);
    });
  });
});
