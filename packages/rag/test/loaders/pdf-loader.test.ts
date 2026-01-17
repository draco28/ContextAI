import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PDFLoader } from '../../src/loaders/pdf-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

// Mock pdf-parse module
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

describe('PDFLoader', () => {
  let testDir: string;
  let loader: PDFLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `pdf-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new PDFLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('PDFLoader');
    });

    it('should support .pdf extension', () => {
      expect(loader.supportedFormats).toContain('.pdf');
    });
  });

  describe('canLoad', () => {
    it('should return true for .pdf files', () => {
      expect(loader.canLoad('document.pdf')).toBe(true);
      expect(loader.canLoad('/path/to/file.pdf')).toBe(true);
    });

    it('should be case-insensitive for file paths', () => {
      expect(loader.canLoad('file.PDF')).toBe(true);
      expect(loader.canLoad('file.Pdf')).toBe(true);
    });

    it('should return false for non-PDF extensions', () => {
      expect(loader.canLoad('file.txt')).toBe(false);
      expect(loader.canLoad('file.docx')).toBe(false);
    });

    it('should detect PDF from buffer magic bytes', () => {
      const validPdf = Buffer.from('%PDF-1.4...');
      expect(loader.canLoad(validPdf)).toBe(true);
    });

    it('should reject non-PDF buffers', () => {
      const textBuffer = Buffer.from('Hello, World!');
      expect(loader.canLoad(textBuffer)).toBe(false);

      const shortBuffer = Buffer.from('%PDF');
      expect(loader.canLoad(shortBuffer)).toBe(false);
    });
  });

  describe('load from file', () => {
    it('should load and parse a PDF file', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 2,
        text: 'Hello World from PDF',
        info: {
          Title: 'Test Document',
          Author: 'Test Author',
        },
      });

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 mock content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Hello World from PDF');
      expect(docs[0].source).toBe(filePath);
      expect(docs[0].metadata.pageCount).toBe(2);
      expect(docs[0].metadata.title).toBe('Test Document');
      expect(docs[0].metadata.author).toBe('Test Author');
      expect(docs[0].metadata.mimeType).toBe('application/pdf');
    });

    it('should extract word count', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'One two three four five',
        info: {},
      });

      const filePath = join(testDir, 'words.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(5);
    });

    it('should generate document ID', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'Content',
        info: {},
      });

      const filePath = join(testDir, 'id.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(typeof docs[0].id).toBe('string');
      expect(docs[0].id.length).toBe(16);
    });

    it('should throw FILE_NOT_FOUND for missing files', async () => {
      const filePath = join(testDir, 'nonexistent.pdf');

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
      const filePath = join(testDir, 'large.pdf');
      await writeFile(filePath, '%PDF-1.4 ' + 'x'.repeat(200));

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

    it('should throw PARSE_ERROR for invalid PDF content', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockRejectedValue(new Error('Invalid PDF'));

      const filePath = join(testDir, 'invalid.pdf');
      await writeFile(filePath, '%PDF-1.4 invalid content');

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
    it('should load PDF from buffer', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'Buffer content',
        info: {},
      });

      const buffer = Buffer.from('%PDF-1.4 content');
      const docs = await loader.load(buffer);

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Buffer content');
      expect(docs[0].source).toBe('buffer');
      expect(docs[0].metadata.pageCount).toBe(1);
    });

    it('should throw PARSE_ERROR for invalid buffer', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockRejectedValue(new Error('Parse failed'));

      const buffer = Buffer.from('%PDF-1.4 invalid');

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
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'Same content',
        info: {},
      });

      const filePath = join(testDir, 'doc.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs1 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });
      const docs2 = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs1[0].id).toBe(docs2[0].id);
    });
  });

  describe('metadata extraction', () => {
    it('should extract PDF dates', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'Content',
        info: {
          CreationDate: 'D:20240115120000',
          ModDate: 'D:20240120150000',
        },
      });

      const filePath = join(testDir, 'dated.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(docs[0].metadata.modifiedAt).toBeInstanceOf(Date);
    });

    it('should extract creator and producer', async () => {
      const pdfParse = await import('pdf-parse');
      vi.mocked(pdfParse.default).mockResolvedValue({
        numpages: 1,
        text: 'Content',
        info: {
          Creator: 'Microsoft Word',
          Producer: 'Adobe PDF',
        },
      });

      const filePath = join(testDir, 'meta.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.creator).toBe('Microsoft Word');
      expect(docs[0].metadata.producer).toBe('Adobe PDF');
    });
  });
});
