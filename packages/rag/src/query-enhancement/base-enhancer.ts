/**
 * Base Query Enhancer
 *
 * Abstract base class for all query enhancers.
 * Implements the Template Method pattern:
 * - Public `enhance()` handles validation and common logic
 * - Protected `_enhance()` is implemented by subclasses
 *
 * This pattern ensures consistent behavior across all enhancers:
 * - Input validation (empty queries, min length)
 * - Timing measurement for metadata
 * - Error handling and wrapping
 */

import type {
  QueryEnhancer,
  EnhanceOptions,
  EnhancementResult,
  EnhancementStrategy,
  EnhancementMetadata,
} from './types.js';
import { QueryEnhancementError } from './errors.js';

/**
 * Default minimum query length for enhancement.
 * Queries shorter than this are passed through unchanged.
 */
const DEFAULT_MIN_QUERY_LENGTH = 3;

/**
 * Abstract base class for query enhancers.
 *
 * Subclasses must implement:
 * - `_enhance()`: Core enhancement logic
 * - `name`: Human-readable name
 * - `strategy`: Enhancement strategy type
 *
 * @example
 * ```typescript
 * class MyEnhancer extends BaseQueryEnhancer {
 *   readonly name = 'MyEnhancer';
 *   readonly strategy: EnhancementStrategy = 'rewrite';
 *
 *   protected _enhance = async (
 *     query: string,
 *     options?: EnhanceOptions
 *   ): Promise<EnhancementResult> => {
 *     // Implementation here
 *   };
 * }
 * ```
 */
export abstract class BaseQueryEnhancer implements QueryEnhancer {
  /** Human-readable name for this enhancer */
  abstract readonly name: string;
  /** Strategy type this enhancer implements */
  abstract readonly strategy: EnhancementStrategy;

  /**
   * Enhance a query for better retrieval.
   *
   * This is the public API. It:
   * 1. Validates input
   * 2. Checks minimum length
   * 3. Calls subclass implementation
   * 4. Measures timing
   * 5. Adds metadata
   *
   * @param query - The user's original query
   * @param options - Enhancement options
   * @returns Enhanced queries with metadata
   */
  enhance = async (
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult> => {
    const startTime = Date.now();

    // Validate input
    this.validateQuery(query);

    // Check minimum length
    const minLength = options?.minQueryLength ?? DEFAULT_MIN_QUERY_LENGTH;
    if (query.length < minLength) {
      return this.createPassthroughResult(query, {
        skipped: true,
        skipReason: `Query too short (${query.length} < ${minLength} chars)`,
      });
    }

    try {
      // Call subclass implementation
      const result = await this._enhance(query, options);

      // Add timing if not already present
      if (result.metadata.llmLatencyMs === undefined) {
        result.metadata.llmLatencyMs = Date.now() - startTime;
      }

      // Optionally include original in enhanced array
      if (options?.includeOriginal && !result.enhanced.includes(query)) {
        result.enhanced = [query, ...result.enhanced];
      }

      return result;
    } catch (error) {
      // Re-throw QueryEnhancementErrors as-is
      if (error instanceof QueryEnhancementError) {
        throw error;
      }

      // Wrap other errors
      throw QueryEnhancementError.llmError(
        this.name,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Core enhancement logic to be implemented by subclasses.
   *
   * @param query - The user's query (already validated)
   * @param options - Enhancement options
   * @returns Enhanced queries with metadata
   */
  protected abstract _enhance(
    query: string,
    options?: EnhanceOptions
  ): Promise<EnhancementResult>;

  /**
   * Validate a query string.
   * Throws QueryEnhancementError if invalid.
   */
  protected validateQuery(query: string): void {
    if (query === null || query === undefined) {
      throw QueryEnhancementError.invalidInput(
        this.name,
        'Query cannot be null or undefined'
      );
    }

    if (typeof query !== 'string') {
      throw QueryEnhancementError.invalidInput(
        this.name,
        `Query must be a string, got ${typeof query}`
      );
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      throw QueryEnhancementError.invalidInput(
        this.name,
        'Query cannot be empty'
      );
    }
  }

  /**
   * Create a passthrough result when enhancement is skipped.
   * Returns original query unchanged with skip metadata.
   */
  protected createPassthroughResult(
    query: string,
    metadata: Partial<EnhancementMetadata> = {}
  ): EnhancementResult {
    return {
      original: query,
      enhanced: [],
      strategy: 'passthrough',
      metadata: {
        skipped: true,
        ...metadata,
      },
    };
  }

  /**
   * Create a successful result with enhanced queries.
   */
  protected createResult(
    original: string,
    enhanced: string[],
    metadata: Partial<EnhancementMetadata> = {}
  ): EnhancementResult {
    return {
      original,
      enhanced,
      strategy: this.strategy,
      metadata: {
        skipped: false,
        ...metadata,
      },
    };
  }
}
