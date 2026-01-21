import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DoclingLoader } from '../../src/loaders/docling-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

// Mock global fetch
const mockFetch = vi.fn() as Mock;
vi.stubGlobal('fetch', mockFetch);

describe('DoclingLoader', () => {
  let testDir: string;
  let loader: DoclingLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `docling-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new DoclingLoader({
      baseUrl: 'http://localhost:5001',
      timeout: 5000,
    });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // ============================================================================
  // Properties
  // ============================================================================

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('DoclingLoader');
    });

    it('should support .pdf and .docx extensions', () => {
      expect(loader.supportedFormats).toContain('.pdf');
      expect(loader.supportedFormats).toContain('.docx');
    });
  });

  // ============================================================================
  // canLoad
  // ============================================================================

  describe('canLoad', () => {
    it('should return true for .pdf files', () => {
      expect(loader.canLoad('document.pdf')).toBe(true);
      expect(loader.canLoad('/path/to/file.pdf')).toBe(true);
    });

    it('should return true for .docx files', () => {
      expect(loader.canLoad('document.docx')).toBe(true);
      expect(loader.canLoad('/path/to/file.docx')).toBe(true);
    });

    it('should be case-insensitive for file paths', () => {
      expect(loader.canLoad('file.PDF')).toBe(true);
      expect(loader.canLoad('file.DOCX')).toBe(true);
      expect(loader.canLoad('file.Pdf')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(loader.canLoad('file.txt')).toBe(false);
      expect(loader.canLoad('file.doc')).toBe(false); // Legacy Word format
      expect(loader.canLoad('file.pptx')).toBe(false);
    });

    it('should detect PDF from buffer magic bytes', () => {
      const validPdf = Buffer.from('%PDF-1.4 content...');
      expect(loader.canLoad(validPdf)).toBe(true);
    });

    it('should detect DOCX from buffer magic bytes (ZIP)', () => {
      // DOCX files are ZIP archives starting with PK
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      expect(loader.canLoad(zipHeader)).toBe(true);
    });

    it('should reject non-PDF/DOCX buffers', () => {
      const textBuffer = Buffer.from('Hello, World!');
      expect(loader.canLoad(textBuffer)).toBe(false);

      const shortBuffer = Buffer.from('%PDF');
      expect(loader.canLoad(shortBuffer)).toBe(false);
    });
  });

  // ============================================================================
  // isAvailable
  // ============================================================================

  describe('isAvailable', () => {
    it('should return true when service responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const available = await loader.isAvailable();

      expect(available).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/health',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when service returns non-200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const available = await loader.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false when service is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      const available = await loader.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false on timeout', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const available = await loader.isAvailable();

      expect(available).toBe(false);
    });
  });

  // ============================================================================
  // load from file
  // ============================================================================

  describe('load from file', () => {
    it('should load and parse a PDF file', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: {
            md_content: '# Test Document\n\nThis is content from Docling.',
            metadata: {
              title: 'Test Document',
              author: 'Test Author',
              page_count: 5,
            },
          },
        }),
      });

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 mock content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('# Test Document\n\nThis is content from Docling.');
      expect(docs[0].source).toBe(filePath);
      expect(docs[0].metadata.title).toBe('Test Document');
      expect(docs[0].metadata.author).toBe('Test Author');
      expect(docs[0].metadata.pageCount).toBe(5);
      expect(docs[0].metadata.mimeType).toBe('application/pdf');
      expect(docs[0].metadata.extractedBy).toBe('docling');
    });

    it('should load and parse a DOCX file', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: {
            md_content: '# Word Document\n\nContent from DOCX.',
            metadata: {},
          },
        }),
      });

      const filePath = join(testDir, 'test.docx');
      // Write ZIP header (DOCX is a ZIP file)
      await writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('content')]));

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('# Word Document\n\nContent from DOCX.');
      expect(docs[0].metadata.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('should extract word count from content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: {
            md_content: 'One two three four five',
            metadata: {},
          },
        }),
      });

      const filePath = join(testDir, 'words.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(5);
    });

    it('should generate deterministic document ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          document: {
            md_content: 'Same content',
            metadata: {},
          },
        }),
      });

      const filePath = join(testDir, 'doc.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs1 = await loader.load(filePath, { allowedDirectories: [testDir] });
      const docs2 = await loader.load(filePath, { allowedDirectories: [testDir] });

      expect(typeof docs1[0].id).toBe('string');
      expect(docs1[0].id.length).toBe(16);
      expect(docs1[0].id).toBe(docs2[0].id);
    });

    it('should extract dates from metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: {
            md_content: 'Content',
            metadata: {
              created: '2024-01-15T12:00:00Z',
              modified: '2024-01-20T15:00:00Z',
            },
          },
        }),
      });

      const filePath = join(testDir, 'dated.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      const docs = await loader.load(filePath, { allowedDirectories: [testDir] });

      expect(docs[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(docs[0].metadata.modifiedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // load from buffer
  // ============================================================================

  describe('load from buffer', () => {
    it('should load PDF from buffer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: {
            md_content: 'Buffer content',
            metadata: {},
          },
        }),
      });

      const buffer = Buffer.from('%PDF-1.4 content');
      const docs = await loader.load(buffer);

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe('Buffer content');
      expect(docs[0].source).toBe('buffer');
    });

    it('should infer PDF filename for buffer with PDF magic bytes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: { md_content: 'Content', metadata: {} },
        }),
      });

      const pdfBuffer = Buffer.from('%PDF-1.4 content');
      await loader.load(pdfBuffer);

      // Check that FormData was created with correct filename
      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1].body as FormData;
      const file = body.get('file') as File;
      expect(file.name).toBe('document.pdf');
    });

    it('should infer DOCX filename for buffer with ZIP magic bytes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: { md_content: 'Content', metadata: {} },
        }),
      });

      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('content')]);
      await loader.load(zipBuffer);

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1].body as FormData;
      const file = body.get('file') as File;
      expect(file.name).toBe('document.docx');
    });
  });

  // ============================================================================
  // Error handling
  // ============================================================================

  describe('error handling', () => {
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

    it('should throw SERVICE_UNAVAILABLE on connection error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LoaderError);
        expect((e as LoaderError).code).toBe('SERVICE_UNAVAILABLE');
        expect((e as LoaderError).message).toContain('Cannot connect to Docling service');
      }
    });

    it('should throw SERVICE_UNAVAILABLE on timeout', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LoaderError);
        expect((e as LoaderError).code).toBe('SERVICE_UNAVAILABLE');
        expect((e as LoaderError).message).toContain('timeout');
      }
    });

    it('should throw SERVICE_UNAVAILABLE on 5xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service temporarily unavailable',
      });

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LoaderError);
        expect((e as LoaderError).code).toBe('SERVICE_UNAVAILABLE');
      }
    });

    it('should throw PARSE_ERROR on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid document format',
      });

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LoaderError);
        expect((e as LoaderError).code).toBe('PARSE_ERROR');
        expect((e as LoaderError).message).toContain('rejected document');
      }
    });

    it('should throw PARSE_ERROR on invalid response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      const filePath = join(testDir, 'test.pdf');
      await writeFile(filePath, '%PDF-1.4 content');

      try {
        await loader.load(filePath, { allowedDirectories: [testDir] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LoaderError);
        expect((e as LoaderError).code).toBe('PARSE_ERROR');
        expect((e as LoaderError).message).toContain('missing md_content');
      }
    });
  });

  // ============================================================================
  // Configuration
  // ============================================================================

  describe('configuration', () => {
    it('should use custom baseUrl', async () => {
      const customLoader = new DoclingLoader({
        baseUrl: 'http://custom:9000',
      });

      mockFetch.mockResolvedValueOnce({ ok: true });

      await customLoader.isAvailable();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom:9000/health',
        expect.any(Object)
      );
    });

    it('should use default baseUrl when not configured', () => {
      // Clear any environment variable
      const originalEnv = process.env.DOCLING_API_URL;
      delete process.env.DOCLING_API_URL;

      const defaultLoader = new DoclingLoader();

      // Access private property via any for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((defaultLoader as any).baseUrl).toBe('http://localhost:5001');

      // Restore
      if (originalEnv) {
        process.env.DOCLING_API_URL = originalEnv;
      }
    });

    it('should use environment variable when config not provided', () => {
      const originalEnv = process.env.DOCLING_API_URL;
      process.env.DOCLING_API_URL = 'http://env-url:8080';

      const envLoader = new DoclingLoader();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((envLoader as any).baseUrl).toBe('http://env-url:8080');

      // Restore
      if (originalEnv) {
        process.env.DOCLING_API_URL = originalEnv;
      } else {
        delete process.env.DOCLING_API_URL;
      }
    });

    it('should prefer config over environment variable', () => {
      const originalEnv = process.env.DOCLING_API_URL;
      process.env.DOCLING_API_URL = 'http://env-url:8080';

      const configLoader = new DoclingLoader({
        baseUrl: 'http://config-url:9000',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((configLoader as any).baseUrl).toBe('http://config-url:9000');

      // Restore
      if (originalEnv) {
        process.env.DOCLING_API_URL = originalEnv;
      } else {
        delete process.env.DOCLING_API_URL;
      }
    });
  });
});
