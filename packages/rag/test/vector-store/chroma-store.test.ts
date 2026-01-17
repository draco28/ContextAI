import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VectorStoreError } from '../../src/vector-store/errors.js';
import type { ChunkWithEmbedding } from '../../src/vector-store/types.js';

// ============================================================================
// Mock chromadb module
// ============================================================================

const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockQuery = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockCount = vi.fn();
const mockDeleteCollection = vi.fn();

const mockCollection = {
  add: mockAdd,
  update: mockUpdate,
  query: mockQuery,
  get: mockGet,
  delete: mockDelete,
  count: mockCount,
};

const mockGetOrCreateCollection = vi.fn();

const mockClient = {
  getOrCreateCollection: mockGetOrCreateCollection,
  deleteCollection: mockDeleteCollection,
};

const MockChromaClient = vi.fn(() => mockClient);

vi.mock('chromadb', () => ({
  ChromaClient: MockChromaClient,
}));

// Import after mock is set up
import { ChromaVectorStore } from '../../src/vector-store/chroma-store.js';

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
  mockAdd.mockReset();
  mockUpdate.mockReset();
  mockQuery.mockReset();
  mockGet.mockReset();
  mockDelete.mockReset();
  mockCount.mockReset();
  mockDeleteCollection.mockReset();
  mockGetOrCreateCollection.mockReset().mockResolvedValue(mockCollection);
  MockChromaClient.mockClear();
}

// ============================================================================
// Tests
// ============================================================================

