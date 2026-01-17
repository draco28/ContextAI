/**
 * Markdown Document Loader
 *
 * Loads markdown files (.md, .markdown) into documents.
 * Extracts YAML frontmatter as metadata.
 */

import matter from 'gray-matter';
import type { Document, DocumentMetadata } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';

/**
 * Loader for markdown files with optional YAML frontmatter.
 *
 * Supports:
 * - .md files
 * - .markdown files
 *
 * Frontmatter Extraction:
 * - title, author, date fields map to standard metadata
 * - All other frontmatter fields added as custom metadata
 *
 * @example
 * ```typescript
 * const loader = new MarkdownLoader();
 *
 * // For a file like:
 * // ---
 * // title: My Document
 * // author: Jane Doe
 * // tags: [typescript, sdk]
 * // ---
 * // # Content here
 *
 * const docs = await loader.load('/path/to/file.md', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // docs[0].metadata.title === 'My Document'
 * // docs[0].metadata.author === 'Jane Doe'
 * // docs[0].metadata.tags === ['typescript', 'sdk']
 * // docs[0].content === '# Content here'
 * ```
 */
export class MarkdownLoader extends BaseDocumentLoader {
  readonly name = 'MarkdownLoader';
  readonly supportedFormats = ['.md', '.markdown'];

  /**
   * Parse markdown content with frontmatter extraction.
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

    // Parse frontmatter with gray-matter
    const parsed = matter(text);

    // Get base metadata from file stats (if available)
    const baseMetadata =
      source !== 'buffer'
        ? await this.createBaseMetadata(source, parsed.content)
        : {};

    // Build metadata from frontmatter + base
    const metadata = this.buildMetadata(parsed.data, baseMetadata, parsed.content);

    return [
      {
        id: this.generateId(source, text),
        content: parsed.content.trim(),
        metadata,
        source,
      },
    ];
  };

  /**
   * Build document metadata from frontmatter and file stats.
   *
   * Maps common frontmatter fields to standard metadata:
   * - title → title
   * - author → author
   * - date/created → createdAt
   * - modified/updated → modifiedAt
   *
   * All other frontmatter fields are preserved as custom metadata.
   */
  private buildMetadata = (
    frontmatter: Record<string, unknown>,
    baseMetadata: Partial<DocumentMetadata>,
    content: string
  ): DocumentMetadata => {
    const metadata: DocumentMetadata = {
      ...baseMetadata,
      mimeType: 'text/markdown',
      wordCount: this.countWords(content),
    };

    // Map standard fields
    if (typeof frontmatter.title === 'string') {
      metadata.title = frontmatter.title;
    }

    if (typeof frontmatter.author === 'string') {
      metadata.author = frontmatter.author;
    }

    // Handle date fields (frontmatter takes precedence over file stats)
    const createdDate = frontmatter.date ?? frontmatter.created;
    if (createdDate) {
      const parsed = this.parseDate(createdDate);
      if (parsed) {
        metadata.createdAt = parsed;
      }
    }

    const modifiedDate = frontmatter.modified ?? frontmatter.updated;
    if (modifiedDate) {
      const parsed = this.parseDate(modifiedDate);
      if (parsed) {
        metadata.modifiedAt = parsed;
      }
    }

    // Add remaining frontmatter fields as custom metadata
    const standardFields = ['title', 'author', 'date', 'created', 'modified', 'updated'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (!standardFields.includes(key) && value !== undefined) {
        metadata[key] = value;
      }
    }

    return metadata;
  };

  /**
   * Parse a date from various formats.
   */
  private parseDate = (value: unknown): Date | undefined => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return undefined;
  };
}
