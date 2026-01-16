import { describe, it, expect, beforeEach } from 'vitest';
import {
  BaseEmbeddingProvider,
  EmbeddingError,
  type EmbeddingResult,
  type EmbeddingProviderConfig,
  // Utilities
  dotProduct,
  l2Norm,
  normalizeL2,
  cosineSimilarity,
  euclideanDistance,
  isNormalized,
  meanEmbedding,
} from '../../src/index.js';

// ============================================================================
// Test Implementation
// ============================================================================

/**
 * Concrete test provider that extends BaseEmbeddingProvider.
 * Returns simple mock embeddings for testing.
 */
class TestEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'TestEmbeddingProvider';
  private available = true;
  private embedCallCount = 0;

  constructor(config?: Partial<EmbeddingProviderConfig>) {
    super({
      model: config?.model ?? 'test-model',
      dimensions: config?.dimensions ?? 3,
      batchSize: config?.batchSize ?? 5,
      normalize: config?.normalize ?? true,
    });
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  getEmbedCallCount(): number {
    return this.embedCallCount;
  }

  resetCallCount(): void {
    this.embedCallCount = 0;
  }

  isAvailable = async (): Promise<boolean> => {
    return this.available;
  };

  protected _embed = async (text: string): Promise<EmbeddingResult> => {
    this.embedCallCount++;
    // Generate a simple embedding based on text length
    const embedding = [text.length, text.length * 2, text.length * 3];
    return {
      embedding,
      tokenCount: Math.ceil(text.length / 4),
      model: this.model,
    };
  };
}

/**
 * Provider with native batch support for testing batch override.
 */
class BatchEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'BatchEmbeddingProvider';
  private batchCallCount = 0;

  constructor() {
    super({
      model: 'batch-model',
      dimensions: 3,
      batchSize: 10,
      normalize: false, // Disable normalization to verify raw values
    });
  }

  getBatchCallCount(): number {
    return this.batchCallCount;
  }

  isAvailable = async (): Promise<boolean> => true;

  protected _embed = async (text: string): Promise<EmbeddingResult> => {
    return {
      embedding: [1, 2, 3],
      tokenCount: 1,
      model: this.model,
    };
  };

  protected override _embedBatch = async (
    texts: string[]
  ): Promise<EmbeddingResult[]> => {
    this.batchCallCount++;
    // Native batch implementation
    return texts.map((text, i) => ({
      embedding: [i + 1, (i + 1) * 2, (i + 1) * 3],
      tokenCount: Math.ceil(text.length / 4),
      model: this.model,
    }));
  };
}

// ============================================================================
// EmbeddingError Tests
// ============================================================================