describe('ChromaVectorStore', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should accept default configuration', () => {
      const store = new ChromaVectorStore({ dimensions: 1536 });
      expect(store.name).toBe('ChromaVectorStore');
      expect(store.dimensions).toBe(1536);
    });

    it('should accept custom collection name', () => {
      const store = new ChromaVectorStore({
        dimensions: 768,
        collectionName: 'my_collection',
      });
      expect(store).toBeDefined();
    });

    it('should accept server mode configuration', () => {
      const store = new ChromaVectorStore({
        dimensions: 1536,
        mode: 'server',
        serverUrl: 'http://chroma.example.com:8000',
      });
      expect(store).toBeDefined();
    });

    it('should accept embedded mode with persist path', () => {
      const store = new ChromaVectorStore({
        dimensions: 1536,
        mode: 'embedded',
        persistPath: '/tmp/chroma_test',
      });
      expect(store).toBeDefined();
    });
  });

  describe('insert', () => {
    it('should insert chunks with correct format', async () => {
      mockAdd.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const chunks = [
        createChunk('chunk-1', [0.1, 0.2, 0.3], { page: 1 }),
        createChunk('chunk-2', [0.4, 0.5, 0.6], { page: 2 }),
      ];

      const ids = await store.insert(chunks);

      expect(ids).toEqual(['chunk-1', 'chunk-2']);
      expect(mockGetOrCreateCollection).toHaveBeenCalled();
      expect(mockAdd).toHaveBeenCalledWith({
        ids: ['chunk-1', 'chunk-2'],
        embeddings: [
          [0.1, 0.2, 0.3],
          [0.4, 0.5, 0.6],
        ],
        documents: ['Content for chunk-1', 'Content for chunk-2'],
        metadatas: [{ page: 1 }, { page: 2 }],
      });
    });

    it('should include documentId in metadata', async () => {
      mockAdd.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const chunk: ChunkWithEmbedding = {
        id: 'chunk-1',
        content: 'Test content',
        embedding: [0.1, 0.2, 0.3],
        metadata: { page: 1 },
        documentId: 'doc-123',
      };

      await store.insert([chunk]);

      expect(mockAdd).toHaveBeenCalledWith({
        ids: ['chunk-1'],
        embeddings: [[0.1, 0.2, 0.3]],
        documents: ['Test content'],
        metadatas: [{ page: 1, documentId: 'doc-123' }],
      });
    });

    it('should generate IDs for chunks without them', async () => {
      mockAdd.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

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

    it('should throw VectorStoreError on failure', async () => {
      mockAdd.mockRejectedValue(new Error('Chroma error'));

      const store = new ChromaVectorStore({ dimensions: 3 });

      await expect(
        store.insert([createChunk('chunk-1', [0.1, 0.2, 0.3])])
      ).rejects.toThrow(VectorStoreError);
    });
  });

  describe('upsert', () => {
    it('should insert new chunks and update existing ones', async () => {
      // First chunk exists, second doesn't
      mockGet.mockResolvedValue({ ids: ['chunk-1'] });
      mockAdd.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const chunks = [
        createChunk('chunk-1', [0.1, 0.2, 0.3]), // Exists
        createChunk('chunk-2', [0.4, 0.5, 0.6]), // New
      ];

      const ids = await store.upsert(chunks);

      expect(ids).toEqual(['chunk-1', 'chunk-2']);

      // chunk-1 should be updated
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ids: ['chunk-1'],
        })
      );

      // chunk-2 should be inserted
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          ids: ['chunk-2'],
        })
      );
    });

    it('should handle all new chunks', async () => {
      mockGet.mockResolvedValue({ ids: [] }); // None exist
      mockAdd.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const chunks = [
        createChunk('chunk-1', [0.1, 0.2, 0.3]),
        createChunk('chunk-2', [0.4, 0.5, 0.6]),
      ];

      await store.upsert(chunks);

      expect(mockAdd).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should handle all existing chunks', async () => {
      mockGet.mockResolvedValue({ ids: ['chunk-1', 'chunk-2'] });
      mockUpdate.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const chunks = [
        createChunk('chunk-1', [0.1, 0.2, 0.3]),
        createChunk('chunk-2', [0.4, 0.5, 0.6]),
      ];

      await store.upsert(chunks);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search and convert distances to scores', async () => {
      mockQuery.mockResolvedValue({
        ids: [['chunk-1', 'chunk-2']],
        distances: [[0.1, 0.3]],
        documents: [['Content 1', 'Content 2']],
        metadatas: [[{ page: 1 }, { page: 2 }]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      const results = await store.search([0.1, 0.2, 0.3], { topK: 5 });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('chunk-1');
      expect(results[0].score).toBeCloseTo(0.9); // 1 - 0.1 for cosine
      expect(results[1].id).toBe('chunk-2');
      expect(results[1].score).toBeCloseTo(0.7); // 1 - 0.3 for cosine
    });

    it('should apply minScore filter', async () => {
      mockQuery.mockResolvedValue({
        ids: [['high', 'low']],
        distances: [[0.1, 0.9]], // scores: 0.9, 0.1
        documents: [['', '']],
        metadatas: [[{}, {}]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      const results = await store.search([0.1, 0.2, 0.3], {
        topK: 10,
        minScore: 0.5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('high');
    });

    it('should include embeddings when requested', async () => {
      mockQuery.mockResolvedValue({
        ids: [['chunk-1']],
        distances: [[0.1]],
        documents: [['Content']],
        metadatas: [[{}]],
        embeddings: [[[0.1, 0.2, 0.3]]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      const results = await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        includeVectors: true,
      });

      expect(results[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('should extract documentId from metadata', async () => {
      mockQuery.mockResolvedValue({
        ids: [['chunk-1']],
        distances: [[0.1]],
        documents: [['Content']],
        metadatas: [[{ documentId: 'doc-123', page: 1 }]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      const results = await store.search([0.1, 0.2, 0.3], { topK: 5 });

      expect(results[0].chunk.documentId).toBe('doc-123');
    });

    it('should handle euclidean distance metric', async () => {
      mockQuery.mockResolvedValue({
        ids: [['chunk-1']],
        distances: [[4]], // squared L2 = 4, sqrt = 2, score = 1/(1+2) = 0.333
        documents: [['Content']],
        metadatas: [[{}]],
      });

      const store = new ChromaVectorStore({
        dimensions: 3,
        distanceMetric: 'euclidean',
      });

      const results = await store.search([0.1, 0.2, 0.3], { topK: 5 });

      expect(results[0].score).toBeCloseTo(1 / 3, 2); // 1/(1+sqrt(4))
    });
  });

  describe('metadata filtering', () => {
    it('should translate equality filter', async () => {
      mockQuery.mockResolvedValue({
        ids: [[]],
        distances: [[]],
        documents: [[]],
        metadatas: [[]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { documentId: 'doc-1' },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId: { $eq: 'doc-1' } },
        })
      );
    });

    it('should translate $in filter', async () => {
      mockQuery.mockResolvedValue({
        ids: [[]],
        distances: [[]],
        documents: [[]],
        metadatas: [[]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { category: { $in: ['tech', 'science'] } },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: { $in: ['tech', 'science'] } },
        })
      );
    });

    it('should translate $gt filter', async () => {
      mockQuery.mockResolvedValue({
        ids: [[]],
        distances: [[]],
        documents: [[]],
        metadatas: [[]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: { page: { $gt: 5 } },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { page: { $gt: 5 } },
        })
      );
    });

    it('should combine multiple filters with $and', async () => {
      mockQuery.mockResolvedValue({
        ids: [[]],
        distances: [[]],
        documents: [[]],
        metadatas: [[]],
      });

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.search([0.1, 0.2, 0.3], {
        topK: 5,
        filter: {
          documentId: 'doc-1',
          page: { $gte: 5 },
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            $and: [
              { documentId: { $eq: 'doc-1' } },
              { page: { $gte: 5 } },
            ],
          },
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete chunks by ID', async () => {
      mockDelete.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.delete(['chunk-1', 'chunk-2']);

      expect(mockDelete).toHaveBeenCalledWith({
        ids: ['chunk-1', 'chunk-2'],
      });
    });

    it('should throw VectorStoreError on failure', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const store = new ChromaVectorStore({ dimensions: 3 });

      await expect(store.delete(['chunk-1'])).rejects.toThrow(VectorStoreError);
    });
  });

  describe('count', () => {
    it('should return count from collection', async () => {
      mockCount.mockResolvedValue(42);

      const store = new ChromaVectorStore({ dimensions: 3 });

      const count = await store.count();

      expect(count).toBe(42);
    });
  });

  describe('clear', () => {
    it('should delete and clear collection reference', async () => {
      mockDeleteCollection.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({
        dimensions: 3,
        collectionName: 'test_collection',
      });

      // First call to establish collection
      mockCount.mockResolvedValue(5);
      await store.count();

      // Clear should delete collection
      await store.clear();

      expect(mockDeleteCollection).toHaveBeenCalledWith({
        name: 'test_collection',
      });
    });

    it('should handle non-existent collection gracefully', async () => {
      mockDeleteCollection.mockRejectedValue(new Error('Collection not found'));

      const store = new ChromaVectorStore({ dimensions: 3 });

      // Should not throw
      await expect(store.clear()).resolves.not.toThrow();
    });
  });

  describe('lazy initialization', () => {
    it('should not create client until first operation', async () => {
      new ChromaVectorStore({ dimensions: 3 });

      // Client should not be created yet
      expect(MockChromaClient).not.toHaveBeenCalled();
    });

    it('should create client on first operation', async () => {
      mockCount.mockResolvedValue(0);

      const store = new ChromaVectorStore({ dimensions: 3 });
      await store.count();

      expect(MockChromaClient).toHaveBeenCalledTimes(1);
    });

    it('should reuse client across operations', async () => {
      mockCount.mockResolvedValue(0);
      mockAdd.mockResolvedValue(undefined);

      const store = new ChromaVectorStore({ dimensions: 3 });

      await store.count();
      await store.insert([createChunk('c1', [0.1, 0.2, 0.3])]);

      expect(MockChromaClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should wrap collection creation errors in VectorStoreError', async () => {
      mockGetOrCreateCollection.mockRejectedValue(
        new Error('Collection creation failed')
      );

      const store = new ChromaVectorStore({ dimensions: 3 });

      await expect(store.count()).rejects.toThrow(VectorStoreError);
      await expect(store.count()).rejects.toThrow('Failed to create/get collection');
    });

    it('should wrap search errors in VectorStoreError', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      const store = new ChromaVectorStore({ dimensions: 3 });

      await expect(
        store.search([0.1, 0.2, 0.3], { topK: 5 })
      ).rejects.toThrow(VectorStoreError);
    });
  });
});
