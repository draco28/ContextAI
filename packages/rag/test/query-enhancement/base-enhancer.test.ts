/**
 * Base Query Enhancer Tests
 *
 * Tests for the abstract base class functionality.
 */

import { describe, it, expect } from 'vitest';
import type {
  EnhanceOptions,
  EnhancementResult,
  EnhancementStrategy,
} from '../../src/query-enhancement/types.js';
import { BaseQueryEnhancer } from '../../src/query-enhancement/base-enhancer.js';
import { QueryEnhancementError } from '../../src/query-enhancement/errors.js';

/**
 * Concrete implementation of BaseQueryEnhancer for testing.
 */
class TestEnhancer extends BaseQueryEnhancer {
  readonly name = 'TestEnhancer';
  readonly strategy: EnhancementStrategy = 'rewrite';

  public enhanceResult: EnhancementResult | null = null;
  public enhanceError: Error | null = null;
  public enhanceCallCount = 0;
  public lastQuery = '';
  public lastOptions: EnhanceOptions | undefined;

  protected _enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    this.enhanceCallCount++;
    this.lastQuery = query;
    this.lastOptions = options;

    if (this.enhanceError) {
      throw this.enhanceError;
    }

    return (
      this.enhanceResult ?? {
        original: query,
        enhanced: [`enhanced: ${query}`],
        strategy: this.strategy,
        metadata: {},
      }
    );
  };
}

describe('BaseQueryEnhancer', () => {
  describe('input validation', () => {
    it('should reject null query', async () => {
      const enhancer = new TestEnhancer();

      await expect(enhancer.enhance(null as any)).rejects.toThrow(
        QueryEnhancementError
      );
      await expect(enhancer.enhance(null as any)).rejects.toThrow(
        'cannot be null'
      );
    });

    it('should reject undefined query', async () => {
      const enhancer = new TestEnhancer();

      await expect(enhancer.enhance(undefined as any)).rejects.toThrow(
        QueryEnhancementError
      );
    });

    it('should reject non-string query', async () => {
      const enhancer = new TestEnhancer();

      await expect(enhancer.enhance(123 as any)).rejects.toThrow(
        QueryEnhancementError
      );
      await expect(enhancer.enhance(123 as any)).rejects.toThrow(
        'must be a string'
      );
    });

    it('should reject empty query', async () => {
      const enhancer = new TestEnhancer();

      await expect(enhancer.enhance('')).rejects.toThrow(QueryEnhancementError);
      await expect(enhancer.enhance('   ')).rejects.toThrow(
        'cannot be empty'
      );
    });
  });

  describe('minimum length check', () => {
    it('should skip enhancement for short queries', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('ab');

      expect(result.strategy).toBe('passthrough');
      expect(result.enhanced).toEqual([]);
      expect(result.metadata.skipped).toBe(true);
      expect(result.metadata.skipReason).toContain('too short');
      expect(enhancer.enhanceCallCount).toBe(0);
    });

    it('should use default minimum length of 3', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('abc');

      expect(result.strategy).toBe('rewrite');
      expect(enhancer.enhanceCallCount).toBe(1);
    });

    it('should respect custom minimum length option', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('abcde', { minQueryLength: 10 });

      expect(result.strategy).toBe('passthrough');
      expect(result.metadata.skipped).toBe(true);
    });

    it('should pass long enough queries to _enhance', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('long enough query', {
        minQueryLength: 5,
      });

      expect(result.strategy).toBe('rewrite');
      expect(enhancer.enhanceCallCount).toBe(1);
    });
  });

  describe('timing measurement', () => {
    it('should add llmLatencyMs to metadata', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceResult = {
        original: 'test',
        enhanced: ['test enhanced'],
        strategy: 'rewrite',
        metadata: {}, // No llmLatencyMs provided by subclass
      };

      const result = await enhancer.enhance('test query');

      expect(result.metadata.llmLatencyMs).toBeDefined();
      expect(typeof result.metadata.llmLatencyMs).toBe('number');
    });

    it('should preserve llmLatencyMs if already set by subclass', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceResult = {
        original: 'test',
        enhanced: ['test enhanced'],
        strategy: 'rewrite',
        metadata: { llmLatencyMs: 999 },
      };

      const result = await enhancer.enhance('test query');

      expect(result.metadata.llmLatencyMs).toBe(999);
    });
  });

  describe('includeOriginal option', () => {
    it('should prepend original query when includeOriginal is true', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('my query', {
        includeOriginal: true,
      });

      expect(result.enhanced[0]).toBe('my query');
      expect(result.enhanced[1]).toBe('enhanced: my query');
    });

    it('should not duplicate original if already in enhanced', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceResult = {
        original: 'test',
        enhanced: ['test', 'enhanced test'],
        strategy: 'rewrite',
        metadata: {},
      };

      const result = await enhancer.enhance('test', { includeOriginal: true });

      // Should not add 'test' again
      expect(result.enhanced.filter((e) => e === 'test').length).toBe(1);
    });

    it('should not include original by default', async () => {
      const enhancer = new TestEnhancer();

      const result = await enhancer.enhance('my query');

      expect(result.enhanced[0]).toBe('enhanced: my query');
      expect(result.enhanced).not.toContain('my query');
    });
  });

  describe('error handling', () => {
    it('should re-throw QueryEnhancementError as-is', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceError = QueryEnhancementError.llmError(
        'TestEnhancer',
        'API failed'
      );

      await expect(enhancer.enhance('test')).rejects.toThrow('API failed');
    });

    it('should wrap other errors in QueryEnhancementError', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceError = new Error('Generic error');

      await expect(enhancer.enhance('test')).rejects.toThrow(
        QueryEnhancementError
      );
      await expect(enhancer.enhance('test')).rejects.toThrow('Generic error');
    });

    it('should handle non-Error throws', async () => {
      const enhancer = new TestEnhancer();
      enhancer.enhanceError = 'string error' as any;

      await expect(enhancer.enhance('test')).rejects.toThrow(
        QueryEnhancementError
      );
    });
  });

  describe('passthrough flow', () => {
    it('should pass query and options to _enhance', async () => {
      const enhancer = new TestEnhancer();
      const options: EnhanceOptions = {
        maxVariants: 5,
        temperature: 0.8,
      };

      await enhancer.enhance('test query', options);

      expect(enhancer.lastQuery).toBe('test query');
      expect(enhancer.lastOptions).toEqual(options);
    });
  });
});
