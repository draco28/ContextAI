/**
 * LLMKnowledgeExtractor Tests
 *
 * Tests the combined entity and relation extraction using mock LLM providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LLMKnowledgeExtractor,
  ExtractionError,
} from '../../src/knowledge-graph/extraction/index.js';
import { InMemoryGraphStore } from '../../src/knowledge-graph/memory-store.js';
import type {
  ExtractedEntity,
  ExtractedRelation,
  KnowledgeExtractorConfig,
} from '../../src/knowledge-graph/extraction/types.js';
import type {
  LLMProvider,
  ChatResponse,
  StreamChunk,
} from '@contextaisdk/core';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock LLM provider that returns combined entities and relations.
 */
function createMockLLMProvider(
  entities: ExtractedEntity[],
  relations: ExtractedRelation[],
  options?: {
    wrapInCodeBlock?: boolean;
    throwError?: Error;
    failOnFirstCall?: boolean;
  }
): LLMProvider {
  let callCount = 0;

  return {
    name: 'MockLLMProvider',
    model: 'mock-model',

    chat: vi.fn(async (): Promise<ChatResponse> => {
      callCount++;

      if (options?.throwError) {
        throw options.throwError;
      }

      // Fail on first call to test fallback
      if (options?.failOnFirstCall && callCount === 1) {
        return {
          content: 'Invalid JSON response',
          finishReason: 'stop',
        };
      }

      let content = JSON.stringify({ entities, relations });

      if (options?.wrapInCodeBlock) {
        content = '```json\n' + content + '\n```';
      }

      return {
        content,
        finishReason: 'stop',
      };
    }),

    streamChat: vi.fn(async function* (): AsyncGenerator<
      StreamChunk,
      void,
      unknown
    > {
      yield { type: 'done' };
    }),

    isAvailable: vi.fn(async () => true),
  };
}

/**
 * Create a mock LLM that returns entity-only response for fallback testing.
 */
function createFallbackMockProvider(): LLMProvider {
  let callCount = 0;

  const entities: ExtractedEntity[] = [
    { name: 'OpenAI', type: 'organization', confidence: 0.95 },
  ];

  const relations: ExtractedRelation[] = [];

  return {
    name: 'FallbackMockProvider',
    model: 'mock-model',

    chat: vi.fn(async (): Promise<ChatResponse> => {
      callCount++;

      // First call (combined) fails
      if (callCount === 1) {
        return {
          content: 'This is not valid JSON for combined extraction',
          finishReason: 'stop',
        };
      }

      // Subsequent calls (fallback) succeed with entity-only response
      return {
        content: JSON.stringify({ entities }),
        finishReason: 'stop',
      };
    }),

    streamChat: vi.fn(async function* (): AsyncGenerator<
      StreamChunk,
      void,
      unknown
    > {
      yield { type: 'done' };
    }),

    isAvailable: vi.fn(async () => true),
  };
}

// ============================================================================
// Sample Test Data
// ============================================================================

const sampleEntities: ExtractedEntity[] = [
  {
    name: 'OpenAI',
    type: 'organization',
    description: 'AI research company',
    confidence: 0.95,
  },
  {
    name: 'Sam Altman',
    type: 'person',
    description: 'CEO of OpenAI',
    confidence: 0.9,
  },
  {
    name: 'GPT-4',
    type: 'product',
    description: 'Large language model',
    confidence: 0.85,
  },
];

const sampleRelations: ExtractedRelation[] = [
  {
    sourceName: 'Sam Altman',
    targetName: 'OpenAI',
    relationType: 'relatedTo',
    description: 'Sam Altman is the CEO of OpenAI',
    confidence: 0.9,
    bidirectional: false,
  },
  {
    sourceName: 'OpenAI',
    targetName: 'GPT-4',
    relationType: 'contains',
    description: 'OpenAI developed GPT-4',
    confidence: 0.85,
    bidirectional: false,
  },
];

const sampleText =
  'OpenAI, led by CEO Sam Altman, developed GPT-4, a powerful large language model.';

// ============================================================================
// Tests
// ============================================================================

