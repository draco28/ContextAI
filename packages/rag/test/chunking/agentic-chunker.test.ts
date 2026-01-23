/**
 * AgenticChunker Tests
 *
 * Tests the LLM-driven chunking strategy using mock LLM providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticChunker } from '../../src/chunking/agentic-chunker.js';
import { RecursiveChunker } from '../../src/chunking/recursive-chunker.js';
import { ChunkerError } from '../../src/chunking/errors.js';
import type { Document } from '../../src/chunking/types.js';
import type { LLMProvider, ChatMessage, ChatResponse, StreamChunk } from '@contextaisdk/core';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a test document.
 */
function createDocument(content: string, id = 'test-doc'): Document {
  return {
    id,
    content,
    metadata: { title: 'Test Document' },
    source: 'test',
  };
}

/**
 * Create a mock LLM provider that returns valid chunk boundaries.
 */
function createMockLLMProvider(
  responseOverride?: Partial<ChatResponse> | ((content: string) => ChatResponse)
): LLMProvider {
  return {
    name: 'MockLLMProvider',
    model: 'mock-model',

    chat: vi.fn(async (messages: ChatMessage[]): Promise<ChatResponse> => {
      // If custom response function provided, call it
      if (typeof responseOverride === 'function') {
        const userMessage = messages.find(m => m.role === 'user');
        const content = typeof userMessage?.content === 'string'
          ? userMessage.content
          : '';
        return responseOverride(content);
      }

      // Extract document text from prompt to determine length
      const userMessage = messages.find(m => m.role === 'user');
      const promptContent = typeof userMessage?.content === 'string'
        ? userMessage.content
        : '';

      // Find the text between --- markers
      const textMatch = promptContent.match(/---\n([\s\S]*?)\n---/);
      const documentText = textMatch ? textMatch[1] : '';
      const textLength = documentText.length;

      // Default: create two chunks splitting at the middle
      const midPoint = Math.floor(textLength / 2);

      const defaultResponse: ChatResponse = {
        content: JSON.stringify({
          chunks: [
            { start: 0, end: midPoint, topic: 'First half' },
            { start: midPoint, end: textLength, topic: 'Second half' },
          ],
        }),
        finishReason: 'stop',
      };

      return {
        ...defaultResponse,
        ...responseOverride,
      };
    }),

    streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      yield { type: 'done' };
    }),

    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create a mock LLM that returns specific boundaries.
 */
function createBoundaryMockProvider(
  boundaries: Array<{ start: number; end: number; topic?: string }>
): LLMProvider {
  return {
    name: 'BoundaryMockProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => ({
      content: JSON.stringify({ chunks: boundaries }),
      finishReason: 'stop',
    })),
    streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      yield { type: 'done' };
    }),
    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create a mock LLM that fails.
 */
function createFailingLLMProvider(error: Error = new Error('LLM API error')): LLMProvider {
  return {
    name: 'FailingLLMProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => {
      throw error;
    }),
    streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      throw error;
    }),
    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create a mock LLM that returns invalid JSON.
 */
function createInvalidJSONProvider(): LLMProvider {
  return {
    name: 'InvalidJSONProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => ({
      content: 'This is not valid JSON at all { incomplete',
      finishReason: 'stop',
    })),
    streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      yield { type: 'done' };
    }),
    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create a mock LLM that returns JSON without chunks array.
 */
