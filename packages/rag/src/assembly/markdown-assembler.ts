/**
 * Markdown Context Assembler
 *
 * Formats chunks as Markdown for human-readable output.
 * Supports multiple citation styles for different use cases.
 *
 * Citation styles:
 * - inline:   `[1] Content here (source: file.md:10)`
 * - footnote: `Content here [1]` with footnotes at end
 * - header:   `### Source 1: file.md\nContent here`
 */

import type { Chunk } from '../vector-store/types.js';
import type {
  MarkdownAssemblerConfig,
  AssemblyOptions,
  SourceAttribution,
} from './types.js';
import { BaseAssembler } from './base-assembler.js';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default Markdown assembler configuration.
 */
export const DEFAULT_MARKDOWN_CONFIG: Required<
  Pick<
    MarkdownAssemblerConfig,
    'citationStyle' | 'chunkSeparator' | 'includeSectionHeaders'
  >
> = {
  citationStyle: 'inline',
  chunkSeparator: '\n\n---\n\n',
  includeSectionHeaders: true,
};

// ============================================================================
// Markdown Assembler
// ============================================================================

/**
 * Assembler that outputs Markdown-formatted context.
 *
 * @example
 * ```typescript
 * const assembler = new MarkdownAssembler({
 *   citationStyle: 'footnote',
 *   ordering: 'sandwich',
 * });
 *
 * const result = await assembler.assemble(rerankedResults);
 * // Content from first source [1]
 * //
 * // ---
 * //
 * // Content from second source [2]
 * //
 * // ---
 * //
 * // [1]: auth.md:42
 * // [2]: users.md:15
 * ```
 */
export class MarkdownAssembler extends BaseAssembler {
  readonly name: string;

  /** Markdown-specific configuration */
  private readonly mdConfig: typeof DEFAULT_MARKDOWN_CONFIG;

  constructor(config?: MarkdownAssemblerConfig) {
    super(config);
    this.name = config?.name ?? 'MarkdownAssembler';
    this.mdConfig = {
      ...DEFAULT_MARKDOWN_CONFIG,
      citationStyle: config?.citationStyle ?? DEFAULT_MARKDOWN_CONFIG.citationStyle,
      chunkSeparator: config?.chunkSeparator ?? DEFAULT_MARKDOWN_CONFIG.chunkSeparator,
      includeSectionHeaders:
        config?.includeSectionHeaders ?? DEFAULT_MARKDOWN_CONFIG.includeSectionHeaders,
    };
  }

  /**
   * Format chunks as Markdown.
   */
  protected _format = async (
    chunks: Chunk[],
    sources: SourceAttribution[],
    _options?: AssemblyOptions
  ): Promise<string> => {
    if (chunks.length === 0) {
      return '';
    }

    switch (this.mdConfig.citationStyle) {
      case 'inline':
        return this.formatInline(chunks, sources);
      case 'footnote':
        return this.formatFootnote(chunks, sources);
      case 'header':
        return this.formatHeader(chunks, sources);
      default:
        return this.formatInline(chunks, sources);
    }
  };

  /**
   * Format with inline citations.
   *
   * Output: `[1] Content here (source: file.md:10)`
   */
  private formatInline(
    chunks: Chunk[],
    sources: SourceAttribution[]
  ): string {
    const formatted = chunks.map((chunk, index) => {
      const source = sources[index]!; // Sources are guaranteed to be 1:1 with chunks
      const parts: string[] = [];

      // Citation prefix
      parts.push(`**[${source.index}]**`);

      // Section header if available and configured
      if (this.mdConfig.includeSectionHeaders && source.section) {
        parts.push(`*${source.section}*`);
      }

      // Content
      parts.push(chunk.content);

      // Source attribution
      if (this.config.includeSourceAttribution) {
        const sourceInfo = this.buildSourceInfo(source);
        if (sourceInfo) {
          parts.push(`*(${sourceInfo})*`);
        }
      }

      // Score if configured
      if (this.config.includeScores) {
        parts.push(`[relevance: ${(source.score * 100).toFixed(1)}%]`);
      }

      return parts.join(' ');
    });

    return formatted.join(this.mdConfig.chunkSeparator);
  }

  /**
   * Format with footnote citations.
   *
   * Output:
   * ```
   * Content here [1]
   *
   * ---
   *
   * [1]: file.md:10
   * ```
   */
  private formatFootnote(
    chunks: Chunk[],
    sources: SourceAttribution[]
  ): string {
    // Format content with footnote references
    const content = chunks.map((chunk, index) => {
      const source = sources[index]!; // Sources are guaranteed to be 1:1 with chunks
      const parts: string[] = [];

      // Section header if available
      if (this.mdConfig.includeSectionHeaders && source.section) {
        parts.push(`**${source.section}**\n`);
      }

      // Content with footnote reference
      parts.push(`${chunk.content} [${source.index}]`);

      return parts.join('');
    });

    // Build footnotes section
    const footnotes = sources.map((source) => {
      const sourceInfo = this.buildSourceInfo(source) ?? `source ${source.index}`;
      const scorePart = this.config.includeScores
        ? ` (${(source.score * 100).toFixed(1)}% relevance)`
        : '';
      return `[${source.index}]: ${sourceInfo}${scorePart}`;
    });

    return [
      content.join(this.mdConfig.chunkSeparator),
      '',
      '---',
      '',
      '**Sources:**',
      ...footnotes,
    ].join('\n');
  }

  /**
   * Format with header citations.
   *
   * Output:
   * ```
   * ### Source 1: file.md
   *
   * Content here
   * ```
   */
  private formatHeader(
    chunks: Chunk[],
    sources: SourceAttribution[]
  ): string {
    const formatted = chunks.map((chunk, index) => {
      const source = sources[index]!; // Sources are guaranteed to be 1:1 with chunks
      const parts: string[] = [];

      // Header with source info
      const headerParts: string[] = [`### Source ${source.index}`];
      if (source.source) {
        headerParts.push(`: ${source.source}`);
      }
      if (source.location) {
        headerParts.push(` (${source.location})`);
      }
      parts.push(headerParts.join(''));

      // Section subheader if available
      if (this.mdConfig.includeSectionHeaders && source.section) {
        parts.push(`> Section: ${source.section}`);
      }

      // Score if configured
      if (this.config.includeScores) {
        parts.push(`> Relevance: ${(source.score * 100).toFixed(1)}%`);
      }

      // Content
      parts.push('');
      parts.push(chunk.content);

      return parts.join('\n');
    });

    return formatted.join(this.mdConfig.chunkSeparator);
  }

  /**
   * Build human-readable source info string.
   */
  private buildSourceInfo(source: SourceAttribution): string | undefined {
    const parts: string[] = [];

    if (source.source) {
      parts.push(source.source);
    }

    if (source.location) {
      if (parts.length > 0) {
        parts.push(`:${source.location.replace(/\D+/g, '')}`);
      } else {
        parts.push(source.location);
      }
    }

    return parts.length > 0 ? parts.join('') : undefined;
  }

  /**
   * Markdown has moderate formatting overhead.
   */
  protected override getFormattingOverhead(): number {
    // Account for citations, separators, headers
    return 80;
  }
}
