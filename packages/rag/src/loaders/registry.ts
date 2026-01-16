/**
 * Document Loader Registry
 *
 * Central registry for managing document loaders and auto-detecting formats.
 */

import type { Document, DocumentLoader, LoadOptions } from './types.js';
import { LoaderError } from './errors.js';

/**
 * Registration entry with priority for conflict resolution.
 */
interface LoaderRegistration {
  /** The loader instance */
  loader: DocumentLoader;
  /** Priority for format conflicts (higher wins) */
  priority: number;
}

/**
 * Options for registering a loader.
 */
export interface RegisterOptions {
  /** Priority for format conflicts (default: 10, higher wins) */
  priority?: number;
}

/**
 * Central registry for document loaders.
 *
 * Manages loader registration and provides automatic format detection.
 *
 * @example
 * ```typescript
 * const registry = new DocumentLoaderRegistry();
 *
 * // Register loaders
 * registry.register(new MarkdownLoader());
 * registry.register(new PDFLoader());
 *
 * // Auto-detect and load
 * const docs = await registry.load('/path/to/file.md', {
 *   allowedDirectories: ['/path/to']
 * });
 *
 * // Or get loader for manual control
 * const loader = registry.getLoader('file.pdf');
 * ```
 */
export class DocumentLoaderRegistry {
  /** Map of format extension to loader registrations */
  private readonly formatMap = new Map<string, LoaderRegistration[]>();

  /** All registered loaders (for canLoad-based detection) */
  private readonly loaders: LoaderRegistration[] = [];

  /**
   * Register a document loader.
   *
   * The loader's supportedFormats are used to map extensions to the loader.
   * If multiple loaders support the same format, priority determines which wins.
   *
   * @param loader - The loader to register
   * @param options - Registration options (priority)
   */
  register = (loader: DocumentLoader, options?: RegisterOptions): void => {
    const priority = options?.priority ?? 10;
    const registration: LoaderRegistration = { loader, priority };

    // Add to general loaders list
    this.loaders.push(registration);

    // Map each supported format to this loader
    for (const format of loader.supportedFormats) {
      const normalizedFormat = format.toLowerCase();
      const existing = this.formatMap.get(normalizedFormat) ?? [];
      existing.push(registration);
      // Sort by priority descending (highest first)
      existing.sort((a, b) => b.priority - a.priority);
      this.formatMap.set(normalizedFormat, existing);
    }
  };

  /**
   * Unregister a loader by name.
   *
   * Removes the loader from both format mappings and general list.
   *
   * @param loaderName - Name of the loader to remove
   * @returns true if a loader was removed
   */
  unregister = (loaderName: string): boolean => {
    let removed = false;

    // Remove from loaders list
    const index = this.loaders.findIndex((r) => r.loader.name === loaderName);
    if (index !== -1) {
      this.loaders.splice(index, 1);
      removed = true;
    }

    // Remove from format map
    for (const [format, registrations] of this.formatMap) {
      const filtered = registrations.filter(
        (r) => r.loader.name !== loaderName
      );
      if (filtered.length !== registrations.length) {
        removed = true;
        if (filtered.length === 0) {
          this.formatMap.delete(format);
        } else {
          this.formatMap.set(format, filtered);
        }
      }
    }

    return removed;
  };

  /**
   * Get the highest-priority loader for a source.
   *
   * First tries extension-based matching, then falls back to canLoad().
   *
   * @param source - File path or buffer
   * @returns The best matching loader, or undefined if none found
   */
  getLoader = (source: string | Buffer): DocumentLoader | undefined => {
    // For strings, try extension-based lookup first
    if (typeof source === 'string') {
      const ext = this.extractExtension(source);
      if (ext) {
        const registrations = this.formatMap.get(ext);
        if (registrations && registrations.length > 0) {
          return registrations[0]!.loader;
        }
      }
    }

    // Fall back to canLoad-based detection
    for (const { loader } of this.loaders) {
      if (loader.canLoad(source)) {
        return loader;
      }
    }

    return undefined;
  };

  /**
   * Get all loaders that can handle a source.
   *
   * Useful when you want to let users choose between multiple options.
   *
   * @param source - File path or buffer
   * @returns Array of matching loaders (sorted by priority)
   */
  getLoaders = (source: string | Buffer): DocumentLoader[] => {
    const matches: LoaderRegistration[] = [];

    // For strings, check extension-based matches
    if (typeof source === 'string') {
      const ext = this.extractExtension(source);
      if (ext) {
        const registrations = this.formatMap.get(ext);
        if (registrations) {
          matches.push(...registrations);
        }
      }
    }

    // Also check canLoad for each loader
    for (const registration of this.loaders) {
      if (registration.loader.canLoad(source)) {
        // Avoid duplicates
        if (!matches.some((m) => m.loader.name === registration.loader.name)) {
          matches.push(registration);
        }
      }
    }

    // Sort by priority and return loaders
    return matches.sort((a, b) => b.priority - a.priority).map((r) => r.loader);
  };

  /**
   * Load a document using auto-detected loader.
   *
   * Convenience method that finds the right loader and loads the document.
   *
   * @param source - File path or buffer
   * @param options - Load options
   * @returns Loaded documents
   * @throws {LoaderError} If no loader found for the format
   */
  load = async (
    source: string | Buffer,
    options?: LoadOptions
  ): Promise<Document[]> => {
    const loader = this.getLoader(source);

    if (!loader) {
      const sourceDesc = Buffer.isBuffer(source) ? 'buffer' : source;
      throw new LoaderError(
        `No loader found for: ${sourceDesc}`,
        'UNSUPPORTED_FORMAT',
        'DocumentLoaderRegistry',
        sourceDesc
      );
    }

    return loader.load(source, options);
  };

  /**
   * Check if any registered loader can handle the source.
   *
   * @param source - File path or buffer
   * @returns true if at least one loader can handle it
   */
  canLoad = (source: string | Buffer): boolean => {
    return this.getLoader(source) !== undefined;
  };

  /**
   * Get all supported formats across all registered loaders.
   *
   * @returns Array of unique format extensions
   */
  getSupportedFormats = (): string[] => {
    return Array.from(this.formatMap.keys());
  };

  /**
   * Get all registered loader names.
   *
   * @returns Array of loader names
   */
  getLoaderNames = (): string[] => {
    return this.loaders.map((r) => r.loader.name);
  };

  /**
   * Extract and normalize file extension.
   */
  private extractExtension = (filePath: string): string | undefined => {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filePath.length - 1) {
      return undefined;
    }
    return filePath.slice(lastDot).toLowerCase();
  };
}

/**
 * Default global registry instance.
 *
 * Use this for simple applications, or create your own registry
 * for more control.
 */
export const defaultRegistry = new DocumentLoaderRegistry();
