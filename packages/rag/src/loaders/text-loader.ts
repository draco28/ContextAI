/**
 * Text Document Loader
 *
 * Loads plain text files (.txt, .text) into documents.
 * Extracts basic metadata like word count and file stats.
 */

import type { Document } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';

/**
 * Loader for plain text files.
 *
 * Supports:
 * - .txt files
 * - .text files
 *
 * Extracts metadata:
 * - wordCount: Number of words in the document
 * - mimeType: Always 'text/plain'
 * - createdAt/modifiedAt: From file stats (when loading from path)
 *
 * @example
 * ```typescript
 * const loader = new TextLoader();
 *
 * // Load from file path
 * const docs = await loader.load('/path/to/file.txt', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // Load from buffer
 * const docs = await loader.load(Buffer.from('Hello, World!'));
 * ```
 */
export class TextLoader extends BaseDocumentLoader {
  readonly name = 'TextLoader';
  readonly supportedFormats = ['.txt', '.text'];

  /**
   * Parse plain text content into a document.
   *
   * @param content - File content as string or buffer
   * @param source - Original source path (for metadata)
   * @returns Array containing a single document
   */
  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    // Convert buffer to string if needed
    const text =
      typeof content === 'string' ? content : content.toString('utf-8');

    // Get base metadata from file stats (if available)
    const baseMetadata =
      source !== 'buffer' ? await this.createBaseMetadata(source, text) : {};

    return [
      {
        id: this.generateId(source, text),
        content: text,
        metadata: {
          ...baseMetadata,
          wordCount: this.countWords(text),
          mimeType: 'text/plain',
        },
        source,
      },
    ];
  };
}
