import { describe, it, expect } from 'vitest';
import {
  isMultimodalContent,
  isTextContent,
  isImageContent,
  isDocumentContent,
  normalizeContent,
  extractTextContent,
} from '../src/provider/content';
import type { ContentPart, MessageContent } from '../src/provider/types';

describe('Content Type Guards', () => {
  describe('isMultimodalContent', () => {
    it('returns false for string content', () => {
      expect(isMultimodalContent('Hello world')).toBe(false);
    });

    it('returns true for array content', () => {
      const content: ContentPart[] = [{ type: 'text', text: 'Hello' }];
      expect(isMultimodalContent(content)).toBe(true);
    });

    it('returns true for empty array', () => {
      expect(isMultimodalContent([])).toBe(true);
    });
  });

  describe('isTextContent', () => {
    it('returns true for text content part', () => {
      expect(isTextContent({ type: 'text', text: 'Hello' })).toBe(true);
    });

    it('returns false for image content part', () => {
      expect(
        isTextContent({ type: 'image', url: 'https://example.com/img.png' })
      ).toBe(false);
    });

    it('returns false for document content part', () => {
      expect(
        isTextContent({ type: 'document', url: 'https://example.com/doc.pdf' })
      ).toBe(false);
    });
  });

  describe('isImageContent', () => {
    it('returns true for image content part', () => {
      expect(
        isImageContent({ type: 'image', url: 'https://example.com/img.png' })
      ).toBe(true);
    });

    it('returns true for base64 image', () => {
      expect(
        isImageContent({
          type: 'image',
          base64: 'abc123',
          mediaType: 'image/png',
        })
      ).toBe(true);
    });

    it('returns false for text content part', () => {
      expect(isImageContent({ type: 'text', text: 'Hello' })).toBe(false);
    });
  });

  describe('isDocumentContent', () => {
    it('returns true for document content part', () => {
      expect(
        isDocumentContent({
          type: 'document',
          url: 'https://example.com/doc.pdf',
        })
      ).toBe(true);
    });

    it('returns false for text content part', () => {
      expect(isDocumentContent({ type: 'text', text: 'Hello' })).toBe(false);
    });
  });
});

describe('Content Helpers', () => {
  describe('normalizeContent', () => {
    it('wraps string in TextContentPart array', () => {
      const result = normalizeContent('Hello world');
      expect(result).toEqual([{ type: 'text', text: 'Hello world' }]);
    });

    it('returns array content unchanged', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'Hello' },
        { type: 'image', url: 'https://example.com/img.png' },
      ];
      const result = normalizeContent(content);
      expect(result).toBe(content); // Same reference
    });

    it('handles empty string', () => {
      const result = normalizeContent('');
      expect(result).toEqual([{ type: 'text', text: '' }]);
    });
  });

  describe('extractTextContent', () => {
    it('returns string content directly', () => {
      expect(extractTextContent('Hello world')).toBe('Hello world');
    });

    it('extracts text from single text part', () => {
      const content: ContentPart[] = [{ type: 'text', text: 'Hello' }];
      expect(extractTextContent(content)).toBe('Hello');
    });

    it('concatenates multiple text parts', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world' },
      ];
      expect(extractTextContent(content)).toBe('Hello world');
    });

    it('ignores non-text parts', () => {
      const content: ContentPart[] = [
        { type: 'text', text: 'Hello ' },
        { type: 'image', url: 'https://example.com/img.png' },
        { type: 'text', text: 'world' },
      ];
      expect(extractTextContent(content)).toBe('Hello world');
    });

    it('returns empty string for content with no text parts', () => {
      const content: ContentPart[] = [
        { type: 'image', url: 'https://example.com/img.png' },
      ];
      expect(extractTextContent(content)).toBe('');
    });

    it('returns empty string for empty array', () => {
      expect(extractTextContent([])).toBe('');
    });
  });
});

describe('Backward Compatibility', () => {
  it('ChatMessage accepts string content', () => {
    // This is a type-level test - if it compiles, it passes
    const message: { role: 'user'; content: MessageContent } = {
      role: 'user',
      content: 'Hello world',
    };
    expect(message.content).toBe('Hello world');
  });

  it('ChatMessage accepts ContentPart[] content', () => {
    const message: { role: 'user'; content: MessageContent } = {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image:' },
        { type: 'image', url: 'https://example.com/img.png', detail: 'high' },
      ],
    };
    expect(Array.isArray(message.content)).toBe(true);
  });
});