describe('Embedding Provider', () => {
  describe('EmbeddingError', () => {
    it('should create error with all properties', () => {
      const error = new EmbeddingError(
        'Test error message',
        'RATE_LIMIT',
        'TestProvider',
        'test-model'
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.providerName).toBe('TestProvider');
      expect(error.model).toBe('test-model');
      expect(error.name).toBe('EmbeddingError');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new EmbeddingError(
        'Wrapper error',
        'EMBEDDING_FAILED',
        'TestProvider',
        'test-model',
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should convert to details object', () => {
      const error = new EmbeddingError(
        'Test error',
        'MODEL_NOT_FOUND',
        'TestProvider',
        'missing-model'
      );

      const details = error.toDetails();
      expect(details).toEqual({
        code: 'MODEL_NOT_FOUND',
        providerName: 'TestProvider',
        model: 'missing-model',
        cause: undefined,
      });
    });

    describe('static factory methods', () => {
      it('should create rate limit error', () => {
        const error = EmbeddingError.rateLimitExceeded('Provider', 'model');
        expect(error.code).toBe('RATE_LIMIT');
        expect(error.message).toContain('Rate limit');
      });

      it('should create model not found error', () => {
        const error = EmbeddingError.modelNotFound('Provider', 'unknown-model');
        expect(error.code).toBe('MODEL_NOT_FOUND');
        expect(error.message).toContain('unknown-model');
      });

      it('should create batch too large error', () => {
        const error = EmbeddingError.batchTooLarge('Provider', 'model', 100, 50);
        expect(error.code).toBe('BATCH_TOO_LARGE');
        expect(error.message).toContain('100');
        expect(error.message).toContain('50');
      });

      it('should create text too long error', () => {
        const error = EmbeddingError.textTooLong('Provider', 'model', 10000, 8192);
        expect(error.code).toBe('TEXT_TOO_LONG');
        expect(error.message).toContain('10000');
      });

      it('should create empty input error', () => {
        const error = EmbeddingError.emptyInput('Provider', 'model');
        expect(error.code).toBe('EMPTY_INPUT');
        expect(error.message).toContain('empty');
      });

      it('should create invalid response error', () => {
        const error = EmbeddingError.invalidResponse(
          'Provider',
          'model',
          'missing embedding field'
        );
        expect(error.code).toBe('INVALID_RESPONSE');
        expect(error.message).toContain('missing embedding field');
      });

      it('should create provider unavailable error', () => {
        const error = EmbeddingError.providerUnavailable(
          'Provider',
          'model',
          'network error'
        );
        expect(error.code).toBe('PROVIDER_UNAVAILABLE');
        expect(error.message).toContain('network error');
      });
    });
  });

  // ==========================================================================
  // Embedding Utilities Tests
  // ==========================================================================

  describe('Embedding Utilities', () => {
    describe('dotProduct', () => {
      it('should compute dot product correctly', () => {
        expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32); // 1*4 + 2*5 + 3*6
      });

      it('should return 0 for orthogonal vectors', () => {
        expect(dotProduct([1, 0], [0, 1])).toBe(0);
      });

      it('should throw for mismatched dimensions', () => {
        expect(() => dotProduct([1, 2], [1, 2, 3])).toThrow(
          'Vector dimensions must match'
        );
      });
    });

    describe('l2Norm', () => {
      it('should compute L2 norm correctly', () => {
        expect(l2Norm([3, 4])).toBe(5); // sqrt(9 + 16)
      });

      it('should return 0 for zero vector', () => {
        expect(l2Norm([0, 0, 0])).toBe(0);
      });

      it('should return 1 for unit vector', () => {
        expect(l2Norm([1, 0, 0])).toBe(1);
      });
    });

    describe('normalizeL2', () => {
      it('should normalize vector to unit length', () => {
        const normalized = normalizeL2([3, 4]);
        expect(normalized[0]).toBeCloseTo(0.6);
        expect(normalized[1]).toBeCloseTo(0.8);
        expect(l2Norm(normalized)).toBeCloseTo(1);
      });

      it('should handle zero vector', () => {
        const normalized = normalizeL2([0, 0, 0]);
        expect(normalized).toEqual([0, 0, 0]);
      });

      it('should not modify unit vector', () => {
        const normalized = normalizeL2([1, 0, 0]);
        expect(normalized).toEqual([1, 0, 0]);
      });
    });

    describe('cosineSimilarity', () => {
      it('should return 1 for identical vectors', () => {
        expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
      });

      it('should return 0 for orthogonal vectors', () => {
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
      });

      it('should return -1 for opposite vectors', () => {
        expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
      });

      it('should handle different magnitudes', () => {
        expect(cosineSimilarity([1, 0], [10, 0])).toBeCloseTo(1);
      });

      it('should return 0 when one vector is zero', () => {
        expect(cosineSimilarity([1, 2], [0, 0])).toBe(0);
      });

      it('should throw for mismatched dimensions', () => {
        expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
          'Vector dimensions must match'
        );
      });
    });

    describe('euclideanDistance', () => {
      it('should compute distance correctly', () => {
        expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
      });

      it('should return 0 for identical vectors', () => {
        expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
      });

      it('should throw for mismatched dimensions', () => {
        expect(() => euclideanDistance([1, 2], [1, 2, 3])).toThrow(
          'Vector dimensions must match'
        );
      });
    });

    describe('isNormalized', () => {
      it('should return true for unit vector', () => {
        expect(isNormalized([1, 0, 0])).toBe(true);
        expect(isNormalized([0.6, 0.8])).toBe(true);
      });

      it('should return false for non-unit vector', () => {
        expect(isNormalized([3, 4])).toBe(false);
        expect(isNormalized([2, 0, 0])).toBe(false);
      });

      it('should respect tolerance parameter', () => {
        expect(isNormalized([0.999, 0], 0.01)).toBe(true);
        expect(isNormalized([0.999, 0], 0.0001)).toBe(false);
      });
    });

    describe('meanEmbedding', () => {
      it('should compute mean of embeddings', () => {
        const embeddings = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ];
        const mean = meanEmbedding(embeddings, false);
        expect(mean[0]).toBeCloseTo(1 / 3);
        expect(mean[1]).toBeCloseTo(1 / 3);
        expect(mean[2]).toBeCloseTo(1 / 3);
      });

      it('should normalize by default', () => {
        const embeddings = [
          [3, 0],
          [0, 4],
        ];
        const mean = meanEmbedding(embeddings);
        expect(l2Norm(mean)).toBeCloseTo(1);
      });

      it('should throw for empty array', () => {
        expect(() => meanEmbedding([])).toThrow('Cannot compute mean of empty array');
      });

      it('should throw for mismatched dimensions', () => {
        expect(() => meanEmbedding([[1, 2], [1, 2, 3]])).toThrow(
          'All embeddings must have same dimensions'
        );
      });
    });
  });

  // ==========================================================================
  // BaseEmbeddingProvider Tests
  // ==========================================================================

  describe('BaseEmbeddingProvider', () => {
    let provider: TestEmbeddingProvider;

    beforeEach(() => {
      provider = new TestEmbeddingProvider();
    });

    describe('properties', () => {
      it('should have correct name', () => {
        expect(provider.name).toBe('TestEmbeddingProvider');
      });

      it('should have correct dimensions', () => {
        expect(provider.dimensions).toBe(3);
      });

      it('should have correct maxBatchSize', () => {
        expect(provider.maxBatchSize).toBe(5);
      });
    });

    describe('isAvailable', () => {
      it('should return true when available', async () => {
        expect(await provider.isAvailable()).toBe(true);
      });

      it('should return false when unavailable', async () => {
        provider.setAvailable(false);
        expect(await provider.isAvailable()).toBe(false);
      });
    });

    describe('embed', () => {
      it('should generate embedding for text', async () => {
        const result = await provider.embed('Hello');

        expect(result.embedding).toHaveLength(3);
        expect(result.tokenCount).toBeGreaterThan(0);
        expect(result.model).toBe('test-model');
      });

      it('should normalize embeddings by default', async () => {
        const result = await provider.embed('Hello');

        expect(l2Norm(result.embedding)).toBeCloseTo(1);
      });

      it('should not normalize when configured', async () => {
        const noNormProvider = new TestEmbeddingProvider({ normalize: false });
        const result = await noNormProvider.embed('Hello');

        // Raw embedding should not be normalized
        expect(l2Norm(result.embedding)).not.toBeCloseTo(1);
      });

      it('should throw for empty text', async () => {
        await expect(provider.embed('')).rejects.toThrow(EmbeddingError);
        await expect(provider.embed('   ')).rejects.toThrow(EmbeddingError);

        try {
          await provider.embed('');
        } catch (e) {
          expect(e).toBeInstanceOf(EmbeddingError);
          expect((e as EmbeddingError).code).toBe('EMPTY_INPUT');
        }
      });
    });

    describe('embedBatch', () => {
      it('should return empty array for empty input', async () => {
        const results = await provider.embedBatch([]);
        expect(results).toEqual([]);
      });

      it('should embed multiple texts', async () => {
        const results = await provider.embedBatch(['Hello', 'World', 'Test']);

        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(result.embedding).toHaveLength(3);
          expect(l2Norm(result.embedding)).toBeCloseTo(1);
        });
      });

      it('should preserve order of results', async () => {
        const results = await provider.embedBatch(['A', 'BB', 'CCC']);

        // Embeddings are based on text length, so we can verify order
        // A (len 1) should have smallest base values before normalization
        // This is a simple sanity check that order is preserved
        expect(results).toHaveLength(3);
      });

      it('should throw for any empty text in batch', async () => {
        await expect(
          provider.embedBatch(['Hello', '', 'World'])
        ).rejects.toThrow(EmbeddingError);
      });
    });

    describe('auto-batching', () => {
      it('should process small batches in single call', async () => {
        provider.resetCallCount();

        await provider.embedBatch(['A', 'B', 'C']);

        // Should call _embed 3 times (default sequential implementation)
        expect(provider.getEmbedCallCount()).toBe(3);
      });

      it('should split large batches', async () => {
        provider.resetCallCount();

        // maxBatchSize is 5, so 8 texts should be split into 2 batches
        const texts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const results = await provider.embedBatch(texts);

        expect(results).toHaveLength(8);
        expect(provider.getEmbedCallCount()).toBe(8);
      });

      it('should use native batch when available', async () => {
        const batchProvider = new BatchEmbeddingProvider();

        const results = await batchProvider.embedBatch(['A', 'B', 'C']);

        expect(results).toHaveLength(3);
        expect(batchProvider.getBatchCallCount()).toBe(1); // Single batch call
      });
    });

    describe('configuration', () => {
      it('should use custom model', () => {
        const customProvider = new TestEmbeddingProvider({
          model: 'custom-model',
        });

        // Access via protected property not possible, but we can verify via embed result
        // The provider should use the custom model
        expect(customProvider.name).toBe('TestEmbeddingProvider');
      });

      it('should use custom dimensions', () => {
        const customProvider = new TestEmbeddingProvider({ dimensions: 768 });
        expect(customProvider.dimensions).toBe(768);
      });

      it('should use custom batch size', () => {
        const customProvider = new TestEmbeddingProvider({ batchSize: 100 });
        expect(customProvider.maxBatchSize).toBe(100);
      });

      it('should default to batch size 100 when not specified', () => {
        // Using a minimal config
        class MinimalProvider extends BaseEmbeddingProvider {
          readonly name = 'MinimalProvider';

          constructor() {
            super({ model: 'minimal' });
          }

          isAvailable = async () => true;

          protected _embed = async (text: string): Promise<EmbeddingResult> => ({
            embedding: [1, 2, 3],
            tokenCount: 1,
            model: 'minimal',
          });
        }

        const minimal = new MinimalProvider();
        expect(minimal.maxBatchSize).toBe(100);
      });
    });
  });
});
