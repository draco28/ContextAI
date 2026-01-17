import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DocxLoader } from '../../src/loaders/docx-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

// Mock mammoth module
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

describe('DocxLoader', () => {
  let testDir: string;
  let loader: DocxLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `docx-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new DocxLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('DocxLoader');
    });

    it('should support .docx extension', () => {
      expect(loader.supportedFormats).toContain('.docx');
    });
  });

  describe('canLoad', () => {
    it('should return true for .docx files', () => {
      expect(loader.canLoad('document.docx')).toBe(true);
      expect(loader.canLoad('/path/to/file.docx')).toBe(true);
    });

    it('should be case-insensitive for file paths', () => {
      expect(loader.canLoad('file.DOCX')).toBe(true);
      expect(loader.canLoad('file.Docx')).toBe(true);
    });

    it('should return false for non-DOCX extensions', () => {
      expect(loader.canLoad('file.txt')).toBe(false);
      expect(loader.canLoad('file.pdf')).toBe(false);
      expect(loader.canLoad('file.doc')).toBe(false); // Legacy format not supported
    });

    it('should detect DOCX from buffer magic bytes (ZIP format)', () => {
      // DOCX files are ZIP archives starting with PK
      const validDocx = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('rest of file')]);
      expect(loader.canLoad(validDocx)).toBe(true);
    });

    it('should reject non-DOCX buffers', () => {
      const textBuffer = Buffer.from('Hello, World!');
      expect(loader.canLoad(textBuffer)).toBe(false);

      const pdfBuffer = Buffer.from('%PDF-1.4');
      expect(loader.canLoad(pdfBuffer)).toBe(false);
    });
  });

  describe('load from file', () => {
    it('should load and parse a DOCX file', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Hello World from DOCX',
        messages: [],
      });

      const filePath = join(testDir, 'test.docx');
      // Write mock DOCX content (starts with PK for ZIP)
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Hello World from DOCX');
      expect(docs[0].source).toBe(filePath);
      expect(docs[0].metadata.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should extract word count', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'One two three four five',
        messages: [],
      });

      const filePath = join(testDir, 'words.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(5);
    });

    it('should generate document ID', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Content',
        messages: [],
      });

      const filePath = join(testDir, 'id.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(typeof docs[0].id).toBe('string');
      expect(docs[0].id.length).toBe(16);
    });

    it('should handle mammoth warnings without failing', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Content with warnings',
        messages: [{ type: 'warning', message: 'Some warning' }],
      });

      const filePath = join(testDir, 'warnings.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Content with warnings');
    });

    it('should throw FILE_NOT_FOUND for missing files', async () => {
      const filePath = join(testDir, 'nonexistent.docx');

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
      const filePath = join(testDir, 'large.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.alloc(200)]));

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

    it('should throw PARSE_ERROR for invalid DOCX content', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockRejectedValue(
        new Error('Could not find file in zip: word/document.xml')
      );

      const filePath = join(testDir, 'invalid.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      await expect(
        loader.load(filePath, { allowedDirectories: [testDir] })
      ).rejects.toThrow(LoaderError);

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
      } catch (e) {
        expect((e as LoaderError).code).toBe('PARSE_ERROR');
      }
    });
  });

  describe('load from buffer', () => {
    it('should load DOCX from buffer', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Buffer content',
        messages: [],
      });

      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const docs = await loader.load(buffer);

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Buffer content');
      expect(docs[0].source).toBe('buffer');
    });

    it('should throw PARSE_ERROR for invalid buffer', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockRejectedValue(
        new Error('Parse failed')
      );

      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

      await expect(loader.load(buffer)).rejects.toThrow(LoaderError);

      try {
        await loader.load(buffer);
      } catch (e) {
        expect((e as LoaderError).code).toBe('PARSE_ERROR');
      }
    });
  });

  describe('ID generation', () => {
    it('should generate deterministic IDs for same file', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Same content',
        messages: [],
      });

      const filePath = join(testDir, 'doc.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs1 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });
      const docs2 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs1[0].id).toBe(docs2[0].id);
    });
  });

  describe('content trimming', () => {
    it('should trim whitespace from extracted content', async () => {
      const mammoth = await import('mammoth');
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: '  \n  Content with whitespace  \n  ',
        messages: [],
      });

      const filePath = join(testDir, 'trim.docx');
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].content).toBe('Content with whitespace');
    });
  });
});