describe('LLMKnowledgeExtractor', () => {
  describe('constructor', () => {
    it('should create extractor with valid config', () => {
      const provider = createMockLLMProvider([], []);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      expect(extractor.name).toBe('LLMKnowledgeExtractor');
    });

    it('should throw if llmProvider is not provided', () => {
      expect(() => {
        new LLMKnowledgeExtractor({} as KnowledgeExtractorConfig);
      }).toThrow(ExtractionError);
    });

    it('should throw if confidence values are out of range', () => {
      const provider = createMockLLMProvider([], []);

      expect(() => {
        new LLMKnowledgeExtractor({
          llmProvider: provider,
          minEntityConfidence: -0.1,
        });
      }).toThrow('minEntityConfidence must be between 0 and 1');

      expect(() => {
        new LLMKnowledgeExtractor({
          llmProvider: provider,
          minRelationConfidence: 1.5,
        });
      }).toThrow('minRelationConfidence must be between 0 and 1');
    });

    it('should throw if maxInputTokens is too small', () => {
      const provider = createMockLLMProvider([], []);

      expect(() => {
        new LLMKnowledgeExtractor({
          llmProvider: provider,
          maxInputTokens: 50,
        });
      }).toThrow('maxInputTokens must be at least 100');
    });
  });

  describe('extract', () => {
    it('should extract both entities and relations', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(3);
      expect(result.relations).toHaveLength(2);
      expect(result.sourceText).toBe(sampleText);
      expect(result.metadata.llmLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should throw on empty text', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      await expect(extractor.extract('')).rejects.toThrow(
        'Cannot extract from empty text'
      );
    });

    it('should filter entities by confidence threshold', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        minEntityConfidence: 0.88, // Should exclude GPT-4 (0.85)
      });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(2);
      expect(result.entities.map((e) => e.name)).not.toContain('GPT-4');
    });

    it('should filter relations by confidence threshold', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        minRelationConfidence: 0.88, // Should exclude second relation (0.85)
      });

      const result = await extractor.extract(sampleText);

      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]?.sourceName).toBe('Sam Altman');
    });

    it('should filter out relations referencing filtered entities', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        minEntityConfidence: 0.88, // Filters out GPT-4
      });

      const result = await extractor.extract(sampleText);

      // The relation OpenAI -> GPT-4 should be filtered because GPT-4 is gone
      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]?.targetName).not.toBe('GPT-4');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations, {
        wrapInCodeBlock: true,
      });
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(3);
      expect(result.relations).toHaveLength(2);
    });

    it('should deduplicate entities', async () => {
      const duplicateEntities: ExtractedEntity[] = [
        { name: 'OpenAI', type: 'organization', confidence: 0.95 },
        { name: 'openai', type: 'organization', confidence: 0.8 }, // Duplicate
      ];

      const provider = createMockLLMProvider(duplicateEntities, []);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]?.confidence).toBe(0.95);
    });

    it('should filter by entity types when configured', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        entityTypes: ['person', 'organization'],
      });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(2);
      expect(result.entities.map((e) => e.type)).not.toContain('product');
    });

    it('should filter by relation types when configured', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        relationTypes: ['relatedTo'],
      });

      const result = await extractor.extract(sampleText);

      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]?.relationType).toBe('relatedTo');
    });

    it('should fall back to separate extraction on parse failure', async () => {
      const provider = createFallbackMockProvider();
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        fallbackToSeparate: true,
      });

      const result = await extractor.extract(sampleText);

      // Should have extracted entities via fallback
      expect(result.entities.length).toBeGreaterThanOrEqual(1);
      // LLM should have been called multiple times (combined + entity + relation)
      expect((provider.chat as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
    });

    it('should throw without fallback when disabled', async () => {
      const provider = createFallbackMockProvider();
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        fallbackToSeparate: false,
      });

      await expect(extractor.extract(sampleText)).rejects.toThrow(
        'Failed to parse LLM response'
      );
    });
  });

  describe('extractToGraph', () => {
    let graphStore: InMemoryGraphStore;

    beforeEach(() => {
      graphStore = new InMemoryGraphStore();
    });

    it('should create nodes and edges', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const { result, nodeIds, edgeIds } = await extractor.extractToGraph(
        sampleText,
        graphStore
      );

      expect(result.entities).toHaveLength(3);
      expect(result.relations).toHaveLength(2);
      expect(nodeIds).toHaveLength(3);
      expect(edgeIds).toHaveLength(2);

      // Verify counts
      const counts = await graphStore.count();
      expect(counts.nodes).toBe(3);
      expect(counts.edges).toBe(2);
    });

    it('should handle duplicate extractions via upsert', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      // Extract twice
      await extractor.extractToGraph(sampleText, graphStore);
      await extractor.extractToGraph(sampleText, graphStore);

      // Nodes should not be duplicated (upsert)
      const counts = await graphStore.count();
      expect(counts.nodes).toBe(3);
      // Edges may be duplicated since we don't have upsert for edges
      expect(counts.edges).toBeGreaterThanOrEqual(2);
    });

    it('should store source document ID in node properties', async () => {
      const provider = createMockLLMProvider(sampleEntities, sampleRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const { nodeIds } = await extractor.extractToGraph(
        sampleText,
        graphStore,
        { sourceDocumentId: 'doc-123' }
      );

      const node = await graphStore.getNode(nodeIds[0]!);
      expect(node?.properties.sourceDocumentId).toBe('doc-123');
    });

    it('should create reverse edges for bidirectional relations', async () => {
      const bidirectionalRelations: ExtractedRelation[] = [
        {
          sourceName: 'OpenAI',
          targetName: 'GPT-4',
          relationType: 'similarTo',
          description: 'They are similar',
          confidence: 0.8,
          bidirectional: true,
        },
      ];

      const provider = createMockLLMProvider(sampleEntities, bidirectionalRelations);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const { edgeIds } = await extractor.extractToGraph(sampleText, graphStore);

      // Should have 2 edges (forward and reverse)
      expect(edgeIds).toHaveLength(2);

      const counts = await graphStore.count();
      expect(counts.edges).toBe(2);
    });

    it('should skip relations with missing entities', async () => {
      const relationsWithMissing: ExtractedRelation[] = [
        ...sampleRelations,
        {
          sourceName: 'Unknown Entity',
          targetName: 'OpenAI',
          relationType: 'relatedTo',
          description: 'Unknown relation',
          confidence: 0.9,
        },
      ];

      const provider = createMockLLMProvider(sampleEntities, relationsWithMissing);
      const extractor = new LLMKnowledgeExtractor({ llmProvider: provider });

      const { result, edgeIds } = await extractor.extractToGraph(
        sampleText,
        graphStore
      );

      // The relation with unknown entity should be filtered during extraction
      expect(result.relations).toHaveLength(2);
      expect(edgeIds).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors properly', async () => {
      const provider = createMockLLMProvider([], [], {
        throwError: new Error('API rate limit exceeded'),
      });
      const extractor = new LLMKnowledgeExtractor({
        llmProvider: provider,
        fallbackToSeparate: false,
      });

      await expect(extractor.extract(sampleText)).rejects.toThrow(
        'LLM error - API rate limit exceeded'
      );
    });
  });
});
