/**
 * retrieve_knowledge Tool Tests
 *
 * Tests for the RAG integration tool that allows agents to
 * search a knowledge base.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRetrieveKnowledgeTool,
  type RAGEngineInterface,
  type RetrieveKnowledgeOutput,
} from '../../src/tools/retrieve-knowledge.js';

// ============================================================================
// Mock RAG Engine
// ============================================================================

function createMockRAGEngine(
  overrides: Partial<{
    content: string;
    sources: RAGEngineInterface extends { search: infer F }
      ? F extends (...args: unknown[]) => Promise<infer R>
        ? R extends { sources: infer S }
          ? S
          : never
        : never
      : never;
    error: Error;
  }> = {}
): RAGEngineInterface & { search: ReturnType<typeof vi.fn> } {
  const defaultSources = [
    { index: 1, chunkId: 'chunk-1', source: 'docs/auth.md', score: 0.95 },
    { index: 2, chunkId: 'chunk-2', source: 'docs/api.md', score: 0.85 },
  ];

  const mockSearch = vi.fn().mockImplementation(async () => {
    if (overrides.error) {
      throw overrides.error;
    }

    return {
      content: overrides.content ?? '<sources>Mock content</sources>',
      estimatedTokens: 150,
      sources: overrides.sources ?? defaultSources,
      metadata: {
        effectiveQuery: 'enhanced query',
        retrievedCount: 5,
        assembledCount: 2,
        fromCache: false,
        timings: { totalMs: 250 },
      },
    };
  });

  return {
    search: mockSearch,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('createRetrieveKnowledgeTool', () => {
  describe('tool creation', () => {
    it('creates tool with default name and description', () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      expect(tool.name).toBe('retrieve_knowledge');
      expect(tool.description).toContain('Search the knowledge base');
    });

    it('accepts custom name and description', () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine, {
        name: 'search_docs',
        description: 'Custom description',
      });

      expect(tool.name).toBe('search_docs');
      expect(tool.description).toBe('Custom description');
    });

    it('validates input schema', () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      // Valid input
      expect(tool.validate({ query: 'test' }).success).toBe(true);
      expect(tool.validate({ query: 'test', maxResults: 5 }).success).toBe(true);

      // Invalid input - empty query
      expect(tool.validate({ query: '' }).success).toBe(false);

      // Invalid input - maxResults out of range
      expect(tool.validate({ query: 'test', maxResults: 0 }).success).toBe(false);
      expect(tool.validate({ query: 'test', maxResults: 25 }).success).toBe(false);
    });

    it('generates JSON schema for LLM', () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      const json = tool.toJSON();

      expect(json.name).toBe('retrieve_knowledge');
      expect(json.description).toBeDefined();
      expect(json.parameters).toBeDefined();
      expect(json.parameters.type).toBe('object');
    });
  });

  describe('tool execution', () => {
    it('calls RAG engine with query', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      await tool.execute({ query: 'How do I authenticate?' });

      expect(ragEngine.search).toHaveBeenCalledWith(
        'How do I authenticate?',
        expect.objectContaining({
          topK: 5, // default
          enhance: true, // default
          rerank: true, // default
        })
      );
    });

    it('passes maxResults as topK', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      await tool.execute({ query: 'test', maxResults: 10 });

      expect(ragEngine.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ topK: 10 })
      );
    });

    it('passes enhanceQuery option', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      await tool.execute({ query: 'test', enhanceQuery: false });

      expect(ragEngine.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ enhance: false })
      );
    });

    it('passes rerankResults option', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      await tool.execute({ query: 'test', rerankResults: false });

      expect(ragEngine.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ rerank: false })
      );
    });

    it('uses custom defaults', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine, {
        defaultTopK: 10,
        defaultEnhance: false,
        defaultRerank: false,
      });

      await tool.execute({ query: 'test' });

      expect(ragEngine.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          topK: 10,
          enhance: false,
          rerank: false,
        })
      );
    });

    it('passes abort signal from context', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      const controller = new AbortController();
      await tool.execute({ query: 'test' }, { signal: controller.signal });

      // Verify the search was called and a signal was passed
      // Note: The tool wraps the signal in a combined signal (timeout + abort)
      // so we just verify a signal is present, not the exact instance
      expect(ragEngine.search).toHaveBeenCalledTimes(1);
      const callArgs = ragEngine.search.mock.calls[0];
      expect(callArgs?.[0]).toBe('test');
      expect(callArgs?.[1]?.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('tool result', () => {
    it('returns success with formatted output', async () => {
      const ragEngine = createMockRAGEngine({
        content: '<sources>Test content</sources>',
      });
      const tool = createRetrieveKnowledgeTool(ragEngine);

      const result = await tool.execute({ query: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const output = result.data as RetrieveKnowledgeOutput;
      expect(output.context).toBe('<sources>Test content</sources>');
      expect(output.sourceCount).toBe(2);
      expect(output.estimatedTokens).toBe(150);
      expect(output.effectiveQuery).toBe('enhanced query');
      expect(output.searchTimeMs).toBe(250);
      expect(output.fromCache).toBe(false);
    });

    it('maps sources correctly', async () => {
      const ragEngine = createMockRAGEngine({
        sources: [
          { index: 1, chunkId: 'c1', source: 'file.md', score: 0.9 },
          { index: 2, chunkId: 'c2', source: undefined, score: 0.7 },
        ],
      });
      const tool = createRetrieveKnowledgeTool(ragEngine);

      const result = await tool.execute({ query: 'test' });
      const output = result.data as RetrieveKnowledgeOutput;

      expect(output.sources).toHaveLength(2);
      expect(output.sources[0]).toEqual({
        index: 1,
        chunkId: 'c1',
        source: 'file.md',
        relevance: 0.9,
      });
      expect(output.sources[1]).toEqual({
        index: 2,
        chunkId: 'c2',
        source: undefined,
        relevance: 0.7,
      });
    });

    it('returns error on RAG engine failure', async () => {
      const ragEngine = createMockRAGEngine({
        error: new Error('Search failed'),
      });
      const tool = createRetrieveKnowledgeTool(ragEngine);

      const result = await tool.execute({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search failed');
    });

    it('handles non-Error exceptions', async () => {
      const ragEngine = createMockRAGEngine();
      ragEngine.search.mockRejectedValue('string error');

      const tool = createRetrieveKnowledgeTool(ragEngine);
      const result = await tool.execute({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Knowledge retrieval failed');
    });
  });

  describe('input validation in execution', () => {
    it('rejects empty query', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      // This should throw ValidationError
      await expect(tool.execute({ query: '' })).rejects.toThrow();
    });

    it('rejects invalid maxResults', async () => {
      const ragEngine = createMockRAGEngine();
      const tool = createRetrieveKnowledgeTool(ragEngine);

      await expect(tool.execute({ query: 'test', maxResults: -1 })).rejects.toThrow();
      await expect(tool.execute({ query: 'test', maxResults: 100 })).rejects.toThrow();
    });
  });
});

describe('retrieve_knowledge integration', () => {
  it('can be used as a complete tool', async () => {
    // This tests the full flow as an agent would use it
    const ragEngine = createMockRAGEngine({
      content: `<sources>
  <source id="1">To authenticate, use the JWT token in the Authorization header.</source>
  <source id="2">The token expires after 1 hour.</source>
</sources>`,
    });

    const tool = createRetrieveKnowledgeTool(ragEngine);

    // Agent calls the tool
    const result = await tool.execute({
      query: 'How do I authenticate with the API?',
      maxResults: 5,
    });

    // Agent receives structured result
    expect(result.success).toBe(true);
    const output = result.data as RetrieveKnowledgeOutput;
    expect(output.context).toContain('JWT token');
    expect(output.sourceCount).toBeGreaterThan(0);
  });
});
