/**
 * Docling Document Loader
 *
 * Loads PDF and DOCX files using the docling-serve REST API.
 * Provides advanced document parsing with layout understanding,
 * table extraction, and rich metadata preservation.
 *
 * Requires docling-serve to be running:
 * ```bash
 * docker run -p 5001:5001 quay.io/docling-project/docling-serve
 * ```
 *
 * @see https://github.com/docling-project/docling-serve
 */

import { readFile, stat } from 'node:fs/promises';
import { extname, basename } from 'node:path';
import type { Document, DocumentMetadata, LoadOptions } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';
import { LoaderError } from './errors.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for DoclingLoader.
 */
export interface DoclingLoaderConfig {
  /**
   * Base URL of the docling-serve API.
   * @default 'http://localhost:5001'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * @default 60000 (60 seconds)
   */
  timeout?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from docling-serve /v1alpha/convert/file endpoint.
 */
interface DoclingConvertResponse {
  document: {
    /** Markdown content extracted from the document */
    md_content: string;
    /** Document metadata (if available) */
    metadata?: DoclingDocumentMetadata;
  };
}

/**
 * Metadata extracted by Docling from the document.
 */
interface DoclingDocumentMetadata {
  title?: string;
  author?: string;
  created?: string;
  modified?: string;
  page_count?: number;
  [key: string]: unknown;
}

// ============================================================================
// Constants
// ============================================================================

/** Default docling-serve URL */
const DEFAULT_BASE_URL = 'http://localhost:5001';

/** Default request timeout (60 seconds - document parsing can be slow) */
const DEFAULT_TIMEOUT = 60000;

/** Default maximum file size: 10MB */
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Environment variable for base URL override */
const ENV_BASE_URL = 'DOCLING_API_URL';

// ============================================================================
// Loader Implementation
// ============================================================================

/**
 * Document loader using docling-serve for advanced PDF/DOCX parsing.
 *
 * Docling provides superior document understanding compared to basic loaders:
 * - Layout analysis (headings, paragraphs, lists)
 * - Table extraction (preserved as markdown tables)
 * - OCR support for scanned documents
 * - Rich metadata extraction
 *
 * @example
 * ```typescript
 * const loader = new DoclingLoader({
 *   baseUrl: 'http://localhost:5001',
 * });
 *
 * // Check if service is available
 * if (await loader.isAvailable()) {
 *   const docs = await loader.load('/path/to/document.pdf', {
 *     allowedDirectories: ['/path/to']
 *   });
 *   console.log(docs[0].content); // Markdown with tables preserved
 * }
 * ```
 *
 * @example Registry with fallback
 * ```typescript
 * const registry = new DocumentLoaderRegistry();
 * const doclingLoader = new DoclingLoader();
 *
 * if (await doclingLoader.isAvailable()) {
 *   registry.register(doclingLoader, { priority: 20 });
 * }
 * registry.register(new PDFLoader(), { priority: 10 }); // Fallback
 * ```
 */
export class DoclingLoader extends BaseDocumentLoader {
  readonly name = 'DoclingLoader';
  readonly supportedFormats = ['.pdf', '.docx'];

  /** Docling API base URL */
  private readonly baseUrl: string;

  /** Request timeout in milliseconds */
  private readonly timeout: number;

  constructor(config: DoclingLoaderConfig = {}) {
    super();
    // Priority: config > environment variable > default
    this.baseUrl =
      config.baseUrl ?? process.env[ENV_BASE_URL] ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Check if this loader can handle the given source.
   *
   * Supports:
   * - File paths with .pdf or .docx extension
   * - Buffers with PDF magic bytes (%PDF-)
   * - Buffers with ZIP magic bytes (DOCX is a ZIP archive)
   */
  canLoad = (source: string | Buffer): boolean => {
    if (Buffer.isBuffer(source)) {
      return this.isPdfBuffer(source) || this.isZipBuffer(source);
    }

    const ext = extname(source).toLowerCase();
    return this.supportedFormats.includes(ext);
  };

  /**
   * Load and parse a document using docling-serve.
   *
   * For file paths, validates security constraints and reads the file.
   * For buffers, sends directly to the API.
   */
  load = async (
    source: string | Buffer,
    options?: LoadOptions
  ): Promise<Document[]> => {
    if (Buffer.isBuffer(source)) {
      return this.parseContent(source, 'buffer');
    }

    // For file paths, read as buffer
    const buffer = await this.readDocumentFile(source, options);
    return this.parseContent(buffer, source);
  };

  /**
   * Check if the docling-serve API is available.
   *
   * Useful for implementing fallback strategies:
   * ```typescript
   * const loader = (await doclingLoader.isAvailable())
   *   ? doclingLoader
   *   : pdfLoader;
   * ```
   */
  isAvailable = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  /**
   * Parse document content by sending to docling-serve API.
   */
  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    if (typeof content === 'string') {
      throw new LoaderError(
        'Document content must be a buffer',
        'LOADER_ERROR',
        this.name,
        source
      );
    }

    // Determine filename for API request
    const filename = source === 'buffer' ? this.inferFilename(content) : basename(source);

    // Send to docling-serve
    const result = await this.convertDocument(content, filename, source);

    // Extract content from response
    const markdownContent = result.document.md_content.trim();

    return [
      {
        id: this.generateId(source, markdownContent),
        content: markdownContent,
        metadata: this.buildMetadata(result, markdownContent, source),
        source,
      },
    ];
  };

