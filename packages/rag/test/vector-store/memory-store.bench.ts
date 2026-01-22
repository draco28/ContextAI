/**
 * Memory Store Performance Benchmarks
 *
 * Validates NFR-102: Vector search shall complete within 100ms for 10,000 chunks
 *
 * Run with: pnpm vitest bench packages/rag/test/vector-store/memory-store.bench.ts
 */

import { describe, bench, beforeAll } from 'vitest';
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
 * Generate a random vector of given dimension.
 */
function randomVector(dimensions: number): number[] {
  const vec = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  // Normalize to unit length for cosine similarity
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / norm);
}

/**
 * Generate test chunks with random embeddings.
 */
function generateChunks(count: number, dimensions: number): ChunkWithEmbedding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    content: `Test content for chunk ${i}`,
    embedding: randomVector(dimensions),
    metadata: { index: i },
  }));
}

// ============================================================================
// Small Dataset (1K vectors) - Baseline
// ============================================================================

describe('InMemoryVectorStore Benchmarks - 1K Vectors', () => {
  let bruteForceStore: InMemoryVectorStore;
  let hnswStore: InMemoryVectorStore;
  let queryVector: number[];

  beforeAll(async () => {
    const chunks = generateChunks(1000, DIMENSIONS);
    queryVector = randomVector(DIMENSIONS);

    // Initialize brute-force store
    bruteForceStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'brute-force',
    });
    await bruteForceStore.insert(chunks);

    // Initialize HNSW store
    hnswStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 50 },
    });
    await hnswStore.insert(chunks);
  });

  bench('brute-force search (1K vectors)', async () => {
    await bruteForceStore.search(queryVector, { topK: TOPK });
  });

  bench('HNSW search (1K vectors)', async () => {
    await hnswStore.search(queryVector, { topK: TOPK });
  });
});

// ============================================================================
// Medium Dataset (10K vectors) - NFR-102 Target
// ============================================================================

describe('InMemoryVectorStore Benchmarks - 10K Vectors (NFR-102)', () => {
  let bruteForceStore: InMemoryVectorStore;
  let hnswStore: InMemoryVectorStore;
  let queryVector: number[];

  beforeAll(async () => {
    const chunks = generateChunks(10_000, DIMENSIONS);
    queryVector = randomVector(DIMENSIONS);

    // Initialize brute-force store
    bruteForceStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'brute-force',
    });
    await bruteForceStore.insert(chunks);

    // Initialize HNSW store
    hnswStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
    });
    await hnswStore.insert(chunks);
  });

  bench('brute-force search (10K vectors)', async () => {
    await bruteForceStore.search(queryVector, { topK: TOPK });
  });

  bench('HNSW search (10K vectors) - NFR-102 Target <100ms', async () => {
    await hnswStore.search(queryVector, { topK: TOPK });
  });
});

// ============================================================================
// Large Dataset (50K vectors) - Stretch Goal
// ============================================================================

describe('InMemoryVectorStore Benchmarks - 50K Vectors (Stretch)', () => {
  let hnswStore: InMemoryVectorStore;
  let queryVector: number[];

  beforeAll(async () => {
    const chunks = generateChunks(50_000, DIMENSIONS);
    queryVector = randomVector(DIMENSIONS);

    // Only test HNSW for large dataset (brute-force would be too slow)
    hnswStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
    });
    await hnswStore.insert(chunks);
  });

  bench('HNSW search (50K vectors) - Stretch Goal <200ms', async () => {
    await hnswStore.search(queryVector, { topK: TOPK });
  });
});

// ============================================================================
// HNSW Configuration Comparison
// ============================================================================

describe('HNSW Configuration Comparison (10K Vectors)', () => {
  let lowEfStore: InMemoryVectorStore;
  let mediumEfStore: InMemoryVectorStore;
  let highEfStore: InMemoryVectorStore;
  let queryVector: number[];

  beforeAll(async () => {
    const chunks = generateChunks(10_000, DIMENSIONS);
    queryVector = randomVector(DIMENSIONS);

    // Low efSearch (fast, lower recall)
    lowEfStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 20 },
    });
    await lowEfStore.insert(chunks);

    // Medium efSearch (balanced)
    mediumEfStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 100 },
    });
    await mediumEfStore.insert(chunks);

    // High efSearch (slower, higher recall)
    highEfStore = new InMemoryVectorStore({
      dimensions: DIMENSIONS,
      indexType: 'hnsw',
      hnswConfig: { M: 16, efConstruction: 200, efSearch: 200 },
    });
    await highEfStore.insert(chunks);
  });

  bench('HNSW efSearch=20 (fast)', async () => {
    await lowEfStore.search(queryVector, { topK: TOPK });
  });

  bench('HNSW efSearch=100 (balanced)', async () => {
    await mediumEfStore.search(queryVector, { topK: TOPK });
  });

  bench('HNSW efSearch=200 (high recall)', async () => {
    await highEfStore.search(queryVector, { topK: TOPK });
  });
});
