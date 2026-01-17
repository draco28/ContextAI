/**
 * DOCX Document Loader
 *
 * Loads Microsoft Word documents (.docx) into documents using mammoth.
 * Extracts text content while preserving document structure.
 */

import mammoth from 'mammoth';
import { readFile, stat } from 'node:fs/promises';
import type { Document, DocumentMetadata, LoadOptions } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';
import { LoaderError } from './errors.js';

/**
 * Loader for Microsoft Word documents (.docx).
 *
 * Uses mammoth to extract text content from DOCX files.
 * Only supports modern .docx format (Office Open XML), not legacy .doc files.
 *
 * Supports:
 * - .docx files (Office Open XML)
 *
 * Metadata includes:
 * - mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
 * - wordCount: Number of words in the document
 *
 * @example
 * ```typescript
 * const loader = new DocxLoader();
 *
 * const docs = await loader.load('/path/to/document.docx', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // docs[0].content contains extracted text
 * // docs[0].metadata.wordCount contains word count
 * ```
 */
export class DocxLoader extends BaseDocumentLoader {
  readonly name = 'DocxLoader';
  readonly supportedFormats = ['.docx'];

  /**
   * Override canLoad to support buffer magic byte detection.
   */
  canLoad = (source: string | Buffer): boolean => {
    if (Buffer.isBuffer(source)) {
      // Check for ZIP magic bytes (DOCX is a ZIP archive)
      // PK\x03\x04 or PK\x05\x06 or PK\x07\x08
      return (
        source.length >= 4 &&
        source[0] === 0x50 && // P
        source[1] === 0x4b && // K
        (source[2] === 0x03 || source[2] === 0x05 || source[2] === 0x07)
      );
    }

    // Fall back to extension-based detection
    const ext = source.toLowerCase().split('.').pop();
    return ext === 'docx';
  };

  /**
   * Override load to read file as buffer (DOCX is binary ZIP).
   */
  load = async (
    source: string | Buffer,
    options?: LoadOptions
  ): Promise<Document[]> => {
    if (Buffer.isBuffer(source)) {
      return this.parseContent(source, 'buffer');
    }

    // For file paths, read as buffer
    const buffer = await this.readDocxFile(source, options);
    return this.parseContent(buffer, source);
  };

  /**
   * Parse DOCX content into a document.
   */
  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    if (typeof content === 'string') {
      throw new LoaderError(
        'DOCX content must be a buffer',
        'LOADER_ERROR',
        this.name,
        source
      );
    }

    try {
      // Extract raw text from DOCX
      const result = await mammoth.extractRawText({ buffer: content });
      const text = result.value.trim();

      // Log any warnings (but don't fail)
      if (result.messages.length > 0) {
        // Warnings are informational, not errors
        // In production, these could be logged
      }

      return [
        {
          id: this.generateId(source, text),
          content: text,
          metadata: this.buildMetadata(text),
          source,
        },
      ];
    } catch (error) {
      throw new LoaderError(
        `Failed to parse DOCX: ${(error as Error).message}`,
        'PARSE_ERROR',
        this.name,
        source,
        error as Error
      );
    }
  };

  /**
   * Read a DOCX file as a buffer.
   */
  private readDocxFile = async (
    filePath: string,
    options?: LoadOptions
  ): Promise<Buffer> => {
    // Check file size first
    const maxSize = options?.maxFileSize ?? 10 * 1024 * 1024;
    try {
      const stats = await stat(filePath);
      if (stats.size > maxSize) {
        throw new LoaderError(
          `File too large: ${stats.size} bytes (max: ${maxSize})`,
          'FILE_TOO_LARGE',
          this.name,
          filePath
        );
      }
    } catch (err) {
      if (err instanceof LoaderError) throw err;
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        throw new LoaderError(
          `File not found: ${filePath}`,
          'FILE_NOT_FOUND',
          this.name,
          filePath
        );
      }
      throw new LoaderError(
        `Failed to stat file: ${error.message}`,
        'LOADER_ERROR',
        this.name,
        filePath,
        error
      );
    }

    // Read as buffer
    try {
      return await readFile(filePath);
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
   * Build document metadata from extracted text.
   */
  private buildMetadata = (text: string): DocumentMetadata => {
    return {
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      wordCount: this.countWords(text),
    };
  };
}
