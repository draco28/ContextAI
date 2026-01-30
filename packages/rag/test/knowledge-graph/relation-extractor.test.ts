/**
 * LLMRelationExtractor Tests
 *
 * Tests the LLM-based relation extraction using mock LLM providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LLMRelationExtractor,
  ExtractionError,
} from '../../src/knowledge-graph/extraction/index.js';
import { InMemoryGraphStore } from '../../src/knowledge-graph/memory-store.js';
import type {
  ExtractedEntity,
  ExtractedRelation,
  RelationExtractorConfig,
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
 * Create a mock LLM provider that returns the specified relations.
 */
function createMockLLMProvider(
  relations: ExtractedRelation[],
  options?: {
    wrapInCodeBlock?: boolean;
    throwError?: Error;
  }
): LLMProvider {
  return {
    name: 'MockLLMProvider',
    model: 'mock-model',

    chat: vi.fn(async (): Promise<ChatResponse> => {
      if (options?.throwError) {
        throw options.throwError;
      }

      let content = JSON.stringify({ relations });

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
 * Create a mock LLM that returns invalid JSON.
 */
function createInvalidJSONProvider(): LLMProvider {
  return {
    name: 'InvalidJSONProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => ({
      content: 'This is not valid JSON',
      finishReason: 'stop',
    })),
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

describe('LLMRelationExtractor', () => {
  describe('constructor', () => {
    it('should create extractor with valid config', () => {
      const provider = createMockLLMProvider([]);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      expect(extractor.name).toBe('LLMRelationExtractor');
    });

    it('should throw if llmProvider is not provided', () => {
      expect(() => {
        new LLMRelationExtractor({} as RelationExtractorConfig);
      }).toThrow(ExtractionError);
    });

    it('should throw if minConfidence is out of range', () => {
      const provider = createMockLLMProvider([]);

      expect(() => {
        new LLMRelationExtractor({ llmProvider: provider, minConfidence: -0.1 });
      }).toThrow('minConfidence must be between 0 and 1');

      expect(() => {
        new LLMRelationExtractor({ llmProvider: provider, minConfidence: 1.5 });
      }).toThrow('minConfidence must be between 0 and 1');
    });
  });

  describe('extract', () => {
    it('should extract relations from text', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, sampleEntities);

      expect(result.relations).toHaveLength(2);
      expect(result.relations[0]).toMatchObject({
        sourceName: 'Sam Altman',
        targetName: 'OpenAI',
        relationType: 'relatedTo',
      });
      expect(result.sourceText).toBe(sampleText);
    });

    it('should return empty array when fewer than 2 entities', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, [sampleEntities[0]!]);

      expect(result.relations).toHaveLength(0);
      // Should not have called the LLM
      expect(provider.chat).not.toHaveBeenCalled();
    });

    it('should throw on empty text', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      await expect(extractor.extract('', sampleEntities)).rejects.toThrow(
        'Cannot extract from empty text'
      );
    });

    it('should filter relations by confidence threshold', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({
        llmProvider: provider,
        minConfidence: 0.88, // Should exclude the second relation (0.85)
      });

      const result = await extractor.extract(sampleText, sampleEntities);

      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]?.sourceName).toBe('Sam Altman');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const provider = createMockLLMProvider(sampleRelations, {
        wrapInCodeBlock: true,
      });
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, sampleEntities);

      expect(result.relations).toHaveLength(2);
    });

    it('should throw on invalid JSON response', async () => {
      const provider = createInvalidJSONProvider();
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      await expect(
        extractor.extract(sampleText, sampleEntities)
      ).rejects.toThrow('Failed to parse LLM response');
    });

    it('should filter out relations with unknown entities', async () => {
      const relationsWithUnknown: ExtractedRelation[] = [
        ...sampleRelations,
        {
          sourceName: 'Unknown Person',
          targetName: 'OpenAI',
          relationType: 'relatedTo',
          description: 'Unknown relation',
          confidence: 0.9,
        },
      ];

      const provider = createMockLLMProvider(relationsWithUnknown);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, sampleEntities);

      // Should only have 2 valid relations
      expect(result.relations).toHaveLength(2);
    });

    it('should filter by relation types when configured', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({
        llmProvider: provider,
        relationTypes: ['relatedTo'], // Only relatedTo
      });

      const result = await extractor.extract(sampleText, sampleEntities);

      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]?.relationType).toBe('relatedTo');
    });

    it('should handle case-insensitive entity matching', async () => {
      const relationsWithDifferentCase: ExtractedRelation[] = [
        {
          sourceName: 'sam altman', // lowercase
          targetName: 'OPENAI', // uppercase
          relationType: 'relatedTo',
          description: 'Relation with different case',
          confidence: 0.9,
        },
      ];

      const provider = createMockLLMProvider(relationsWithDifferentCase);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, sampleEntities);

      expect(result.relations).toHaveLength(1);
    });
  });

  describe('extractToGraph', () => {
    let graphStore: InMemoryGraphStore;
    let entityNodeMap: Map<string, string>;

    beforeEach(async () => {
      graphStore = new InMemoryGraphStore();

      // Create nodes for entities
      entityNodeMap = new Map();
      for (const entity of sampleEntities) {
        const nodeId = await graphStore.addNode({
          type: 'entity',
          label: entity.name,
          properties: { entityType: entity.type },
        });
        entityNodeMap.set(entity.name, nodeId);
      }
    });

    it('should create edges for extracted relations', async () => {
      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const { result, edgeIds } = await extractor.extractToGraph(
        sampleText,
        sampleEntities,
        graphStore,
        entityNodeMap
      );

      expect(result.relations).toHaveLength(2);
      expect(edgeIds).toHaveLength(2);

      // Verify edges were created
      const counts = await graphStore.count();
      expect(counts.edges).toBe(2);

      // Verify edge content
      const edge = await graphStore.getEdge(edgeIds[0]!);
      expect(edge).not.toBeNull();
      expect(edge?.type).toBe('relatedTo');
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

      const provider = createMockLLMProvider(bidirectionalRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const { edgeIds } = await extractor.extractToGraph(
        sampleText,
        sampleEntities,
        graphStore,
        entityNodeMap
      );

      // Should have 2 edges (forward and reverse)
      expect(edgeIds).toHaveLength(2);

      const counts = await graphStore.count();
      expect(counts.edges).toBe(2);
    });

    it('should skip relations with missing nodes', async () => {
      // Use a map missing one entity
      const incompleteNodeMap = new Map<string, string>();
      incompleteNodeMap.set('OpenAI', 'node-1');
      // Sam Altman is missing

      const provider = createMockLLMProvider(sampleRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const { edgeIds } = await extractor.extractToGraph(
        sampleText,
        sampleEntities,
        graphStore,
        incompleteNodeMap
      );

      // Only one relation should succeed (OpenAI -> GPT-4 requires GPT-4 which is also missing)
      expect(edgeIds.length).toBeLessThan(2);
    });

    it('should handle case-insensitive node map lookup', async () => {
      const caseDifferentRelations: ExtractedRelation[] = [
        {
          sourceName: 'openai', // lowercase
          targetName: 'gpt-4', // lowercase
          relationType: 'contains',
          description: 'Contains',
          confidence: 0.9,
        },
      ];

      // Create a fresh graph store for this test
      const caseGraphStore = new InMemoryGraphStore();

      // Create nodes with specific IDs
      await caseGraphStore.addNode({
        id: 'node-openai',
        type: 'entity',
        label: 'OpenAI',
        properties: {},
      });
      await caseGraphStore.addNode({
        id: 'node-gpt4',
        type: 'entity',
        label: 'GPT-4',
        properties: {},
      });

      // Create node map with original case
      const caseNodeMap = new Map<string, string>();
      caseNodeMap.set('OpenAI', 'node-openai');
      caseNodeMap.set('GPT-4', 'node-gpt4');

      const provider = createMockLLMProvider(caseDifferentRelations);
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      const { edgeIds } = await extractor.extractToGraph(
        sampleText,
        sampleEntities,
        caseGraphStore,
        caseNodeMap
      );

      expect(edgeIds).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should wrap LLM errors properly', async () => {
      const provider = createMockLLMProvider([], {
        throwError: new Error('API rate limit exceeded'),
      });
      const extractor = new LLMRelationExtractor({ llmProvider: provider });

      await expect(
        extractor.extract(sampleText, sampleEntities)
      ).rejects.toThrow('LLM error - API rate limit exceeded');
    });
  });
});
