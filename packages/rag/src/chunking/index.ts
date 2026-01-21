/**
 * Text Chunking Module
 *
 * Provides strategies for splitting documents into chunks for RAG.
 */

// Types
export type {
  ChunkingOptions,
  ChunkingStrategy,
  ChunkerErrorCode,
  ChunkerErrorDetails,
  SizeUnit,
  // Re-exported for convenience
  Chunk,
  ChunkMetadata,
  Document,
  DocumentMetadata,
} from './types.js';

export { DEFAULT_CHUNKING_OPTIONS } from './types.js';

// Errors
export { ChunkerError } from './errors.js';

// Token utilities
export {
  CHARS_PER_TOKEN,
  estimateTokens,
  countCharacters,
  measureSize,
  convertSize,
  findSizeIndex,
  splitBySize,
} from './token-counter.js';

// Base class
export { BaseChunker } from './base-chunker.js';

// Chunker implementations
export { FixedSizeChunker } from './fixed-chunker.js';
export { RecursiveChunker } from './recursive-chunker.js';
export { SentenceChunker } from './sentence-chunker.js';
export { SemanticChunker, type SemanticChunkerConfig } from './semantic-chunker.js';

// Registry
export { ChunkerRegistry, defaultChunkerRegistry } from './registry.js';
