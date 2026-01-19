/**
 * Context Assembler Tests
 *
 * Tests for XMLAssembler and MarkdownAssembler implementations.
 */

import { describe, it, expect } from 'vitest';
import type { RerankerResult } from '../../src/reranker/types.js';
import type { Chunk } from '../../src/vector-store/types.js';
import { XMLAssembler } from '../../src/assembly/xml-assembler.js';
import { MarkdownAssembler } from '../../src/assembly/markdown-assembler.js';
import { AssemblyError } from '../../src/assembly/errors.js';

// Helper to create mock chunks
function createChunk(
  id: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Chunk {
  return {
    id,
    content,
    metadata,
    documentId: metadata.documentId as string | undefined,
  };
}

// Helper to create mock reranker results
function createResult(
  id: string,
  score: number,
  content: string,
  metadata: Record<string, unknown> = {}
): RerankerResult {
  return {
    id,
    chunk: createChunk(id, content, metadata),
    score,
    originalRank: 1,
    newRank: 1,
    scores: { originalScore: score, rerankerScore: score },
  };
}

describe('XMLAssembler', () => {
  describe('basic assembly', () => {
    it('assembles results into XML format', async () => {
      const assembler = new XMLAssembler();
      const results = [
        createResult('1', 0.9, 'First chunk content'),
        createResult('2', 0.8, 'Second chunk content'),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('<sources>');
      expect(assembled.content).toContain('</sources>');
      expect(assembled.content).toContain('<source');
      expect(assembled.content).toContain('id="1"');
      expect(assembled.content).toContain('First chunk content');
      expect(assembled.content).toContain('Second chunk content');
    });

    it('returns empty structure for empty results', async () => {
      const assembler = new XMLAssembler();
      const assembled = await assembler.assemble([]);

      expect(assembled.content).toBe('<sources>\n</sources>');
      expect(assembled.chunkCount).toBe(0);
      expect(assembled.sources).toHaveLength(0);
    });

    it('escapes XML special characters', async () => {
      const assembler = new XMLAssembler();
      const results = [
        createResult('1', 0.9, 'Content with <tags> & "quotes"'),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('&lt;tags&gt;');
      expect(assembled.content).toContain('&amp;');
      expect(assembled.content).not.toContain('<tags>');
    });

    it('includes source attribution in attributes', async () => {
      const assembler = new XMLAssembler();
      const results = [
        createResult('1', 0.9, 'Content', {
          source: 'docs/auth.md',
          pageNumber: 5,
          section: 'Authentication',
        }),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('file="docs/auth.md"');
      expect(assembled.content).toContain('location="page 5"');
      expect(assembled.content).toContain('section="Authentication"');
    });
  });

  describe('configuration options', () => {
    it('respects custom tag names', async () => {
      const assembler = new XMLAssembler({
        rootTag: 'context',
        sourceTag: 'doc',
      });
      const results = [createResult('1', 0.9, 'Content')];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('<context>');
      expect(assembled.content).toContain('<doc');
      expect(assembled.content).toContain('</doc>');
      expect(assembled.content).toContain('</context>');
    });

    it('includes scores when configured', async () => {
      const assembler = new XMLAssembler({ includeScores: true });
      const results = [createResult('1', 0.95, 'Content')];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('score="0.950"');
    });

    it('supports compact output (no pretty print)', async () => {
      const assembler = new XMLAssembler({ prettyPrint: false });
      const results = [createResult('1', 0.9, 'Content')];

      const assembled = await assembler.assemble(results);

      // No newlines between elements
      expect(assembled.content).not.toMatch(/<sources>\n\s+<source/);
    });
  });

  describe('ordering and deduplication', () => {
    it('applies sandwich ordering', async () => {
      const assembler = new XMLAssembler({ ordering: 'sandwich' });
      const results = [
        createResult('1', 0.9, 'First'),
        createResult('2', 0.8, 'Second'),
        createResult('3', 0.7, 'Third'),
        createResult('4', 0.6, 'Fourth'),
      ];

      const assembled = await assembler.assemble(results);

      // Check sources order: first two at start, last two reversed
      expect(assembled.sources[0]!.chunkId).toBe('1');
      expect(assembled.sources[1]!.chunkId).toBe('2');
      // 3 and 4 should be reversed: 4, 3
      expect(assembled.sources[2]!.chunkId).toBe('4');
      expect(assembled.sources[3]!.chunkId).toBe('3');
    });

    it('deduplicates similar chunks', async () => {
      const assembler = new XMLAssembler({
        deduplication: { similarityThreshold: 0.8 },
      });
      const results = [
        createResult('1', 0.9, 'the quick brown fox jumps'),
        createResult('2', 0.8, 'the quick brown fox jumps'), // Duplicate
        createResult('3', 0.7, 'completely different content'),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.chunkCount).toBe(2);
      expect(assembled.deduplicatedCount).toBe(1);
    });
  });

  describe('token budget', () => {
    it('respects token budget', async () => {
      const assembler = new XMLAssembler({
        tokenBudget: { maxTokens: 50 },
      });
      const results = [
        createResult('1', 0.9, 'a'.repeat(100)),
        createResult('2', 0.8, 'b'.repeat(100)),
        createResult('3', 0.7, 'c'.repeat(100)),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.estimatedTokens).toBeLessThanOrEqual(60); // Some slack
      expect(assembled.droppedCount).toBeGreaterThan(0);
    });
  });

  describe('assembly options', () => {
    it('applies topK limit', async () => {
      const assembler = new XMLAssembler();
      const results = Array.from({ length: 10 }, (_, i) =>
        createResult(`${i}`, 1 - i * 0.1, `Content ${i}`)
      );

      const assembled = await assembler.assemble(results, { topK: 3 });

      expect(assembled.chunkCount).toBeLessThanOrEqual(3);
    });

    it('adds preamble and postamble', async () => {
      const assembler = new XMLAssembler();
      const results = [createResult('1', 0.9, 'Content')];

      const assembled = await assembler.assemble(results, {
        preamble: 'Use these sources:',
        postamble: 'Now answer the question.',
      });

      expect(assembled.content).toMatch(/^Use these sources:/);
      expect(assembled.content).toMatch(/Now answer the question\.$/);
    });
  });
});

describe('MarkdownAssembler', () => {
  describe('inline citation style', () => {
    it('formats with inline citations', async () => {
      const assembler = new MarkdownAssembler({ citationStyle: 'inline' });
      const results = [
        createResult('1', 0.9, 'First chunk content', { source: 'doc.md' }),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('**[1]**');
      expect(assembled.content).toContain('First chunk content');
      expect(assembled.content).toContain('*(doc.md)*');
    });

    it('includes section headers when available', async () => {
      const assembler = new MarkdownAssembler({
        citationStyle: 'inline',
        includeSectionHeaders: true,
      });
      const results = [
        createResult('1', 0.9, 'Content', { section: 'Authentication' }),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('*Authentication*');
    });
  });

  describe('footnote citation style', () => {
    it('formats with footnotes at end', async () => {
      const assembler = new MarkdownAssembler({ citationStyle: 'footnote' });
      const results = [
        createResult('1', 0.9, 'First content', { source: 'doc1.md' }),
        createResult('2', 0.8, 'Second content', { source: 'doc2.md' }),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('First content [1]');
      expect(assembled.content).toContain('Second content [2]');
      expect(assembled.content).toContain('**Sources:**');
      expect(assembled.content).toContain('[1]: doc1.md');
      expect(assembled.content).toContain('[2]: doc2.md');
    });
  });

  describe('header citation style', () => {
    it('formats with section headers', async () => {
      const assembler = new MarkdownAssembler({ citationStyle: 'header' });
      const results = [
        createResult('1', 0.9, 'First content', { source: 'doc.md' }),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('### Source 1: doc.md');
      expect(assembled.content).toContain('First content');
    });

    it('includes scores when configured', async () => {
      const assembler = new MarkdownAssembler({
        citationStyle: 'header',
        includeScores: true,
      });
      const results = [createResult('1', 0.95, 'Content')];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('Relevance: 95.0%');
    });
  });

  describe('chunk separator', () => {
    it('uses custom separator', async () => {
      const assembler = new MarkdownAssembler({
        chunkSeparator: '\n\n***\n\n',
      });
      const results = [
        createResult('1', 0.9, 'First'),
        createResult('2', 0.8, 'Second'),
      ];

      const assembled = await assembler.assemble(results);

      expect(assembled.content).toContain('***');
    });
  });

  describe('empty results', () => {
    it('returns empty string for no results', async () => {
      const assembler = new MarkdownAssembler();
      const assembled = await assembler.assemble([]);

      expect(assembled.content).toBe('');
      expect(assembled.chunkCount).toBe(0);
    });
  });
});

describe('AssemblyError', () => {
  it('creates invalid input error', () => {
    const error = AssemblyError.invalidInput('TestAssembler', 'empty array');

    expect(error.message).toContain('Invalid input');
    expect(error.message).toContain('empty array');
    expect(error.code).toBe('INVALID_INPUT');
    expect(error.assemblerName).toBe('TestAssembler');
  });

  it('creates token budget exceeded error', () => {
    const error = AssemblyError.tokenBudgetExceeded('XMLAssembler', 'too large');

    expect(error.code).toBe('TOKEN_BUDGET_EXCEEDED');
  });

  it('includes cause when provided', () => {
    const cause = new Error('underlying error');
    const error = AssemblyError.formattingFailed('Assembler', 'failed', cause);

    expect(error.cause).toBe(cause);
  });

  it('converts to details object', () => {
    const error = AssemblyError.configError('Assembler', 'invalid config');
    const details = error.toDetails();

    expect(details.code).toBe('CONFIG_ERROR');
    expect(details.assemblerName).toBe('Assembler');
  });
});

describe('AssembledContext metadata', () => {
  it('provides comprehensive metadata', async () => {
    // Disable deduplication to ensure both chunks are included
    const assembler = new XMLAssembler({
      deduplication: { enabled: false },
    });
    const results = [
      createResult('1', 0.9, 'This is the first unique piece of content about authentication', { source: 'a.md', pageNumber: 1 }),
      createResult('2', 0.8, 'This is completely different content about authorization patterns', { source: 'b.md', pageNumber: 2 }),
    ];

    const assembled = await assembler.assemble(results);

    // Check all metadata fields
    expect(assembled.chunkCount).toBe(2);
    expect(assembled.estimatedTokens).toBeGreaterThan(0);
    expect(assembled.deduplicatedCount).toBe(0);
    expect(assembled.droppedCount).toBe(0);
    expect(assembled.chunks).toHaveLength(2);

    // Check source attributions
    expect(assembled.sources).toHaveLength(2);
    expect(assembled.sources[0]!.index).toBe(1);
    expect(assembled.sources[0]!.source).toBe('a.md');
    expect(assembled.sources[0]!.location).toBe('page 1');
    expect(assembled.sources[0]!.score).toBe(0.9);
  });
});
