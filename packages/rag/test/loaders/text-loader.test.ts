import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TextLoader } from '../../src/loaders/text-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

describe('TextLoader', () => {
  let testDir: string;
  let loader: TextLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `text-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new TextLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('TextLoader');
    });

    it('should support .txt and .text extensions', () => {
      expect(loader.supportedFormats).toContain('.txt');
      expect(loader.supportedFormats).toContain('.text');
    });
  });

  describe('canLoad', () => {
    it('should return true for .txt files', () => {
      expect(loader.canLoad('document.txt')).toBe(true);
      expect(loader.canLoad('/path/to/file.txt')).toBe(true);
    });

    it('should return true for .text files', () => {
      expect(loader.canLoad('document.text')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(loader.canLoad('file.TXT')).toBe(true);
      expect(loader.canLoad('file.Txt')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(loader.canLoad('file.md')).toBe(false);
      expect(loader.canLoad('file.pdf')).toBe(false);
      expect(loader.canLoad('file.docx')).toBe(false);
    });

    it('should return false for buffers', () => {
      expect(loader.canLoad(Buffer.from('content'))).toBe(false);
    });
  });

  describe('load from file', () => {
    it('should load a text file', async () => {
      const filePath = join(testDir, 'hello.txt');
      await writeFile(filePath, 'Hello, World!');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Hello, World!');
      expect(docs[0].source).toBe(filePath);
    });

    it('should extract word count', async () => {
      const filePath = join(testDir, 'words.txt');
      await writeFile(filePath, 'One two three four five');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(5);
    });

    it('should set mime type to text/plain', async () => {
      const filePath = join(testDir, 'mime.txt');
      await writeFile(filePath, 'Content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.mimeType).toBe('text/plain');
    });

    it('should include file timestamps in metadata', async () => {
      const filePath = join(testDir, 'timestamps.txt');
      await writeFile(filePath, 'Content with timestamps');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(docs[0].metadata.modifiedAt).toBeInstanceOf(Date);
    });

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

    it('should handle empty files', async () => {
      const filePath = join(testDir, 'empty.txt');
      await writeFile(filePath, '');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('');
      expect(docs[0].metadata.wordCount).toBe(0);
    });

    it('should handle multiline content', async () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].content).toBe(content);
      expect(docs[0].metadata.wordCount).toBe(6);
    });

    it('should handle unicode content', async () => {
      const filePath = join(testDir, 'unicode.txt');
      const content = 'Hello 世界 🌍 émoji';
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].content).toBe(content);
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
          maxFileSize: 100,
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

    it('should extract word count from buffer', async () => {
      const buffer = Buffer.from('One two three');

      const docs = await loader.load(buffer);

      expect(docs[0].metadata.wordCount).toBe(3);
    });

    it('should not include file timestamps for buffer', async () => {
      const buffer = Buffer.from('No timestamps');

      const docs = await loader.load(buffer);

      expect(docs[0].metadata.createdAt).toBeUndefined();
      expect(docs[0].metadata.modifiedAt).toBeUndefined();
    });
  });
});
