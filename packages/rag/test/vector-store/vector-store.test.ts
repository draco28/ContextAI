import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryVectorStore,
  VectorStoreError,
  type ChunkWithEmbedding,
  type VectorStoreConfig,
} from '../../src/index.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test chunk with embedding.
 */
function createChunk(
  id: string,
  embedding: number[],
  metadata: Record<string, unknown> = {}
): ChunkWithEmbedding {
  return {
    id,
    content: `Content for ${id}`,
    embedding,
    metadata,
  };
}

/**
 * Create a normalized 3D unit vector.
 */
function unitVector(x: number, y: number, z: number): number[] {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  return [x / magnitude, y / magnitude, z / magnitude];
}

// ============================================================================
// VectorStoreError Tests
// ============================================================================

describe('Vector Store', () => {
  describe('VectorStoreError', () => {
    it('should create error with all properties', () => {
      const error = new VectorStoreError(
        'Test error message',
        'DIMENSION_MISMATCH',
        'TestStore'
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('DIMENSION_MISMATCH');
      expect(error.storeName).toBe('TestStore');
      expect(error.name).toBe('VectorStoreError');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new VectorStoreError(
        'Wrapper error',
        'STORE_ERROR',
        'TestStore',
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should convert to details object', () => {
      const error = new VectorStoreError(
        'Test error',
        'CHUNK_NOT_FOUND',
        'TestStore'
      );

      const details = error.toDetails();
      expect(details).toEqual({
        code: 'CHUNK_NOT_FOUND',
        storeName: 'TestStore',
        cause: undefined,
      });
    });

    describe('static factory methods', () => {
      it('should create dimension mismatch error', () => {
        const error = VectorStoreError.dimensionMismatch('Store', 1536, 768);
        expect(error.code).toBe('DIMENSION_MISMATCH');
        expect(error.message).toContain('1536');
        expect(error.message).toContain('768');
      });

      it('should create chunk not found error', () => {
        const error = VectorStoreError.chunkNotFound('Store', ['id1', 'id2']);
        expect(error.code).toBe('CHUNK_NOT_FOUND');
        expect(error.message).toContain('id1');
      });

      it('should truncate long ID lists', () => {
        const error = VectorStoreError.chunkNotFound('Store', [
          'id1',
          'id2',
          'id3',
          'id4',
          'id5',
        ]);
        expect(error.message).toContain('...');
      });

      it('should create store unavailable error', () => {
        const error = VectorStoreError.storeUnavailable(
          'Store',
          'connection failed'
        );
        expect(error.code).toBe('STORE_UNAVAILABLE');
        expect(error.message).toContain('connection failed');
      });

      it('should create invalid query error', () => {
        const error = VectorStoreError.invalidQuery('Store', 'empty vector');
        expect(error.code).toBe('INVALID_QUERY');
        expect(error.message).toContain('empty vector');
      });

      it('should create invalid filter error', () => {
        const error = VectorStoreError.invalidFilter(
          'Store',
          'unknown operator'
        );
        expect(error.code).toBe('INVALID_FILTER');
        expect(error.message).toContain('unknown operator');
      });

      it('should create insert failed error', () => {
        const cause = new Error('DB error');
        const error = VectorStoreError.insertFailed(
          'Store',
          'write failed',
          cause
        );
        expect(error.code).toBe('INSERT_FAILED');
        expect(error.cause).toBe(cause);
      });

      it('should create delete failed error', () => {
        const error = VectorStoreError.deleteFailed(
          'Store',
          'permission denied'
        );
        expect(error.code).toBe('DELETE_FAILED');
        expect(error.message).toContain('permission denied');
      });
    });
  });

  // ==========================================================================
  // InMemoryVectorStore Tests
  // ==========================================================================

  describe('InMemoryVectorStore', () => {
    let store: InMemoryVectorStore;
    const config: VectorStoreConfig = { dimensions: 3 };

    beforeEach(() => {
      store = new InMemoryVectorStore(config);
    });

    describe('properties', () => {
      it('should have correct name', () => {
        expect(store.name).toBe('InMemoryVectorStore');
      });

      it('should have correct dimensions', () => {
        expect(store.dimensions).toBe(3);
      });
    });

    describe('insert', () => {
      it('should insert single chunk', async () => {
        const chunk = createChunk('chunk-1', [1, 0, 0]);
        const ids = await store.insert([chunk]);

        expect(ids).toEqual(['chunk-1']);
        expect(await store.count()).toBe(1);
      });

      it('should insert multiple chunks', async () => {
        const chunks = [
          createChunk('chunk-1', [1, 0, 0]),
          createChunk('chunk-2', [0, 1, 0]),
          createChunk('chunk-3', [0, 0, 1]),
        ];
        const ids = await store.insert(chunks);

        expect(ids).toHaveLength(3);
        expect(await store.count()).toBe(3);
      });

      it('should generate ID when not provided', async () => {
        const chunk = createChunk('', [1, 0, 0]);
        chunk.id = ''; // Clear ID
        const ids = await store.insert([chunk]);

        expect(ids).toHaveLength(1);
        expect(ids[0]).toMatch(/^chunk_\d+_/);
      });

      it('should return empty array for empty input', async () => {
        const ids = await store.insert([]);
        expect(ids).toEqual([]);
      });

      it('should throw for dimension mismatch', async () => {
        const chunk = createChunk('chunk-1', [1, 0, 0, 0]); // 4D, store expects 3D

        await expect(store.insert([chunk])).rejects.toThrow(VectorStoreError);
        await expect(store.insert([chunk])).rejects.toThrow(
          'Dimension mismatch'
        );
      });
    });

    describe('search', () => {
      beforeEach(async () => {
        // Insert test data: 3 orthogonal unit vectors
        await store.insert([
          createChunk('x', [1, 0, 0], { axis: 'x', value: 1 }),
          createChunk('y', [0, 1, 0], { axis: 'y', value: 2 }),
          createChunk('z', [0, 0, 1], { axis: 'z', value: 3 }),
        ]);
      });

      it('should find exact match with score 1.0', async () => {
        const results = await store.search([1, 0, 0], { topK: 1 });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('x');
        expect(results[0].score).toBeCloseTo(1.0);
      });

      it('should return results sorted by score descending', async () => {
        // Query that's closest to X, then Y, then Z
        const query = unitVector(3, 2, 1);
        const results = await store.search(query, { topK: 3 });

        expect(results).toHaveLength(3);
        expect(results[0].score).toBeGreaterThan(results[1].score);
        expect(results[1].score).toBeGreaterThan(results[2].score);
      });

      it('should respect topK limit', async () => {
        const results = await store.search([1, 0, 0], { topK: 2 });
        expect(results).toHaveLength(2);
      });

      it('should use default topK of 10', async () => {
        const results = await store.search([1, 0, 0]);
        expect(results).toHaveLength(3); // Only 3 chunks in store
      });

      it('should respect minScore threshold', async () => {
        // Only exact match should pass minScore of 0.9
        const results = await store.search([1, 0, 0], {
          topK: 10,
          minScore: 0.9,
        });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('x');
      });

      it('should include metadata by default', async () => {
        const results = await store.search([1, 0, 0], { topK: 1 });

        expect(results[0].chunk.metadata).toEqual({ axis: 'x', value: 1 });
      });

      it('should exclude metadata when includeMetadata is false', async () => {
        const results = await store.search([1, 0, 0], {
          topK: 1,
          includeMetadata: false,
        });

        expect(results[0].chunk.metadata).toEqual({});
      });

      it('should exclude vectors by default', async () => {
        const results = await store.search([1, 0, 0], { topK: 1 });
        expect(results[0].embedding).toBeUndefined();
      });

      it('should include vectors when requested', async () => {
        const results = await store.search([1, 0, 0], {
          topK: 1,
          includeVectors: true,
        });

        expect(results[0].embedding).toEqual([1, 0, 0]);
      });

      it('should throw for empty query', async () => {
        await expect(store.search([])).rejects.toThrow(VectorStoreError);
        await expect(store.search([])).rejects.toThrow('empty');
      });

      it('should throw for dimension mismatch', async () => {
        await expect(store.search([1, 0])).rejects.toThrow(
          'Dimension mismatch'
        );
      });
    });

    describe('metadata filtering', () => {
      beforeEach(async () => {
        await store.insert([
          createChunk('doc1-p1', [1, 0, 0], {
            documentId: 'doc1',
            pageNumber: 1,
            category: 'tech',
          }),
          createChunk('doc1-p2', [0, 1, 0], {
            documentId: 'doc1',
            pageNumber: 2,
            category: 'tech',
          }),
          createChunk('doc2-p1', [0, 0, 1], {
            documentId: 'doc2',
            pageNumber: 1,
            category: 'science',
          }),
        ]);
      });

      it('should filter by exact value', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { documentId: 'doc1' },
        });

        expect(results).toHaveLength(2);
        expect(
          results.every((r) => r.chunk.metadata.documentId === 'doc1')
        ).toBe(true);
      });

      it('should filter by $in operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { category: { $in: ['tech', 'business'] } },
        });

        expect(results).toHaveLength(2);
      });

      it('should filter by $gt operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { pageNumber: { $gt: 1 } },
        });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('doc1-p2');
      });

      it('should filter by $gte operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { pageNumber: { $gte: 2 } },
        });

        expect(results).toHaveLength(1);
      });

      it('should filter by $lt operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { pageNumber: { $lt: 2 } },
        });

        expect(results).toHaveLength(2);
      });

      it('should filter by $lte operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { pageNumber: { $lte: 1 } },
        });

        expect(results).toHaveLength(2);
      });

      it('should filter by $ne operator', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: { category: { $ne: 'tech' } },
        });

        expect(results).toHaveLength(1);
        expect(results[0].chunk.metadata.category).toBe('science');
      });

      it('should combine multiple filter conditions (AND)', async () => {
        const results = await store.search([1, 1, 1], {
          topK: 10,
          filter: {
            documentId: 'doc1',
            pageNumber: { $gt: 1 },
          },
        });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('doc1-p2');
      });
    });

    describe('upsert', () => {
      it('should insert new chunks', async () => {
        const chunk = createChunk('chunk-1', [1, 0, 0]);
        const ids = await store.upsert([chunk]);

        expect(ids).toEqual(['chunk-1']);
        expect(await store.count()).toBe(1);
      });

      it('should update existing chunks', async () => {
        // Insert initial
        await store.insert([createChunk('chunk-1', [1, 0, 0], { version: 1 })]);

        // Upsert with new data
        await store.upsert([createChunk('chunk-1', [0, 1, 0], { version: 2 })]);

        expect(await store.count()).toBe(1);

        // Verify updated
        const results = await store.search([0, 1, 0], { topK: 1 });
        expect(results[0].chunk.metadata.version).toBe(2);
      });
    });

    describe('delete', () => {
      beforeEach(async () => {
        await store.insert([
          createChunk('chunk-1', [1, 0, 0]),
          createChunk('chunk-2', [0, 1, 0]),
          createChunk('chunk-3', [0, 0, 1]),
        ]);
      });

      it('should delete single chunk', async () => {
        await store.delete(['chunk-1']);
        expect(await store.count()).toBe(2);
      });

      it('should delete multiple chunks', async () => {
        await store.delete(['chunk-1', 'chunk-2']);
        expect(await store.count()).toBe(1);
      });

      it('should silently ignore non-existent IDs', async () => {
        await store.delete(['non-existent']);
        expect(await store.count()).toBe(3);
      });

      it('should handle empty array', async () => {
        await store.delete([]);
        expect(await store.count()).toBe(3);
      });
    });

    describe('count', () => {
      it('should return 0 for empty store', async () => {
        expect(await store.count()).toBe(0);
      });

      it('should return correct count after inserts', async () => {
        await store.insert([
          createChunk('1', [1, 0, 0]),
          createChunk('2', [0, 1, 0]),
        ]);
        expect(await store.count()).toBe(2);
      });
    });

    describe('clear', () => {
      it('should remove all chunks', async () => {
        await store.insert([
          createChunk('1', [1, 0, 0]),
          createChunk('2', [0, 1, 0]),
        ]);

        await store.clear();
        expect(await store.count()).toBe(0);
      });
    });

    describe('distance metrics', () => {
      it('should use cosine similarity by default', async () => {
        const cosineStore = new InMemoryVectorStore({ dimensions: 3 });
        await cosineStore.insert([createChunk('1', [1, 0, 0])]);

        const results = await cosineStore.search([1, 0, 0], { topK: 1 });
        expect(results[0].score).toBeCloseTo(1.0);
      });

      it('should support dot product metric', async () => {
        const dotStore = new InMemoryVectorStore({
          dimensions: 3,
          distanceMetric: 'dotProduct',
        });
        await dotStore.insert([createChunk('1', [1, 0, 0])]);

        const results = await dotStore.search([2, 0, 0], { topK: 1 });
        expect(results[0].score).toBeCloseTo(2.0); // dot([1,0,0], [2,0,0]) = 2
      });

      it('should support euclidean metric', async () => {
        const euclideanStore = new InMemoryVectorStore({
          dimensions: 3,
          distanceMetric: 'euclidean',
        });
        await euclideanStore.insert([
          createChunk('near', [1, 0, 0]),
          createChunk('far', [10, 0, 0]),
        ]);

        // Query at origin - 'near' should have higher score (closer)
        const results = await euclideanStore.search([0, 0, 0], { topK: 2 });
        expect(results[0].id).toBe('near');
        expect(results[0].score).toBeGreaterThan(results[1].score);
      });
    });

    describe('HNSW index mode', () => {
      let hnswStore: InstanceType<typeof InMemoryVectorStore>;

      beforeEach(() => {
        hnswStore = new InMemoryVectorStore({
          dimensions: 3,
          indexType: 'hnsw',
          hnswConfig: { M: 16, efConstruction: 100, efSearch: 50 },
        });
      });

      it('should report hnsw index type', () => {
        expect(hnswStore.getIndexType()).toBe('hnsw');
      });

      it('should insert and search with HNSW', async () => {
        await hnswStore.insert([
          createChunk('chunk-1', unitVector(1, 0, 0)),
          createChunk('chunk-2', unitVector(0, 1, 0)),
          createChunk('chunk-3', unitVector(0, 0, 1)),
        ]);

        const results = await hnswStore.search(unitVector(1, 0, 0), {
          topK: 3,
        });

        expect(results).toHaveLength(3);
        // Closest should be chunk-1 (identical direction)
        expect(results[0].id).toBe('chunk-1');
        expect(results[0].score).toBeCloseTo(1.0);
      });

      it('should support metadata filtering with HNSW', async () => {
        await hnswStore.insert([
          createChunk('chunk-1', unitVector(1, 0, 0), { category: 'A' }),
          createChunk('chunk-2', unitVector(0.9, 0.1, 0), { category: 'B' }),
          createChunk('chunk-3', unitVector(0.8, 0.2, 0), { category: 'A' }),
        ]);

        const results = await hnswStore.search(unitVector(1, 0, 0), {
          topK: 2,
          filter: { category: 'A' },
        });

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.chunk.metadata.category === 'A')).toBe(
          true
        );
      });

      it('should support minScore with HNSW', async () => {
        await hnswStore.insert([
          createChunk('similar', unitVector(1, 0, 0)),
          createChunk('different', unitVector(0, 1, 0)),
        ]);

        const results = await hnswStore.search(unitVector(1, 0, 0), {
          topK: 10,
          minScore: 0.5,
        });

        // Only 'similar' should pass the threshold
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('similar');
      });

      it('should delete from HNSW index', async () => {
        await hnswStore.insert([
          createChunk('chunk-1', unitVector(1, 0, 0)),
          createChunk('chunk-2', unitVector(0, 1, 0)),
        ]);

        await hnswStore.delete(['chunk-1']);

        const results = await hnswStore.search(unitVector(1, 0, 0), {
          topK: 5,
        });

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('chunk-2');
      });

      it('should clear HNSW index', async () => {
        await hnswStore.insert([
          createChunk('chunk-1', unitVector(1, 0, 0)),
          createChunk('chunk-2', unitVector(0, 1, 0)),
        ]);

        await hnswStore.clear();

        expect(await hnswStore.count()).toBe(0);

        const results = await hnswStore.search(unitVector(1, 0, 0), {
          topK: 5,
        });
        expect(results).toHaveLength(0);
      });

      it('should work with larger dataset', async () => {
        // Insert 100 vectors
        const chunks: ReturnType<typeof createChunk>[] = [];
        for (let i = 0; i < 100; i++) {
          const angle = (i / 100) * Math.PI * 2;
          chunks.push(
            createChunk(`chunk-${i}`, [Math.cos(angle), Math.sin(angle), 0])
          );
        }
        await hnswStore.insert(chunks);

        // Search should return results quickly
        const results = await hnswStore.search([1, 0, 0], { topK: 5 });

        expect(results).toHaveLength(5);
        // First result should be close to [1, 0, 0]
        expect(results[0].score).toBeGreaterThan(0.9);
      });
    });
  });
});
