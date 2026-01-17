/**
 * Code Document Loader
 *
 * Loads source code files into documents with language detection.
 * Supports TypeScript, JavaScript, Python, Go, Rust, and more.
 */

import { extname } from 'node:path';
import type { Document } from './types.js';
import { BaseDocumentLoader } from './base-loader.js';

/**
 * Mapping from file extensions to programming languages.
 */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  // TypeScript
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',

  // JavaScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // Python
  '.py': 'python',
  '.pyi': 'python',
  '.pyw': 'python',

  // Go
  '.go': 'go',

  // Rust
  '.rs': 'rust',

  // Java
  '.java': 'java',

  // C/C++
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',

  // C#
  '.cs': 'csharp',

  // Ruby
  '.rb': 'ruby',
  '.rake': 'ruby',

  // PHP
  '.php': 'php',

  // Swift
  '.swift': 'swift',

  // Kotlin
  '.kt': 'kotlin',
  '.kts': 'kotlin',

  // Scala
  '.scala': 'scala',

  // Shell
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',

  // SQL
  '.sql': 'sql',

  // Config files (treated as their respective formats)
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',

  // Web
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',

  // Other
  '.lua': 'lua',
  '.r': 'r',
  '.R': 'r',
  '.dart': 'dart',
  '.zig': 'zig',
  '.v': 'v',
  '.nim': 'nim',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hrl': 'erlang',
  '.hs': 'haskell',
  '.ml': 'ocaml',
  '.mli': 'ocaml',
  '.fs': 'fsharp',
  '.fsi': 'fsharp',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.pl': 'perl',
  '.pm': 'perl',
};

/**
 * Loader for source code files.
 *
 * Supports a wide variety of programming languages and config formats.
 * Automatically detects the language from the file extension and includes
 * it in the document metadata.
 *
 * Metadata includes:
 * - language: Detected programming language
 * - mimeType: Based on the file type
 * - wordCount: Token count (useful for estimating complexity)
 * - lineCount: Number of lines in the file
 *
 * @example
 * ```typescript
 * const loader = new CodeLoader();
 *
 * const docs = await loader.load('/path/to/file.ts', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // docs[0].metadata.language === 'typescript'
 * // docs[0].metadata.lineCount === 100
 * ```
 */
export class CodeLoader extends BaseDocumentLoader {
  readonly name = 'CodeLoader';
  readonly supportedFormats = Object.keys(EXTENSION_TO_LANGUAGE);

  /**
   * Parse source code content into a document.
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

    // Detect language from extension
    const ext = source !== 'buffer' ? extname(source).toLowerCase() : '';
    const language = EXTENSION_TO_LANGUAGE[ext] ?? 'unknown';

    // Get base metadata from file stats (if available)
    const baseMetadata =
      source !== 'buffer' ? await this.createBaseMetadata(source, text) : {};

    // Count lines
    const lineCount = text.split('\n').length;

    return [
      {
        id: this.generateId(source, text),
        content: text,
        metadata: {
          ...baseMetadata,
          language,
          lineCount,
          wordCount: this.countWords(text),
          mimeType: this.getMimeType(language),
        },
        source,
      },
    ];
  };

  /**
   * Get MIME type for a programming language.
   */
  private getMimeType = (language: string): string => {
    const mimeTypes: Record<string, string> = {
      typescript: 'text/typescript',
      javascript: 'text/javascript',
      python: 'text/x-python',
      go: 'text/x-go',
      rust: 'text/x-rust',
      java: 'text/x-java',
      c: 'text/x-c',
      cpp: 'text/x-c++',
      csharp: 'text/x-csharp',
      ruby: 'text/x-ruby',
      php: 'text/x-php',
      swift: 'text/x-swift',
      kotlin: 'text/x-kotlin',
      scala: 'text/x-scala',
      shell: 'text/x-shellscript',
      sql: 'text/x-sql',
      json: 'application/json',
      yaml: 'text/yaml',
      toml: 'text/x-toml',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      scss: 'text/x-scss',
      sass: 'text/x-sass',
      less: 'text/x-less',
    };

    return mimeTypes[language] ?? 'text/plain';
  };
}
