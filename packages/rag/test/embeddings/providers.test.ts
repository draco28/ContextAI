import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  HuggingFaceEmbeddingProvider,
  OllamaEmbeddingProvider,
  EmbeddingError,
} from '../../src/index.js';

// ============================================================================
// HuggingFaceEmbeddingProvider Tests
// ============================================================================

describe('HuggingFaceEmbeddingProvider', () => {
  describe('configuration', () => {
    it('should have correct default values', () => {
      const provider = new HuggingFaceEmbeddingProvider();

      expect(provider.name).toBe('HuggingFaceEmbeddingProvider');
      expect(provider.dimensions).toBe(1024);
      expect(provider.maxBatchSize).toBe(32);
    });

    it('should accept custom configuration', () => {
      const provider = new HuggingFaceEmbeddingProvider({
        model: 'custom-model',
        dimensions: 768,
        batchSize: 16,
      });

      expect(provider.dimensions).toBe(768);
      expect(provider.maxBatchSize).toBe(16);
    });
  });

  describe('isAvailable', () => {
    it('should return false when @xenova/transformers is not installed', async () => {
      const provider = new HuggingFaceEmbeddingProvider();

      // The package is not installed in test environment
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  // Note: Full embedding tests would require mocking @xenova/transformers
  // which is complex due to dynamic imports. These tests verify the
  // provider's configuration and error handling logic.
});

// ============================================================================
// OllamaEmbeddingProvider Tests
// ============================================================================

describe('OllamaEmbeddingProvider', () => {
  let provider: OllamaEmbeddingProvider;

  beforeEach(() => {
    provider = new OllamaEmbeddingProvider();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration', () => {
    it('should have correct default values', () => {
      expect(provider.name).toBe('OllamaEmbeddingProvider');
      expect(provider.dimensions).toBe(768);
      expect(provider.maxBatchSize).toBe(32);
    });

    it('should accept custom configuration', () => {
      const customProvider = new OllamaEmbeddingProvider({
        model: 'mxbai-embed-large',
        dimensions: 1024,
        batchSize: 64,
        baseUrl: 'http://custom:11434',
        timeout: 60000,
      });

      expect(customProvider.dimensions).toBe(1024);
      expect(customProvider.maxBatchSize).toBe(64);
    });
  });

  describe('isAvailable', () => {
    it('should return true when server responds with model', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'nomic-embed-text:latest' }],
            }),
        })
      );

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return true for model without tag suffix', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'nomic-embed-text' }],
            }),
        })
      );

      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when model not found', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'other-model' }],
            }),
        })
      );

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should return false when server is down', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Connection refused'))
      );

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should return false on non-200 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        })
      );

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('embed', () => {
    it('should generate embedding successfully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ embedding: mockEmbedding }),
        })
      );

      const result = await provider.embed('Hello world');

      expect(result.embedding.length).toBeGreaterThan(0);
      expect(result.tokenCount).toBeGreaterThan(0);
      expect(result.model).toBe('nomic-embed-text');
    });

    it('should send correct request body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: [0.1, 0.2, 0.3] }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await provider.embed('Test text');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:11434/api/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: 'Test text',
          }),
        })
      );
    });

    it('should throw EmbeddingError on API error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal server error'),
        })
      );

      await expect(provider.embed('test')).rejects.toThrow(EmbeddingError);
    });

    it('should throw EmbeddingError when embedding missing in response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}), // No embedding field
        })
      );

      await expect(provider.embed('test')).rejects.toThrow(EmbeddingError);
      await expect(provider.embed('test')).rejects.toThrow(
        'missing embedding array'
      );
    });

    it('should throw EmbeddingError on network failure', async () => {
      const networkError = new TypeError('fetch failed');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

      await expect(provider.embed('test')).rejects.toThrow(EmbeddingError);
      await expect(provider.embed('test')).rejects.toThrow('Cannot connect');
    });

    it('should throw for empty text', async () => {
      await expect(provider.embed('')).rejects.toThrow(EmbeddingError);
      await expect(provider.embed('   ')).rejects.toThrow(EmbeddingError);
    });

    it('should use custom baseUrl', async () => {
      const customProvider = new OllamaEmbeddingProvider({
        baseUrl: 'http://custom-host:8080',
      });

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: [0.1] }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await customProvider.embed('test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://custom-host:8080/api/embeddings',
        expect.anything()
      );
    });
  });

  describe('embedBatch', () => {
    it('should embed multiple texts', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          // Use vectors that remain distinct after L2 normalization
          // [1,0,0], [0,1,0], [0,0,1] are already unit vectors
          const embeddings = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ];
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ embedding: embeddings[callCount - 1] }),
          });
        })
      );

      const results = await provider.embedBatch(['a', 'b', 'c']);

      expect(results).toHaveLength(3);
      expect(callCount).toBe(3); // Verify all texts were processed
      // Each result should have a valid embedding
      results.forEach((result) => {
        expect(result.embedding).toHaveLength(3);
      });
    });

    it('should return empty array for empty input', async () => {
      const results = await provider.embedBatch([]);
      expect(results).toEqual([]);
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Provider Error Handling', () => {
  describe('EmbeddingError properties', () => {
    it('should include provider name and model', async () => {
      const provider = new OllamaEmbeddingProvider();

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      try {
        await provider.embed('test');
      } catch (error) {
        expect(error).toBeInstanceOf(EmbeddingError);
        const embeddingError = error as InstanceType<typeof EmbeddingError>;
        expect(embeddingError.providerName).toBe('OllamaEmbeddingProvider');
        expect(embeddingError.model).toBe('nomic-embed-text');
        expect(embeddingError.code).toBe('INVALID_RESPONSE');
      }
    });
  });
});
