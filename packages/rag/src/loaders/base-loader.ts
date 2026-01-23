/**
 * Base Document Loader
 *
 * Abstract class providing common functionality for all document loaders.
 */

import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { PathValidator, PathTraversalError } from '@contextaisdk/core';
import type {
  Document,
  DocumentLoader,
  DocumentMetadata,
  LoadOptions,
} from './types.js';
import { LoaderError } from './errors.js';

/** Default maximum file size: 10MB */
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Default encoding for text files */
const DEFAULT_ENCODING: BufferEncoding = 'utf-8';

/**
 * Abstract base class for document loaders.
 *
 * Provides:
 * - Path validation (security)
 * - File reading with size limits
 * - ID generation
 * - Extension-based format detection
 * - Word counting utility
 *
 * Subclasses must implement:
 * - `parseContent()` - Format-specific parsing logic
 *
 * @example
 * ```typescript
 * class MarkdownLoader extends BaseDocumentLoader {
 *   readonly name = 'MarkdownLoader';
 *   readonly supportedFormats = ['.md', '.markdown'];
 *
 *   protected async parseContent(content: string, source: string): Promise<Document[]> {
 *     // Parse markdown and return documents
 *   }
 * }
 * ```
 */
export abstract class BaseDocumentLoader implements DocumentLoader {
  /** Human-readable name of this loader */
  abstract readonly name: string;

  /** File extensions this loader supports */
  abstract readonly supportedFormats: string[];

  /**
   * Check if this loader can handle the given source.
   *
   * For strings, checks if the extension matches supportedFormats.
   * For buffers, returns false by default (override for magic byte detection).
   */
  canLoad = (source: string | Buffer): boolean => {
    if (Buffer.isBuffer(source)) {
      // Subclasses can override to check magic bytes
      return false;
    }

    const ext = extname(source).toLowerCase();
    return this.supportedFormats.includes(ext);
  };

  /**
   * Load and parse a document from the source.
   *
   * Handles path validation, file reading, and delegates parsing to subclass.
   */
  load = async (
    source: string | Buffer,
    options?: LoadOptions
  ): Promise<Document[]> => {
    // If source is already a buffer, parse directly
    if (Buffer.isBuffer(source)) {
      return this.parseContent(source, 'buffer');
    }

    // For file paths, validate and read
    const content = await this.readFileSecurely(source, options);
    return this.parseContent(content, source);
  };

  /**
   * Parse the content into documents.
   *
   * Subclasses must implement this method with format-specific logic.
   *
   * @param content - File content as string or buffer
   * @param source - Original source path (for metadata)
   * @returns Array of parsed documents
   */
  protected abstract parseContent(
    content: string | Buffer,
    source: string
  ): Promise<Document[]>;

  /**
   * Read a file securely with path validation and size limits.
   */
  protected readFileSecurely = async (
    filePath: string,
    options?: LoadOptions
  ): Promise<string | Buffer> => {
    // Validate path if allowed directories are specified
    if (options?.allowedDirectories && options.allowedDirectories.length > 0) {
      const validator = new PathValidator({
        allowedDirectories: options.allowedDirectories,
        followSymlinks: options.followSymlinks ?? false,
      });

      const validation = await validator.validate(filePath);
      if (!validation.valid) {
        throw new PathTraversalError(
          validation.error!,
          filePath,
          validation.blockedReason!
        );
      }
      // Use the normalized path
      filePath = validation.normalizedPath!;
    }

    // Check file size
    const maxSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
    const stats = await stat(filePath).catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        throw new LoaderError(
          `File not found: ${filePath}`,
          'FILE_NOT_FOUND',
          this.name,
          filePath
        );
      }
      if (err.code === 'EACCES') {
        throw new LoaderError(
          `Permission denied: ${filePath}`,
          'PERMISSION_DENIED',
          this.name,
          filePath
        );
      }
      throw new LoaderError(
        `Failed to stat file: ${err.message}`,
        'LOADER_ERROR',
        this.name,
        filePath,
        err
      );
    });

    if (stats.size > maxSize) {
      throw new LoaderError(
        `File too large: ${stats.size} bytes (max: ${maxSize})`,
        'FILE_TOO_LARGE',
        this.name,
        filePath
      );
    }

    // Read file
    const encoding = options?.encoding ?? DEFAULT_ENCODING;
    try {
      return await readFile(filePath, { encoding });
    } catch (err) {
      throw new LoaderError(
        `Failed to read file: ${(err as Error).message}`,
        'LOADER_ERROR',
        this.name,
        filePath,
        err as Error
      );
    }
  };

  /**
   * Generate a unique document ID.
   *
   * Uses SHA-256 hash of source + content for deterministic IDs.
   */
  protected generateId = (source: string, content: string | Buffer): string => {
    const hash = createHash('sha256');
    hash.update(source);
    hash.update(
      typeof content === 'string' ? content : content.toString('utf-8')
    );
    return hash.digest('hex').slice(0, 16);
  };

  /**
   * Count words in text content.
   */
  protected countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  /**
   * Create base metadata from file stats.
   */
  protected createBaseMetadata = async (
    filePath: string,
    content: string
  ): Promise<Partial<DocumentMetadata>> => {
    try {
      const stats = await stat(filePath);
      return {
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        wordCount: this.countWords(content),
      };
    } catch {
      // If stat fails, return minimal metadata
      return {
        wordCount: this.countWords(content),
      };
    }
  };
}