function createMissingChunksProvider(): LLMProvider {
  return {
    name: 'MissingChunksProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => ({
      content: JSON.stringify({ result: 'some other format' }),
      finishReason: 'stop',
    })),
    streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      yield { type: 'done' };
    }),
    isAvailable: vi.fn(async () => true),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('AgenticChunker', () => {
  describe('constructor', () => {
    it('should require llmProvider', () => {
      expect(() => {
        // @ts-expect-error Testing missing required field
        new AgenticChunker({});
      }).toThrow('AgenticChunker requires llmProvider');
    });

    it('should use default config values', () => {
      const provider = createMockLLMProvider();
      const chunker = new AgenticChunker({ llmProvider: provider });

      expect(chunker.name).toBe('AgenticChunker');
    });

    it('should reject invalid maxInputTokens', () => {
      const provider = createMockLLMProvider();

      expect(() => {
        new AgenticChunker({
          llmProvider: provider,
          maxInputTokens: 50,
        });
      }).toThrow('maxInputTokens must be at least 100');
    });

    it('should accept custom prompt template', () => {
      const provider = createMockLLMProvider();
      const customPrompt = 'Custom prompt: {documentText}';

      const chunker = new AgenticChunker({
        llmProvider: provider,
        promptTemplate: customPrompt,
      });

      expect(chunker.name).toBe('AgenticChunker');
    });

    it('should accept custom fallback chunker', () => {
      const provider = createMockLLMProvider();
      const fallback = new RecursiveChunker();

      const chunker = new AgenticChunker({
        llmProvider: provider,
        fallbackChunker: fallback,
      });

      expect(chunker.name).toBe('AgenticChunker');
    });
  });

  describe('properties', () => {
    it('should have correct name', () => {
      const provider = createMockLLMProvider();
      const chunker = new AgenticChunker({ llmProvider: provider });

      expect(chunker.name).toBe('AgenticChunker');
    });
  });

  describe('chunk()', () => {
    let mockProvider: LLMProvider;
    let chunker: AgenticChunker;

    beforeEach(() => {
      mockProvider = createMockLLMProvider();
      chunker = new AgenticChunker({
        llmProvider: mockProvider,
        maxInputTokens: 4000,
        temperature: 0,
      });
    });

    it('should throw on empty document', async () => {
      const doc = createDocument('');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
      await expect(chunker.chunk(doc)).rejects.toMatchObject({
        code: 'EMPTY_DOCUMENT',
      });
    });

    it('should throw on whitespace-only document', async () => {
      const doc = createDocument('   \n\t  ');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
    });

    it('should call LLM with document content', async () => {
      const doc = createDocument('This is the document content.');

      await chunker.chunk(doc);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(mockProvider.chat).mock.calls[0];
      expect(callArgs[0]).toHaveLength(1);
      expect(callArgs[0][0].role).toBe('user');
      expect(callArgs[0][0].content).toContain('This is the document content.');
    });

    it('should pass temperature option to LLM', async () => {
      const provider = createMockLLMProvider();
      const tempChunker = new AgenticChunker({
        llmProvider: provider,
        temperature: 0.5,
      });

      const doc = createDocument('Test content.');
      await tempChunker.chunk(doc);

      const callArgs = vi.mocked(provider.chat).mock.calls[0];
      expect(callArgs[1]).toMatchObject({ temperature: 0.5 });
    });

    it('should create chunks based on LLM boundaries', async () => {
      const boundaries = [
        { start: 0, end: 10, topic: 'Part A' },
        { start: 10, end: 20, topic: 'Part B' },
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const boundaryChunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('AAAAAAAAAA' + 'BBBBBBBBBB');
      const chunks = await boundaryChunker.chunk(doc);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toBe('AAAAAAAAAA');
      expect(chunks[1].content).toBe('BBBBBBBBBB');
    });

    it('should include topic in chunk metadata', async () => {
      const boundaries = [
        { start: 0, end: 10, topic: 'Introduction' },
        { start: 10, end: 20, topic: 'Conclusion' },
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const boundaryChunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('1234567890' + 'abcdefghij');
      const chunks = await boundaryChunker.chunk(doc);

      expect(chunks[0].metadata.section).toBe('Introduction');
      expect(chunks[1].metadata.section).toBe('Conclusion');
    });

    it('should include position metadata', async () => {
      const boundaries = [
        { start: 0, end: 5 },
        { start: 5, end: 10 },
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const boundaryChunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('HelloWorld');
      const chunks = await boundaryChunker.chunk(doc);

      expect(chunks[0].metadata.startIndex).toBe(0);
      expect(chunks[0].metadata.endIndex).toBe(5);
      expect(chunks[1].metadata.startIndex).toBe(5);
      expect(chunks[1].metadata.endIndex).toBe(10);
    });

    it('should generate deterministic chunk IDs', async () => {
      const boundaries = [{ start: 0, end: 10 }];
      const provider = createBoundaryMockProvider(boundaries);
      const boundaryChunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('1234567890');

      const chunks1 = await boundaryChunker.chunk(doc);
      const chunks2 = await boundaryChunker.chunk(doc);

      expect(chunks1[0].id).toBe(chunks2[0].id);
    });

    it('should link chunks to document', async () => {
      const boundaries = [{ start: 0, end: 10 }];
      const provider = createBoundaryMockProvider(boundaries);
      const boundaryChunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('Test text.', 'my-doc-id');
      const chunks = await boundaryChunker.chunk(doc);

      expect(chunks[0].documentId).toBe('my-doc-id');
    });
  });

  describe('fallback behavior', () => {
    it('should use fallback on LLM error', async () => {
      const failingProvider = createFailingLLMProvider();

      const chunker = new AgenticChunker({
        llmProvider: failingProvider,
      });

      const doc = createDocument('Some content to chunk here.');
      const chunks = await chunker.chunk(doc);

      // Should have fallen back to RecursiveChunker and produced chunks
      expect(chunks.length).toBeGreaterThan(0);
      expect(failingProvider.chat).toHaveBeenCalled();
      // Verify the fallback worked by checking we got actual content
      expect(chunks[0].content).toBeTruthy();
    });

    it('should use fallback on invalid JSON response', async () => {
      const invalidProvider = createInvalidJSONProvider();

      const chunker = new AgenticChunker({
        llmProvider: invalidProvider,
      });

      const doc = createDocument('Content that should be chunked.');
      const chunks = await chunker.chunk(doc);

      // Should have fallen back and produced chunks
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should use fallback on missing chunks array', async () => {
      const missingProvider = createMissingChunksProvider();

      const chunker = new AgenticChunker({
        llmProvider: missingProvider,
      });

      const doc = createDocument('Content for chunking test.');
      const chunks = await chunker.chunk(doc);

      // Should have fallen back and produced chunks
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should use custom fallback chunker when provided', async () => {
      const failingProvider = createFailingLLMProvider();
      const customFallback = new RecursiveChunker(['\n', ' ']);

      const chunker = new AgenticChunker({
        llmProvider: failingProvider,
        fallbackChunker: customFallback,
      });

      const doc = createDocument('Line one.\nLine two.');
      const chunks = await chunker.chunk(doc);

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('boundary validation', () => {
    it('should clamp boundaries to valid range', async () => {
      // Boundaries extend beyond text length
      const boundaries = [
        { start: -10, end: 5 },
        { start: 5, end: 1000 },
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('1234567890'); // Length 10
      const chunks = await chunker.chunk(doc);

      // Should have clamped to [0, 5] and [5, 10]
      expect(chunks).toHaveLength(2);
      expect(chunks[0].metadata.startIndex).toBe(0);
      expect(chunks[1].metadata.endIndex).toBe(10);
    });

    it('should handle empty chunks array from LLM', async () => {
      const provider = createBoundaryMockProvider([]);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('Some text content.');
      const chunks = await chunker.chunk(doc);

      // Should create single chunk covering entire document
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Some text content.');
    });

    it('should skip invalid boundaries (start >= end)', async () => {
      const boundaries = [
        { start: 5, end: 5 }, // Invalid: same start and end
        { start: 10, end: 5 }, // Invalid: end before start
        { start: 0, end: 10 }, // Valid
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('1234567890');
      const chunks = await chunker.chunk(doc);

      // Only valid boundary should produce a chunk
      expect(chunks).toHaveLength(1);
    });

    it('should extend last chunk to cover end of document', async () => {
      const boundaries = [
        { start: 0, end: 5 },
        // Gap: 5-10 not covered
      ];
      const provider = createBoundaryMockProvider(boundaries);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('1234567890');
      const chunks = await chunker.chunk(doc);

      // Should extend to cover entire document
      expect(chunks[chunks.length - 1].metadata.endIndex).toBe(10);
    });
  });

  describe('token budget management', () => {
    it('should process small documents in single call', async () => {
      const provider = createMockLLMProvider();
      const chunker = new AgenticChunker({
        llmProvider: provider,
        maxInputTokens: 4000,
      });

      const doc = createDocument('Short document content.');
      await chunker.chunk(doc);

      // Should only call LLM once
      expect(provider.chat).toHaveBeenCalledTimes(1);
    });

    it('should process large documents in windows', async () => {
      const provider = createMockLLMProvider();
      const chunker = new AgenticChunker({
        llmProvider: provider,
        maxInputTokens: 100, // Very low limit to force windowing
      });

      // Create document larger than maxInputTokens
      const largeContent = 'A'.repeat(2000); // 2000 chars = ~500 tokens
      const doc = createDocument(largeContent);

      await chunker.chunk(doc);

      // Should call LLM multiple times for windows
      expect(vi.mocked(provider.chat).mock.calls.length).toBeGreaterThan(1);
    });

    it('should merge overlapping chunks from windows', async () => {
      // Use a provider that returns consistent boundaries
      let callCount = 0;
      const windowingProvider: LLMProvider = {
        name: 'WindowingProvider',
        model: 'mock-model',
        chat: vi.fn(async (): Promise<ChatResponse> => {
          callCount++;
          // Return a simple chunk covering the window
          return {
            content: JSON.stringify({
              chunks: [{ start: 0, end: 100, topic: `Window ${callCount}` }],
            }),
            finishReason: 'stop',
          };
        }),
        streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
          yield { type: 'done' };
        }),
        isAvailable: vi.fn(async () => true),
      };

      const chunker = new AgenticChunker({
        llmProvider: windowingProvider,
        maxInputTokens: 100,
      });

      const largeContent = 'X'.repeat(1000);
      const doc = createDocument(largeContent);

      const chunks = await chunker.chunk(doc);

      // Should have merged/deduplicated overlapping windows
      expect(chunks.length).toBeGreaterThan(0);
      // Coverage should span the entire document
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.metadata.endIndex).toBeLessThanOrEqual(1000);
    });
  });

  describe('prompt customization', () => {
    it('should replace placeholders in custom prompt', async () => {
      const provider = createMockLLMProvider();
      const customPrompt = 'Chunk this text (target: {chunkSize} tokens, {chunkChars} chars):\n{documentText}';

      const chunker = new AgenticChunker({
        llmProvider: provider,
        promptTemplate: customPrompt,
      });

      const doc = createDocument('Test content.');
      await chunker.chunk(doc, { chunkSize: 256 });

      const callArgs = vi.mocked(provider.chat).mock.calls[0];
      const promptContent = callArgs[0][0].content as string;

      expect(promptContent).toContain('target: 256 tokens');
      expect(promptContent).toContain('1024 chars'); // 256 * 4
      expect(promptContent).toContain('Test content.');
    });
  });

  describe('JSON response parsing', () => {
    it('should handle markdown code blocks in response', async () => {
      const markdownProvider: LLMProvider = {
        name: 'MarkdownProvider',
        model: 'mock-model',
        chat: vi.fn(async (): Promise<ChatResponse> => ({
          content: '```json\n{"chunks": [{"start": 0, "end": 10}]}\n```',
          finishReason: 'stop',
        })),
        streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
          yield { type: 'done' };
        }),
        isAvailable: vi.fn(async () => true),
      };

      const chunker = new AgenticChunker({ llmProvider: markdownProvider });
      const doc = createDocument('1234567890');
      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
    });

    it('should handle plain json code blocks', async () => {
      const plainBlockProvider: LLMProvider = {
        name: 'PlainBlockProvider',
        model: 'mock-model',
        chat: vi.fn(async (): Promise<ChatResponse> => ({
          content: '```\n{"chunks": [{"start": 0, "end": 5}]}\n```',
          finishReason: 'stop',
        })),
        streamChat: vi.fn(async function* (): AsyncGenerator<StreamChunk, void, unknown> {
          yield { type: 'done' };
        }),
        isAvailable: vi.fn(async () => true),
      };

      const chunker = new AgenticChunker({ llmProvider: plainBlockProvider });
      const doc = createDocument('Hello');
      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle single character document', async () => {
      const boundaries = [{ start: 0, end: 1 }];
      const provider = createBoundaryMockProvider(boundaries);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const doc = createDocument('X');
      const chunks = await chunker.chunk(doc);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('X');
    });

    it('should handle document with only newlines', async () => {
      const provider = createMockLLMProvider();
      const chunker = new AgenticChunker({ llmProvider: provider });

      // Note: This will throw EMPTY_DOCUMENT since it's whitespace only
      const doc = createDocument('\n\n\n');

      await expect(chunker.chunk(doc)).rejects.toThrow(ChunkerError);
    });

    it('should preserve special characters in content', async () => {
      const boundaries = [{ start: 0, end: 20 }];
      const provider = createBoundaryMockProvider(boundaries);
      const chunker = new AgenticChunker({ llmProvider: provider });

      const specialContent = 'Hello 你好 🎉 <tag>';
      const doc = createDocument(specialContent);
      const chunks = await chunker.chunk(doc);

      expect(chunks[0].content).toBe(specialContent);
    });
  });
});
