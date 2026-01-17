import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CodeLoader } from '../../src/loaders/code-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

describe('CodeLoader', () => {
  let testDir: string;
  let loader: CodeLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `code-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new CodeLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('CodeLoader');
    });

    it('should support TypeScript extensions', () => {
      expect(loader.supportedFormats).toContain('.ts');
      expect(loader.supportedFormats).toContain('.tsx');
      expect(loader.supportedFormats).toContain('.mts');
      expect(loader.supportedFormats).toContain('.cts');
    });

    it('should support JavaScript extensions', () => {
      expect(loader.supportedFormats).toContain('.js');
      expect(loader.supportedFormats).toContain('.jsx');
      expect(loader.supportedFormats).toContain('.mjs');
      expect(loader.supportedFormats).toContain('.cjs');
    });

    it('should support Python extensions', () => {
      expect(loader.supportedFormats).toContain('.py');
      expect(loader.supportedFormats).toContain('.pyi');
    });

    it('should support common languages', () => {
      expect(loader.supportedFormats).toContain('.go');
      expect(loader.supportedFormats).toContain('.rs');
      expect(loader.supportedFormats).toContain('.java');
      expect(loader.supportedFormats).toContain('.rb');
      expect(loader.supportedFormats).toContain('.php');
    });
  });

  describe('canLoad', () => {
    it('should return true for supported extensions', () => {
      expect(loader.canLoad('file.ts')).toBe(true);
      expect(loader.canLoad('file.py')).toBe(true);
      expect(loader.canLoad('/path/to/file.go')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(loader.canLoad('file.TS')).toBe(true);
      expect(loader.canLoad('file.Py')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(loader.canLoad('file.pdf')).toBe(false);
      expect(loader.canLoad('file.docx')).toBe(false);
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript', async () => {
      const filePath = join(testDir, 'file.ts');
      await writeFile(filePath, 'const x: number = 1;');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('typescript');
    });

    it('should detect TypeScript React', async () => {
      const filePath = join(testDir, 'component.tsx');
      await writeFile(filePath, 'const App = () => <div>Hello</div>;');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('typescript');
    });

    it('should detect JavaScript', async () => {
      const filePath = join(testDir, 'file.js');
      await writeFile(filePath, 'const x = 1;');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('javascript');
    });

    it('should detect Python', async () => {
      const filePath = join(testDir, 'script.py');
      await writeFile(filePath, 'def hello(): print("Hello")');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('python');
    });

    it('should detect Go', async () => {
      const filePath = join(testDir, 'main.go');
      await writeFile(filePath, 'package main\nfunc main() {}');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('go');
    });

    it('should detect Rust', async () => {
      const filePath = join(testDir, 'lib.rs');
      await writeFile(filePath, 'fn main() {}');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('rust');
    });

    it('should detect JSON', async () => {
      const filePath = join(testDir, 'config.json');
      await writeFile(filePath, '{"key": "value"}');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('json');
    });

    it('should detect YAML', async () => {
      const filePath = join(testDir, 'config.yaml');
      await writeFile(filePath, 'key: value');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.language).toBe('yaml');
    });
  });

  describe('metadata extraction', () => {
    it('should count lines', async () => {
      const filePath = join(testDir, 'lines.ts');
      const content = 'line 1\nline 2\nline 3\nline 4\nline 5';
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.lineCount).toBe(5);
    });

    it('should count words', async () => {
      const filePath = join(testDir, 'words.ts');
      await writeFile(filePath, 'const hello = "world";');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(4);
    });

    it('should set correct mime type for TypeScript', async () => {
      const filePath = join(testDir, 'file.ts');
      await writeFile(filePath, 'const x = 1;');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.mimeType).toBe('text/typescript');
    });

    it('should set correct mime type for JSON', async () => {
      const filePath = join(testDir, 'file.json');
      await writeFile(filePath, '{}');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.mimeType).toBe('application/json');
    });

    it('should include file timestamps', async () => {
      const filePath = join(testDir, 'timestamps.ts');
      await writeFile(filePath, 'export {};');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(docs[0].metadata.modifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('load from buffer', () => {
    it('should load code from buffer', async () => {
      const buffer = Buffer.from('function test() {}');

      const docs = await loader.load(buffer);

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('function test() {}');
      expect(docs[0].source).toBe('buffer');
    });

    it('should set language to unknown for buffer', async () => {
      const buffer = Buffer.from('const x = 1;');

      const docs = await loader.load(buffer);

      expect(docs[0].metadata.language).toBe('unknown');
    });
  });

  describe('ID generation', () => {
    it('should generate deterministic IDs', async () => {
      const filePath = join(testDir, 'deterministic.ts');
      await writeFile(filePath, 'const x = 1;');

      const docs1 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });
      const docs2 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs1[0].id).toBe(docs2[0].id);
    });
  });

  describe('error handling', () => {
    it('should throw FILE_NOT_FOUND for missing files', async () => {
      const filePath = join(testDir, 'nonexistent.ts');

      await expect(
        loader.load(filePath, { allowedDirectories: [testDir] })
      ).rejects.toThrow(LoaderError);

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
      } catch (e) {
        expect((e as LoaderError).code).toBe('FILE_NOT_FOUND');
      }
    });
  });
});
