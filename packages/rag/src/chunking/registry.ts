/**
 * Chunker Registry
 *
 * Central management of chunking strategies with name-based lookup.
 */

import type { ChunkingStrategy } from './types.js';
import { FixedSizeChunker } from './fixed-chunker.js';
import { RecursiveChunker } from './recursive-chunker.js';
import { SentenceChunker } from './sentence-chunker.js';

/**
 * Registry for managing chunking strategies.
 *
 * Provides centralized registration and lookup of chunkers by name.
 * A default instance is exported with built-in strategies pre-registered.
 *
 * @example
 * ```typescript
 * // Use default registry with built-in chunkers
 * import { defaultChunkerRegistry } from '@contextai/rag';
 *
 * const chunker = defaultChunkerRegistry.get('RecursiveChunker');
 * const chunks = await chunker.chunk(document);
 *
 * // Or create custom registry
 * const registry = new ChunkerRegistry();
 * registry.register(new MyCustomChunker());
 * ```
 */
export class ChunkerRegistry {
  /** Registered chunkers by name */
  private readonly chunkers = new Map<string, ChunkingStrategy>();

  /**
   * Register a chunking strategy.
   *
   * @param chunker - The chunker to register
   * @throws Error if a chunker with the same name is already registered
   */
  register = (chunker: ChunkingStrategy): void => {
    if (this.chunkers.has(chunker.name)) {
      throw new Error(
        `Chunker "${chunker.name}" is already registered. ` +
          'Use unregister() first to replace it.'
      );
    }
    this.chunkers.set(chunker.name, chunker);
  };

  /**
   * Unregister a chunking strategy by name.
   *
   * @param name - Name of the chunker to remove
   * @returns true if removed, false if not found
   */
  unregister = (name: string): boolean => {
    return this.chunkers.delete(name);
  };

  /**
   * Get a chunker by name.
   *
   * @param name - Name of the chunker to retrieve
   * @returns The chunker, or undefined if not found
   */
  get = (name: string): ChunkingStrategy | undefined => {
    return this.chunkers.get(name);
  };

  /**
   * Get a chunker by name, throwing if not found.
   *
   * @param name - Name of the chunker to retrieve
   * @returns The chunker
   * @throws Error if chunker not found
   */
  getOrThrow = (name: string): ChunkingStrategy => {
    const chunker = this.chunkers.get(name);
    if (!chunker) {
      const available = this.getNames().join(', ');
      throw new Error(
        `Chunker "${name}" not found. Available: ${available || 'none'}`
      );
    }
    return chunker;
  };

  /**
   * Check if a chunker is registered.
   *
   * @param name - Name to check
   * @returns true if registered
   */
  has = (name: string): boolean => {
    return this.chunkers.has(name);
  };

  /**
   * Get all registered chunker names.
   *
   * @returns Array of chunker names
   */
  getNames = (): string[] => {
    return Array.from(this.chunkers.keys());
  };

  /**
   * Get all registered chunkers.
   *
   * @returns Array of chunkers
   */
  getAll = (): ChunkingStrategy[] => {
    return Array.from(this.chunkers.values());
  };

  /**
   * Clear all registered chunkers.
   */
  clear = (): void => {
    this.chunkers.clear();
  };
}

// ============================================================================
// Default Registry
// ============================================================================

/**
 * Default chunker registry with built-in strategies pre-registered.
 *
 * Includes:
 * - FixedSizeChunker
 * - RecursiveChunker
 * - SentenceChunker
 */
export const defaultChunkerRegistry = new ChunkerRegistry();

// Register built-in chunkers
defaultChunkerRegistry.register(new FixedSizeChunker());
defaultChunkerRegistry.register(new RecursiveChunker());
defaultChunkerRegistry.register(new SentenceChunker());
