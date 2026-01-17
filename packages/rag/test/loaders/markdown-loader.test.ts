import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MarkdownLoader } from '../../src/loaders/markdown-loader.js';
import { LoaderError } from '../../src/loaders/errors.js';

describe('MarkdownLoader', () => {
  let testDir: string;
  let loader: MarkdownLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `markdown-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new MarkdownLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('MarkdownLoader');
    });

    it('should support .md and .markdown extensions', () => {
      expect(loader.supportedFormats).toContain('.md');
      expect(loader.supportedFormats).toContain('.markdown');
    });
  });

  describe('canLoad', () => {
    it('should return true for .md files', () => {
      expect(loader.canLoad('document.md')).toBe(true);
      expect(loader.canLoad('/path/to/README.md')).toBe(true);
    });

    it('should return true for .markdown files', () => {
      expect(loader.canLoad('document.markdown')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(loader.canLoad('file.MD')).toBe(true);
      expect(loader.canLoad('file.Markdown')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(loader.canLoad('file.txt')).toBe(false);
      expect(loader.canLoad('file.pdf')).toBe(false);
    });
  });

  describe('load without frontmatter', () => {
    it('should load plain markdown content', async () => {
      const filePath = join(testDir, 'plain.md');
      const content = '# Hello World\n\nThis is content.';
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs).toHaveLength(1);
      expect(docs[0].content).toBe(content);
    });

    it('should set mime type to text/markdown', async () => {
      const filePath = join(testDir, 'mime.md');
      await writeFile(filePath, '# Content');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.mimeType).toBe('text/markdown');
    });

    it('should extract word count', async () => {
      const filePath = join(testDir, 'words.md');
      await writeFile(filePath, '# Title\n\nOne two three four five');

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.wordCount).toBe(7); // # Title + 5 words
    });
  });

  describe('load with frontmatter', () => {
    it('should extract title from frontmatter', async () => {
      const filePath = join(testDir, 'titled.md');
      const content = `---
title: My Document
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.title).toBe('My Document');
    });

    it('should extract author from frontmatter', async () => {
      const filePath = join(testDir, 'authored.md');
      const content = `---
author: Jane Doe
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.author).toBe('Jane Doe');
    });

    it('should extract date as createdAt', async () => {
      const filePath = join(testDir, 'dated.md');
      const content = `---
date: 2024-01-15
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(docs[0].metadata.createdAt?.toISOString()).toContain('2024-01-15');
    });

    it('should extract created field as createdAt', async () => {
      const filePath = join(testDir, 'created.md');
      const content = `---
created: 2024-02-20
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.createdAt?.toISOString()).toContain('2024-02-20');
    });

    it('should extract modified/updated as modifiedAt', async () => {
      const filePath = join(testDir, 'modified.md');
      const content = `---
modified: 2024-03-10
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.modifiedAt?.toISOString()).toContain('2024-03-10');
    });

    it('should preserve custom frontmatter fields', async () => {
      const filePath = join(testDir, 'custom.md');
      const content = `---
title: My Doc
tags:
  - typescript
  - sdk
category: tutorial
draft: false
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].metadata.tags).toEqual(['typescript', 'sdk']);
      expect(docs[0].metadata.category).toBe('tutorial');
      expect(docs[0].metadata.draft).toBe(false);
    });

    it('should strip frontmatter from content', async () => {
      const filePath = join(testDir, 'stripped.md');
      const content = `---
title: Title
---
# Actual Content

This is the body.`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].content).toBe('# Actual Content\n\nThis is the body.');
      expect(docs[0].content).not.toContain('---');
      expect(docs[0].content).not.toContain('title: Title');
    });

    it('should handle empty frontmatter', async () => {
      const filePath = join(testDir, 'empty-fm.md');
      const content = `---
---
# Content`;
      await writeFile(filePath, content);

      const docs = await loader.load(filePath, {
        allowedDirectories: [testDir],
      });

      expect(docs[0].content).toBe('# Content');
    });
  });

  describe('load from buffer', () => {
    it('should load markdown with frontmatter from buffer', async () => {
      const buffer = Buffer.from(`---
title: Buffer Doc
---
# Hello`);

      const docs = await loader.load(buffer);

      expect(docs).toHaveLength(1);
      expect(docs[0].metadata.title).toBe('Buffer Doc');
      expect(docs[0].content).toBe('# Hello');
      expect(docs[0].source).toBe('buffer');
    });

    it('should not include file timestamps for buffer', async () => {
      const buffer = Buffer.from('# No timestamps');

      const docs = await loader.load(buffer);

      // Only frontmatter dates would be present, file stats are not
      expect(docs[0].metadata.createdAt).toBeUndefined();
    });
  });

  describe('ID generation', () => {
    it('should generate deterministic IDs', async () => {
      const filePath = join(testDir, 'deterministic.md');
      await writeFile(filePath, '# Same content');

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
      const filePath = join(testDir, 'nonexistent.md');

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
