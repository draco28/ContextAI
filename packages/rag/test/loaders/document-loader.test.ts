import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  BaseDocumentLoader,
  DocumentLoaderRegistry,
  LoaderError,
  type Document,
  type LoadOptions,
} from '../../src/index.js';

// ============================================================================
// Test Implementation
// ============================================================================

/**
 * Concrete test loader that extends BaseDocumentLoader.
 * Simply returns the content as-is with basic metadata.
 */
class TestTextLoader extends BaseDocumentLoader {
  readonly name = 'TestTextLoader';
  readonly supportedFormats = ['.txt', '.text'];

  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    const text =
      typeof content === 'string' ? content : content.toString('utf-8');
    return [
      {
        id: this.generateId(source, text),
        content: text,
        metadata: {
          wordCount: this.countWords(text),
          mimeType: 'text/plain',
        },
        source,
      },
    ];
  };
}

/**
 * Another test loader for testing registry priority.
 */
class AdvancedTextLoader extends BaseDocumentLoader {
  readonly name = 'AdvancedTextLoader';
  readonly supportedFormats = ['.txt'];

  protected parseContent = async (
    content: string | Buffer,
    source: string
  ): Promise<Document[]> => {
    const text =
      typeof content === 'string' ? content : content.toString('utf-8');
    return [
      {
        id: this.generateId(source, text),
        content: text.toUpperCase(), // Different behavior
        metadata: { advanced: true },
        source,
      },
    ];
  };
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Document Loader', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testDir = join(tmpdir(), `rag-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // LoaderError Tests
  // ==========================================================================

