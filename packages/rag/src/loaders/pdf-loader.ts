/**
 * PDF Document Loader
 *
 * Loads PDF files into documents using pdf-parse.
 * Extracts text content and PDF metadata.
 */

import pdfParse from 'pdf-parse';
import { readFile, stat } from 'node:fs/promises';
import type { Document, DocumentMetadata, LoadOptions } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';
import { LoaderError } from './errors.js';

/**
 * Loader for PDF documents.
 *
 * Uses pdf-parse (built on Mozilla's pdf.js) to extract text
 * and metadata from PDF files.
 *
 * Supports:
 * - .pdf files
 *
 * Metadata includes:
 * - title: PDF document title (if set)
 * - author: PDF author (if set)
 * - pageCount: Number of pages
 * - creator: PDF creator application
 * - producer: PDF producer
 * - createdAt: PDF creation date
 * - modifiedAt: PDF modification date
 *
 * @example
 * ```typescript
 * const loader = new PDFLoader();
 *
 * const docs = await loader.load('/path/to/document.pdf', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // docs[0].metadata.pageCount === 10
 * // docs[0].metadata.title === 'My PDF Document'
 * ```
 */
export class PDFLoader extends BaseDocumentLoader {
  readonly name = 'PDFLoader';
  readonly supportedFormats = ['.pdf'];

  /**
   * Override canLoad to support buffer magic byte detection.
   */
  canLoad = (source: string | Buffer): boolean => {
    if (Buffer.isBuffer(source)) {
      // Check for PDF magic bytes: %PDF-
      return (
        source.length >= 5 &&
        source[0] === 0x25 && // %
        source[1] === 0x50 && // P
        source[2] === 0x44 && // D
        source[3] === 0x46 && // F
        source[4] === 0x2d // -
      );
    }

    // Fall back to extension-based detection
    const ext = source.toLowerCase().split('.').pop();
    return ext === 'pdf';
  };

  /**
   * Override load to read file as buffer (PDF is binary).
   */
  load = async (
    source: string | Buffer,
    options?: LoadOptions
  ): Promise<Document[]> => {
    if (Buffer.isBuffer(source)) {
      return this.parseContent(source, 'buffer');
    }

    // For file paths, read as buffer
    const buffer = await this.readPdfFile(source, options);
    return this.parseContent(buffer, source);
  };

  /**
   * Parse PDF content into a document.
   */
  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    if (typeof content === 'string') {
      throw new LoaderError(
        'PDF content must be a buffer',
        'LOADER_ERROR',
        this.name,
        source
      );
    }

    try {
      const pdf = await pdfParse(content);

      // Build metadata from PDF info
      const metadata = this.buildMetadata(pdf.info, pdf.numpages, pdf.text);

      return [
        {
          id: this.generateId(source, pdf.text),
          content: pdf.text.trim(),
          metadata,
          source,
        },
      ];
    } catch (error) {
      throw new LoaderError(
        `Failed to parse PDF: ${(error as Error).message}`,
        'PARSE_ERROR',
        this.name,
        source,
        error as Error
      );
    }
  };

  /**
   * Read a PDF file as a buffer.
   */
  private readPdfFile = async (
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
   * Build document metadata from PDF info.
   */
  private buildMetadata = (
    info: Record<string, unknown>,
    pageCount: number,
    text: string
  ): DocumentMetadata => {
    const metadata: DocumentMetadata = {
      mimeType: 'application/pdf',
      pageCount,
      wordCount: this.countWords(text),
    };

    // Extract standard PDF metadata fields
    if (typeof info?.Title === 'string' && info.Title) {
      metadata.title = info.Title;
    }

    if (typeof info?.Author === 'string' && info.Author) {
      metadata.author = info.Author;
    }

    if (typeof info?.Creator === 'string' && info.Creator) {
      metadata.creator = info.Creator;
    }

    if (typeof info?.Producer === 'string' && info.Producer) {
      metadata.producer = info.Producer;
    }

    // Handle PDF dates (format: D:YYYYMMDDHHmmSS)
    if (typeof info?.CreationDate === 'string') {
      const date = this.parsePdfDate(info.CreationDate);
      if (date) {
        metadata.createdAt = date;
      }
    }

    if (typeof info?.ModDate === 'string') {
      const date = this.parsePdfDate(info.ModDate);
      if (date) {
        metadata.modifiedAt = date;
      }
    }

    return metadata;
  };

  /**
   * Parse PDF date format: D:YYYYMMDDHHmmSS+TZ or similar.
   */
  private parsePdfDate = (pdfDate: string): Date | undefined => {
    // Remove 'D:' prefix if present
    let dateStr = pdfDate.replace(/^D:/, '');

    // Try to extract components: YYYYMMDDHHMMSS
    const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
    if (!match) {
      return undefined;
    }

    const [, year, month, day, hour, minute, second] = match;

    try {
      const date = new Date(
        parseInt(year!, 10),
        parseInt(month!, 10) - 1, // Months are 0-indexed
        parseInt(day!, 10),
        parseInt(hour ?? '00', 10),
        parseInt(minute ?? '00', 10),
        parseInt(second ?? '00', 10)
      );

      if (isNaN(date.getTime())) {
        return undefined;
      }

      return date;
    } catch {
      return undefined;
    }
  };
}