  // ==========================================================================
  // Private: HTTP Client
  // ==========================================================================

  /**
   * Send document to docling-serve for conversion.
   */
  private convertDocument = async (
    buffer: Buffer,
    filename: string,
    source: string
  ): Promise<DoclingConvertResponse> => {
    try {
      // Build multipart form data
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), filename);

      const response = await fetch(`${this.baseUrl}/v1alpha/convert/file`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw await this.mapHttpError(response, source);
      }

      const data = (await response.json()) as DoclingConvertResponse;

      // Validate response structure
      if (!data.document?.md_content) {
        throw new LoaderError(
          'Invalid response from Docling: missing md_content',
          'PARSE_ERROR',
          this.name,
          source
        );
      }

      return data;
    } catch (error) {
      // Re-throw LoaderErrors
      if (error instanceof LoaderError) {
        throw error;
      }

      // Handle timeout
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new LoaderError(
          `Docling service timeout after ${this.timeout}ms`,
          'SERVICE_UNAVAILABLE',
          this.name,
          source,
          error
        );
      }

      // Handle network errors (connection refused, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LoaderError(
          `Cannot connect to Docling service at ${this.baseUrl}. Is it running?`,
          'SERVICE_UNAVAILABLE',
          this.name,
          source,
          error
        );
      }

      // Wrap other errors
      throw new LoaderError(
        `Failed to convert document: ${(error as Error).message}`,
        'LOADER_ERROR',
        this.name,
        source,
        error as Error
      );
    }
  };

  /**
   * Map HTTP error response to LoaderError.
   */
  private mapHttpError = async (
    response: Response,
    source: string
  ): Promise<LoaderError> => {
    const errorText = await response.text().catch(() => 'Unknown error');

    if (response.status >= 500) {
      return new LoaderError(
        `Docling service error (${response.status}): ${errorText}`,
        'SERVICE_UNAVAILABLE',
        this.name,
        source
      );
    }

    // 4xx errors indicate document problems
    return new LoaderError(
      `Docling rejected document (${response.status}): ${errorText}`,
      'PARSE_ERROR',
      this.name,
      source
    );
  };

  // ==========================================================================
  // Private: File Reading
  // ==========================================================================

  /**
   * Read a document file as a buffer with security checks.
   */
  private readDocumentFile = async (
    filePath: string,
    options?: LoadOptions
  ): Promise<Buffer> => {
    // Check file size first
    const maxSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

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
      if (error.code === 'EACCES') {
        throw new LoaderError(
          `Permission denied: ${filePath}`,
          'PERMISSION_DENIED',
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

    // Read file as buffer
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

  // ==========================================================================
  // Private: Metadata
  // ==========================================================================

  /**
   * Build document metadata from Docling response.
   */
  private buildMetadata = (
    result: DoclingConvertResponse,
    content: string,
    source: string
  ): DocumentMetadata => {
    const docMeta = result.document.metadata;
    const metadata: DocumentMetadata = {
      mimeType: this.getMimeType(source),
      wordCount: this.countWords(content),
      extractedBy: 'docling',
    };

    // Map Docling metadata to standard fields
    if (docMeta) {
      if (docMeta.title) {
        metadata.title = docMeta.title;
      }
      if (docMeta.author) {
        metadata.author = docMeta.author;
      }
      if (docMeta.created) {
        const date = this.parseDate(docMeta.created);
        if (date) metadata.createdAt = date;
      }
      if (docMeta.modified) {
        const date = this.parseDate(docMeta.modified);
        if (date) metadata.modifiedAt = date;
      }
      if (docMeta.page_count) {
        metadata.pageCount = docMeta.page_count;
      }
    }

    return metadata;
  };

  /**
   * Get MIME type based on file extension.
   */
  private getMimeType = (source: string): string => {
    const ext = extname(source).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  };

  /**
   * Parse date string to Date object.
   */
  private parseDate = (dateStr: string): Date | undefined => {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  // ==========================================================================
  // Private: Magic Byte Detection
  // ==========================================================================

  /**
   * Check if buffer starts with PDF magic bytes: %PDF-
   */
  private isPdfBuffer = (buffer: Buffer): boolean => {
    return (
      buffer.length >= 5 &&
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46 && // F
      buffer[4] === 0x2d // -
    );
  };

  /**
   * Check if buffer starts with ZIP magic bytes (DOCX is a ZIP archive).
   * ZIP files start with: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
   */
  private isZipBuffer = (buffer: Buffer): boolean => {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x50 && // P
      buffer[1] === 0x4b && // K
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
    );
  };

  /**
   * Infer filename from buffer content for API request.
   */
  private inferFilename = (buffer: Buffer): string => {
    if (this.isPdfBuffer(buffer)) {
      return 'document.pdf';
    }
    if (this.isZipBuffer(buffer)) {
      return 'document.docx';
    }
    return 'document.bin';
  };
}
