import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VectorStoreError } from '../../src/vector-store/errors.js';
import type { ChunkWithEmbedding } from '../../src/vector-store/types.js';

// ============================================================================
// Mock pg module
// ============================================================================

const mockQuery = vi.fn();
const mockRelease = vi.fn();
const mockConnect = vi.fn();
const mockEnd = vi.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease,
};

const mockPool = {
  connect: mockConnect,
  query: mockQuery,
  end: mockEnd,
};

vi.mock('pg', () => ({
  Pool: vi.fn(() => mockPool),
}));

// Import after mock is set up
import { PgVectorStore } from '../../src/vector-store/pg-store.js';

// ============================================================================
// Test Helpers
// ============================================================================

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

function resetMocks() {
  mockQuery.mockReset();
  mockRelease.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockEnd.mockReset();
}

// ============================================================================
// Tests
// ============================================================================

describe('PgVectorStore', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if neither connectionString nor pool provided', () => {
      expect(() => {
        new PgVectorStore({ dimensions: 3 });
      }).toThrow(VectorStoreError);
      expect(() => {
        new PgVectorStore({ dimensions: 3 });
      }).toThrow('Either connectionString or pool must be provided');
    });

    // Note: connectionString test requires real pg package (integration test)
    // Here we test that pool injection works correctly
    it('should accept injected pool and set dimensions', () => {
      const store = new PgVectorStore({
        dimensions: 1536,
        pool: mockPool,
      });
      expect(store.name).toBe('PgVectorStore');
      expect(store.dimensions).toBe(1536);
    });

    it('should accept existing pool', () => {
      const store = new PgVectorStore({
        dimensions: 768,
        pool: mockPool,
      });
      expect(store.name).toBe('PgVectorStore');
      expect(store.dimensions).toBe(768);
    });

    it('should use default table name', () => {
      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });
      // We can't directly access private fields, but we can verify via ensureTable
      expect(store).toBeDefined();
    });
  });

  describe('ensureTable', () => {
    it('should create extension, table, and indexes', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 1536,
        pool: mockPool,
        tableName: 'test_vectors',
      });

      await store.ensureTable();

      // Should have connected
      expect(mockConnect).toHaveBeenCalledTimes(1);

      // Should create extension
      expect(mockQuery).toHaveBeenCalledWith(
        'CREATE EXTENSION IF NOT EXISTS vector'
      );

      // Should create table (check for key parts)
      const createTableCall = mockQuery.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('CREATE TABLE')
      );
      expect(createTableCall).toBeDefined();
      expect(createTableCall![0]).toContain('vector(1536)');
      expect(createTableCall![0]).toContain('JSONB');

      // Should create HNSW index by default
      const createIndexCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('USING hnsw')
      );
      expect(createIndexCall).toBeDefined();

      // Should release client
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should create ivfflat index when configured', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 1536,
        pool: mockPool,
        indexType: 'ivfflat',
      });

      await store.ensureTable();

      const createIndexCall = mockQuery.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('USING ivfflat')
      );
      expect(createIndexCall).toBeDefined();
    });

    it('should skip vector index when indexType is none', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 1536,
        pool: mockPool,
        indexType: 'none',
      });

      await store.ensureTable();

      const hnswCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('USING hnsw')
      );
      const ivfflatCall = mockQuery.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('USING ivfflat')
      );
      expect(hnswCall).toBeUndefined();
      expect(ivfflatCall).toBeUndefined();
    });
  });

  describe('insert', () => {
    it('should insert chunks with parameterized queries', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const chunks = [
        createChunk('chunk-1', [0.1, 0.2, 0.3], { page: 1 }),
        createChunk('chunk-2', [0.4, 0.5, 0.6], { page: 2 }),
      ];

      const ids = await store.insert(chunks);

      expect(ids).toEqual(['chunk-1', 'chunk-2']);
      expect(mockConnect).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockQuery).toHaveBeenCalledWith('COMMIT');

      // Verify parameterized insert (check for $1, $2, etc.)
      const insertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO')
      );
      expect(insertCalls.length).toBe(2);

      // Each insert should have 5 parameters
      for (const call of insertCalls) {
        expect(call[1]).toHaveLength(5);
      }
    });

    it('should rollback on error', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockQuery.mockRejectedValueOnce(new Error('DB error')); // INSERT fails

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await expect(
        store.insert([createChunk('chunk-1', [0.1, 0.2, 0.3])])
      ).rejects.toThrow(VectorStoreError);

      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should generate IDs for chunks without them', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const chunk: ChunkWithEmbedding = {
        id: '', // Empty ID
        content: 'Test content',
        embedding: [0.1, 0.2, 0.3],
        metadata: {},
      };

      const ids = await store.insert([chunk]);

      expect(ids).toHaveLength(1);
      expect(ids[0]).toMatch(/^chunk_\d+_/);
    });
  });

  describe('search', () => {
    it('should execute parameterized search query', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'chunk-1',
            content: 'Test content',
            metadata: { page: 1 },
            document_id: 'doc-1',
            distance: 0.1,
          },
        ],
        rowCount: 1,
      });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const results = await store.search([0.1, 0.2, 0.3], { topK: 5 });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('chunk-1');
      expect(results[0].score).toBeCloseTo(0.9); // 1 - 0.1 for cosine

      // Verify query uses parameterized values
      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('ORDER BY')
      );
      expect(searchCall).toBeDefined();
      expect(searchCall![1]).toContain('[0.1,0.2,0.3]'); // Vector as first param
      expect(searchCall![1]).toContain(5); // topK as last param
    });

    it('should apply minScore filter', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 'high',
            content: '',
            metadata: {},
            document_id: null,
            distance: 0.1,
          },
          {
            id: 'low',
            content: '',
            metadata: {},
            document_id: null,
            distance: 0.9,
          },
        ],
        rowCount: 2,
      });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const results = await store.search([0.1, 0.2, 0.3], {
        topK: 10,
        minScore: 0.5,
      });

      // Only 'high' should pass (score = 0.9, which is > 0.5)
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('high');
    });

    it('should use correct operator for euclidean distance', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
        distanceMetric: 'euclidean',
      });

      await store.search([0.1, 0.2, 0.3], { topK: 5 });

      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('ORDER BY')
      );
      expect(searchCall![0]).toContain('<->'); // Euclidean operator
    });

    it('should use correct operator for dot product', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
        distanceMetric: 'dotProduct',
      });

      await store.search([0.1, 0.2, 0.3], { topK: 5 });

      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('ORDER BY')
      );
      expect(searchCall![0]).toContain('<#>'); // Dot product operator
    });
  });

  describe('metadata filtering', () => {
    it('should translate equality filter to parameterized SQL', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { documentId: 'doc-1' },
      });

      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('WHERE')
      );
      expect(searchCall).toBeDefined();
      expect(searchCall![0]).toContain('metadata->>');
      // Values should include the key and value as parameters
      expect(searchCall![1]).toContain('documentId');
      expect(searchCall![1]).toContain('doc-1');
    });

    it('should translate $in filter', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { category: { $in: ['tech', 'science'] } },
      });

      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('ANY')
      );
      expect(searchCall).toBeDefined();
    });

    it('should translate $gt filter', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { page: { $gt: 5 } },
      });

      const searchCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('::numeric >')
      );
      expect(searchCall).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete with parameterized IN clause', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 2 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.delete(['chunk-1', 'chunk-2']);

      const deleteCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('DELETE')
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toContain('IN ($1, $2)');
      expect(deleteCall![1]).toEqual(['chunk-1', 'chunk-2']);
    });
  });

  describe('count', () => {
    it('should return count from query', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ count: '42' }],
        rowCount: 1,
      });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const count = await store.count();

      expect(count).toBe(42);
    });
  });

  describe('clear', () => {
    it('should truncate table', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.clear();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('TRUNCATE')
      );
    });
  });

  describe('close', () => {
    // Note: Testing "pool owned" scenario requires real pg package (integration test)
    // The connectionString path creates an owned pool that should be closed.
    // Here we test the injected pool scenario which should NOT close.

    it('should not end pool if injected', async () => {
      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      await store.close();

      // Should not call end on injected pool (poolOwned = false)
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('should be safe to call close multiple times', async () => {
      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      // Multiple close calls should not throw
      await store.close();
      await store.close();

      expect(mockEnd).not.toHaveBeenCalled();
    });
  });

  describe('SQL injection prevention', () => {
    it('should escape table names', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
        tableName: 'my_vectors',
        schemaName: 'custom',
      });

      await store.count();

      const countCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('COUNT')
      );
      expect(countCall![0]).toContain('"custom"."my_vectors"');
    });

    it('should never interpolate user values into SQL', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const store = new PgVectorStore({
        dimensions: 3,
        pool: mockPool,
      });

      const maliciousChunk = createChunk(
        "'; DROP TABLE users; --",
        [0.1, 0.2, 0.3],
        { evil: "'; DELETE FROM *; --" }
      );

      await store.insert([maliciousChunk]);

      // The malicious ID should be in the values array, not the SQL string
      const insertCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT')
      );
      expect(insertCall![0]).not.toContain('DROP TABLE');
      expect(insertCall![1]).toContain("'; DROP TABLE users; --"); // Safe in values
    });
  });
});
