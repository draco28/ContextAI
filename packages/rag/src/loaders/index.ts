/**
 * Document Loaders
 *
 * Interfaces and utilities for loading documents from various sources.
 *
 * @example
 * ```typescript
 * import {
 *   DocumentLoaderRegistry,
 *   BaseDocumentLoader,
 *   type Document,
 *   type DocumentLoader,
 * } from '@contextaisdk/rag';
 *
 * // Create a custom loader
 * class MyLoader extends BaseDocumentLoader {
 *   readonly name = 'MyLoader';
 *   readonly supportedFormats = ['.xyz'];
 *
 *   protected async parseContent(content: string, source: string) {
 *     return [{ id: this.generateId(source, content), content, metadata: {}, source }];
 *   }
 * }
 *
 * // Register and use
 * const registry = new DocumentLoaderRegistry();
 * registry.register(new MyLoader());
 * const docs = await registry.load('file.xyz', { allowedDirectories: ['/safe'] });
 * ```
 */

// Types
export type {
  Document,
  DocumentMetadata,
  DocumentLoader,
  LoadOptions,
  LoaderErrorCode,
  LoaderErrorDetails,
} from './types.js';

// Errors
export { LoaderError } from './errors.js';

// Base class
export { BaseDocumentLoader } from './base-loader.js';

// Document loaders
export { TextLoader } from './text-loader.js';
export { MarkdownLoader } from './markdown-loader.js';
export { CodeLoader } from './code-loader.js';
export { PDFLoader } from './pdf-loader.js';
export { DocxLoader } from './docx-loader.js';
export { DoclingLoader } from './docling-loader.js';
export type { DoclingLoaderConfig } from './docling-loader.js';

// Registry
export { DocumentLoaderRegistry, defaultRegistry } from './registry.js';
export type { RegisterOptions } from './registry.js';
