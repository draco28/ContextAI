/**
 * Memory-Enabled Vector Store Tests
 *
 * Tests for Float32Array storage and memory budget enforcement
 * in InMemoryVectorStore.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryVectorStore } from '../../src/vector-store/memory-store.js';
import type { ChunkWithEmbedding } from '../../src/vector-store/types.js';
import { BYTES_PER_FLOAT32, BYTES_PER_FLOAT64 } from '../../src/memory/types.js';

/**
 * Generate a random embedding vector.
 */
function randomEmbedding(dimensions: number): number[] {
  return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}

/**
 * Generate test chunks with embeddings.
 */
function generateChunks(
  count: number,
  dimensions: number
): ChunkWithEmbedding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `chunk-${i}`,
    content: `Test content ${i}`,
    metadata: { index: i },
    embedding: randomEmbedding(dimensions),
  }));
}

describe('InMemoryVectorStore Memory Management', () => {
  const dimensions = 1536; // OpenAI embedding size

  // ==========================================================================
  // Float32Array Storage
  // ==========================================================================

  describe('Float32Array storage', () => {
    it('should use Float32Array by default (useFloat32: true)', async () => {
      const store = new InMemoryVectorStore({ dimensions });

      // Default should be Float32
      expect(store.isUsingFloat32()).toBe(true);
    });

    it('should allow disabling Float32Array', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: false,
      });

      expect(store.isUsingFloat32()).toBe(false);
    });

    it('should track correct memory with Float32 (4 bytes/float)', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });

      const chunks = generateChunks(10, dimensions);
      await store.insert(chunks);

      // 10 chunks * 1536 dims * 4 bytes = 61,440 bytes
      const expectedBytes = 10 * dimensions * BYTES_PER_FLOAT32;
      expect(store.memoryUsage()).toBe(expectedBytes);
    });

    it('should track correct memory with Float64 (8 bytes/float)', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: false,
      });

      const chunks = generateChunks(10, dimensions);
      await store.insert(chunks);

      // 10 chunks * 1536 dims * 8 bytes = 122,880 bytes
      const expectedBytes = 10 * dimensions * BYTES_PER_FLOAT64;
      expect(store.memoryUsage()).toBe(expectedBytes);
    });

    it('should save 50% memory with Float32', async () => {
      const store32 = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });
      const store64 = new InMemoryVectorStore({
        dimensions,
        useFloat32: false,
      });

      const chunks = generateChunks(100, dimensions);
      await store32.insert(chunks);
      await store64.insert(chunks);

      // Float32 should use exactly half the memory
      expect(store32.memoryUsage()).toBe(store64.memoryUsage() / 2);
    });
  });

  // ==========================================================================
  // Search Accuracy with Float32
  // ==========================================================================

  describe('search accuracy with Float32', () => {
    it('should return accurate search results with Float32', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });

      const chunks = generateChunks(100, dimensions);
      await store.insert(chunks);

      // Search with the first chunk's embedding
      const query = chunks[0].embedding;
      const results = await store.search(query, { topK: 5 });

      // First result should be the exact match
      expect(results[0].id).toBe('chunk-0');
      expect(results[0].score).toBeGreaterThan(0.99); // Very high similarity
    });

    it('should have minimal accuracy difference vs Float64', async () => {
      const store32 = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });
      const store64 = new InMemoryVectorStore({
        dimensions,
        useFloat32: false,
      });

      const chunks = generateChunks(100, dimensions);
      await store32.insert(chunks);
      await store64.insert(chunks);

      const query = randomEmbedding(dimensions);
      const results32 = await store32.search(query, { topK: 10 });
      const results64 = await store64.search(query, { topK: 10 });

      // Results should be in same order (or very close)
      for (let i = 0; i < 10; i++) {
        // Score difference should be minimal
        const scoreDiff = Math.abs(results32[i].score - results64[i].score);
        expect(scoreDiff).toBeLessThan(0.001); // < 0.1% difference
      }
    });

    it('should return embeddings as number[] in search results', async () => {
      const store = new InMemoryVectorStore({
        dimensions: 10, // Small for this test
        useFloat32: true,
      });

      const chunks = generateChunks(5, 10);
      await store.insert(chunks);

      const results = await store.search(chunks[0].embedding, {
        topK: 1,
        includeVectors: true,
      });

      // Even though stored as Float32Array, API returns number[]
      expect(Array.isArray(results[0].embedding)).toBe(true);
      expect(results[0].embedding!.length).toBe(10);
    });
  });

  // ==========================================================================
  // Memory Budget Enforcement
  // ==========================================================================

  describe('memory budget enforcement', () => {
    it('should evict LRU items when budget exceeded', async () => {
      const bytesPerChunk = dimensions * BYTES_PER_FLOAT32; // 6144 bytes
      const maxChunks = 10;
      const maxMemoryBytes = bytesPerChunk * maxChunks;

      const evictedIds: string[] = [];
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
        maxMemoryBytes,
        onEviction: (ids) => evictedIds.push(...ids),
      });

      // Insert 10 chunks (fills budget exactly)
      const firstBatch = generateChunks(10, dimensions);
      await store.insert(firstBatch);

      expect(await store.count()).toBe(10);
      expect(store.memoryUsage()).toBe(maxMemoryBytes);
      expect(evictedIds.length).toBe(0);

      // Insert 5 more - should evict 5 oldest
      const secondBatch = generateChunks(5, dimensions).map((c, i) => ({
        ...c,
        id: `new-chunk-${i}`,
      }));
      await store.insert(secondBatch);

      expect(await store.count()).toBe(10); // Still at max
      expect(evictedIds.length).toBe(5); // 5 were evicted

      // Oldest chunks should have been evicted
      expect(evictedIds).toContain('chunk-0');
      expect(evictedIds).toContain('chunk-1');
      expect(evictedIds).toContain('chunk-2');
      expect(evictedIds).toContain('chunk-3');
      expect(evictedIds).toContain('chunk-4');
    });

    it('should fire eviction callback with evicted IDs', async () => {
      const bytesPerChunk = 10 * BYTES_PER_FLOAT32; // Small dimensions
      const maxMemoryBytes = bytesPerChunk * 5; // Only 5 chunks

      const evictedIds: string[] = [];
      const store = new InMemoryVectorStore({
        dimensions: 10,
        useFloat32: true,
        maxMemoryBytes,
        onEviction: (ids) => evictedIds.push(...ids),
      });

      // Insert 5 chunks
      const batch1 = generateChunks(5, 10);
      await store.insert(batch1);

      // Insert 3 more - should evict 3 oldest
      const batch2 = generateChunks(3, 10).map((c, i) => ({
        ...c,
        id: `batch2-${i}`,
      }));
      await store.insert(batch2);

      expect(evictedIds).toContain('chunk-0');
      expect(evictedIds).toContain('chunk-1');
      expect(evictedIds).toContain('chunk-2');
    });

    it('should not evict when no budget is set', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
        // No maxMemoryBytes
      });

      const chunks = generateChunks(1000, dimensions);
      await store.insert(chunks);

      expect(await store.count()).toBe(1000);
    });
  });

  // ==========================================================================
  // Memory Stats
  // ==========================================================================

  describe('getMemoryStats', () => {
    it('should return comprehensive memory statistics', async () => {
      const maxMemoryBytes = 100 * 1024 * 1024; // 100MB
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
        maxMemoryBytes,
      });

      const chunks = generateChunks(100, dimensions);
      await store.insert(chunks);

      const stats = store.getMemoryStats();

      expect(stats.usedBytes).toBe(100 * dimensions * BYTES_PER_FLOAT32);
      expect(stats.maxBytes).toBe(maxMemoryBytes);
      expect(stats.chunkCount).toBe(100);
      expect(stats.bytesPerChunk).toBe(dimensions * BYTES_PER_FLOAT32);
      // 100 chunks * 1536 * 4 = 614,400 bytes / 104,857,600 (100MB) * 100 = 0.5859%
      expect(stats.percentUsed).toBeCloseTo(0.5859, 2);
      expect(stats.useFloat32).toBe(true);
    });

    it('should report 0% when no max is set', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });

      await store.insert(generateChunks(10, dimensions));
      const stats = store.getMemoryStats();

      expect(stats.maxBytes).toBe(0);
      expect(stats.percentUsed).toBe(0);
    });
  });

  // ==========================================================================
  // Delete and Clear
  // ==========================================================================

  describe('memory release on delete/clear', () => {
    it('should release memory when chunks are deleted', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });

      const chunks = generateChunks(10, dimensions);
      await store.insert(chunks);

      const initialMemory = store.memoryUsage();
      expect(initialMemory).toBeGreaterThan(0);

      // Delete half
      await store.delete(['chunk-0', 'chunk-1', 'chunk-2', 'chunk-3', 'chunk-4']);

      expect(store.memoryUsage()).toBe(initialMemory / 2);
      expect(await store.count()).toBe(5);
    });

    it('should reset memory to zero on clear', async () => {
      const store = new InMemoryVectorStore({
        dimensions,
        useFloat32: true,
      });

      const chunks = generateChunks(100, dimensions);
      await store.insert(chunks);

      expect(store.memoryUsage()).toBeGreaterThan(0);

      await store.clear();

      expect(store.memoryUsage()).toBe(0);
      expect(await store.count()).toBe(0);
    });
  });

  // ==========================================================================
  // NFR-103 Compliance
  // ==========================================================================

  describe('NFR-103 compliance (100MB for 1000 chunks)', () => {
    it('should store 1000 chunks with 1536 dims in <100MB', async () => {
      const store = new InMemoryVectorStore({
        dimensions: 1536,
        useFloat32: true,
      });

      const chunks = generateChunks(1000, 1536);
      await store.insert(chunks);

      const stats = store.getMemoryStats();

      // Expected: 1000 * 1536 * 4 = 6,144,000 bytes (~6.1MB)
      // Well under 100MB requirement
      expect(stats.usedBytes).toBeLessThan(100 * 1024 * 1024);
      expect(stats.usedBytes).toBe(6_144_000);

      // Verify search still works
      const results = await store.search(chunks[500].embedding, { topK: 5 });
      expect(results[0].id).toBe('chunk-500');
    });

    it('should handle budget enforcement at 100MB limit', async () => {
      const maxMemoryBytes = 100 * 1024 * 1024; // 100MB
      const bytesPerChunk = 1536 * BYTES_PER_FLOAT32; // 6144 bytes

      let evictionCount = 0;
      const store = new InMemoryVectorStore({
        dimensions: 1536,
        useFloat32: true,
        maxMemoryBytes,
        onEviction: (ids) => {
          evictionCount += ids.length;
        },
      });

      // Insert chunks in batches to test eviction behavior
      // First fill up the budget
      const maxChunks = Math.floor(maxMemoryBytes / bytesPerChunk);
      const firstBatch = generateChunks(maxChunks, 1536);
      await store.insert(firstBatch);

      // Now insert more - should trigger eviction
      const secondBatch = generateChunks(100, 1536).map((c, i) => ({
        ...c,
        id: `second-batch-${i}`,
      }));
      await store.insert(secondBatch);

      // Eviction should have occurred
      expect(evictionCount).toBeGreaterThan(0);

      // Final usage should be close to the budget (within one batch worth)
      const stats = store.getMemoryStats();
      expect(stats.usedBytes).toBeLessThanOrEqual(
        maxMemoryBytes + bytesPerChunk * 100
      );
    });
  });
});