  describe('LoaderError', () => {
    it('should create error with all properties', () => {
      const error = new LoaderError(
        'Test error message',
        'PARSE_ERROR',
        'TestLoader',
        '/path/to/file.txt'
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.loaderName).toBe('TestLoader');
      expect(error.source).toBe('/path/to/file.txt');
      expect(error.name).toBe('LoaderError');
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new LoaderError(
        'Wrapper error',
        'LOADER_ERROR',
        'TestLoader',
        '/path/to/file.txt',
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should convert to details object', () => {
      const error = new LoaderError(
        'Test error',
        'FILE_NOT_FOUND',
        'TestLoader',
        '/missing.txt'
      );

      const details = error.toDetails();
      expect(details).toEqual({
        code: 'FILE_NOT_FOUND',
        loaderName: 'TestLoader',
        source: '/missing.txt',
        cause: undefined,
      });
    });
  });

  // ==========================================================================
  // BaseDocumentLoader Tests
  // ==========================================================================

  describe('BaseDocumentLoader', () => {
    let loader: TestTextLoader;

    beforeEach(() => {
      loader = new TestTextLoader();
    });

    describe('canLoad', () => {
      it('should return true for supported extensions', () => {
        expect(loader.canLoad('file.txt')).toBe(true);
        expect(loader.canLoad('file.text')).toBe(true);
        expect(loader.canLoad('/path/to/file.txt')).toBe(true);
      });

      it('should return false for unsupported extensions', () => {
        expect(loader.canLoad('file.pdf')).toBe(false);
        expect(loader.canLoad('file.md')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(loader.canLoad('file.TXT')).toBe(true);
        expect(loader.canLoad('file.Txt')).toBe(true);
      });

      it('should return false for buffers by default', () => {
        expect(loader.canLoad(Buffer.from('hello'))).toBe(false);
      });
    });

    describe('load from file', () => {
      it('should load a text file', async () => {
        const filePath = join(testDir, 'test.txt');
        await writeFile(filePath, 'Hello, World!');

        const docs = await loader.load(filePath, {
          allowedDirectories: [testDir],
        });

        expect(docs).toHaveLength(1);
        expect(docs[0].content).toBe('Hello, World!');
        expect(docs[0].source).toBe(filePath);
        expect(docs[0].metadata.wordCount).toBe(2);
      });

      it('should throw FILE_NOT_FOUND for missing files', async () => {
        const filePath = join(testDir, 'nonexistent.txt');

        await expect(
          loader.load(filePath, { allowedDirectories: [testDir] })
        ).rejects.toThrow(LoaderError);

        try {
          await loader.load(filePath, { allowedDirectories: [testDir] });
        } catch (e) {
          expect(e).toBeInstanceOf(LoaderError);
          expect((e as LoaderError).code).toBe('FILE_NOT_FOUND');
        }
      });

      it('should throw FILE_TOO_LARGE for oversized files', async () => {
        const filePath = join(testDir, 'large.txt');
        await writeFile(filePath, 'x'.repeat(1000));

        await expect(
          loader.load(filePath, {
            allowedDirectories: [testDir],
            maxFileSize: 100, // 100 bytes max
          })
        ).rejects.toThrow(LoaderError);

        try {
          await loader.load(filePath, {
            allowedDirectories: [testDir],
            maxFileSize: 100,
          });
        } catch (e) {
          expect((e as LoaderError).code).toBe('FILE_TOO_LARGE');
        }
      });
    });

    describe('load from buffer', () => {
      it('should load content from buffer', async () => {
        const buffer = Buffer.from('Buffer content');

        const docs = await loader.load(buffer);

        expect(docs).toHaveLength(1);
        expect(docs[0].content).toBe('Buffer content');
        expect(docs[0].source).toBe('buffer');
      });
    });

    describe('ID generation', () => {
      it('should generate deterministic IDs', async () => {
        const filePath = join(testDir, 'deterministic.txt');
        await writeFile(filePath, 'Same content');

        const docs1 = await loader.load(filePath, {
          allowedDirectories: [testDir],
        });
        const docs2 = await loader.load(filePath, {
          allowedDirectories: [testDir],
        });

        expect(docs1[0].id).toBe(docs2[0].id);
      });

      it('should generate different IDs for different content', async () => {
        const file1 = join(testDir, 'file1.txt');
        const file2 = join(testDir, 'file2.txt');
        await writeFile(file1, 'Content A');
        await writeFile(file2, 'Content B');

        const docs1 = await loader.load(file1, {
          allowedDirectories: [testDir],
        });
        const docs2 = await loader.load(file2, {
          allowedDirectories: [testDir],
        });

        expect(docs1[0].id).not.toBe(docs2[0].id);
      });
    });
  });

  // ==========================================================================
  // DocumentLoaderRegistry Tests
  // ==========================================================================

  describe('DocumentLoaderRegistry', () => {
    let registry: DocumentLoaderRegistry;

    beforeEach(() => {
      registry = new DocumentLoaderRegistry();
    });

    describe('register', () => {
      it('should register a loader', () => {
        registry.register(new TestTextLoader());

        expect(registry.getLoaderNames()).toContain('TestTextLoader');
        expect(registry.getSupportedFormats()).toContain('.txt');
        expect(registry.getSupportedFormats()).toContain('.text');
      });

      it('should register multiple loaders', () => {
        registry.register(new TestTextLoader());
        registry.register(new AdvancedTextLoader());

        expect(registry.getLoaderNames()).toHaveLength(2);
      });
    });

    describe('unregister', () => {
      it('should remove a loader by name', () => {
        registry.register(new TestTextLoader());
        const removed = registry.unregister('TestTextLoader');

        expect(removed).toBe(true);
        expect(registry.getLoaderNames()).not.toContain('TestTextLoader');
      });

      it('should return false for non-existent loader', () => {
        const removed = registry.unregister('NonExistent');
        expect(removed).toBe(false);
      });
    });

    describe('getLoader', () => {
      it('should return loader for supported format', () => {
        registry.register(new TestTextLoader());

        const loader = registry.getLoader('file.txt');
        expect(loader?.name).toBe('TestTextLoader');
      });

      it('should return undefined for unsupported format', () => {
        registry.register(new TestTextLoader());

        const loader = registry.getLoader('file.pdf');
        expect(loader).toBeUndefined();
      });

      it('should return higher priority loader when multiple match', () => {
        registry.register(new TestTextLoader(), { priority: 10 });
        registry.register(new AdvancedTextLoader(), { priority: 20 });

        const loader = registry.getLoader('file.txt');
        expect(loader?.name).toBe('AdvancedTextLoader');
      });
    });

    describe('getLoaders', () => {
      it('should return all matching loaders sorted by priority', () => {
        registry.register(new TestTextLoader(), { priority: 10 });
        registry.register(new AdvancedTextLoader(), { priority: 20 });

        const loaders = registry.getLoaders('file.txt');
        expect(loaders).toHaveLength(2);
        expect(loaders[0].name).toBe('AdvancedTextLoader'); // Higher priority first
        expect(loaders[1].name).toBe('TestTextLoader');
      });
    });

    describe('canLoad', () => {
      it('should return true when a loader can handle the source', () => {
        registry.register(new TestTextLoader());

        expect(registry.canLoad('file.txt')).toBe(true);
        expect(registry.canLoad('file.pdf')).toBe(false);
      });
    });

    describe('load', () => {
      it('should load using auto-detected loader', async () => {
        registry.register(new TestTextLoader());

        const filePath = join(testDir, 'auto.txt');
        await writeFile(filePath, 'Auto-detected content');

        const docs = await registry.load(filePath, {
          allowedDirectories: [testDir],
        });

        expect(docs).toHaveLength(1);
        expect(docs[0].content).toBe('Auto-detected content');
      });

      it('should throw for unsupported format', async () => {
        registry.register(new TestTextLoader());

        await expect(registry.load('file.pdf')).rejects.toThrow(LoaderError);

        try {
          await registry.load('file.pdf');
        } catch (e) {
          expect((e as LoaderError).code).toBe('UNSUPPORTED_FORMAT');
        }
      });
    });
  });
});
