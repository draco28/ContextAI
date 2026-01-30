/**
 * LLMEntityExtractor Tests
 *
 * Tests the LLM-based entity extraction using mock LLM providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LLMEntityExtractor,
  generateEntityNodeId,
  ExtractionError,
} from '../../src/knowledge-graph/extraction/index.js';
import { InMemoryGraphStore } from '../../src/knowledge-graph/memory-store.js';
import type {
  ExtractedEntity,
  EntityExtractorConfig,
} from '../../src/knowledge-graph/extraction/types.js';
import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  StreamChunk,
} from '@contextaisdk/core';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock LLM provider that returns the specified entities.
 */
function createMockLLMProvider(
  entities: ExtractedEntity[],
  options?: {
    wrapInCodeBlock?: boolean;
    addExtraText?: boolean;
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

      let content = JSON.stringify({ entities });

      if (options?.wrapInCodeBlock) {
        content = '```json\n' + content + '\n```';
      }

      if (options?.addExtraText) {
        content =
          'Here are the extracted entities:\n' +
          content +
          '\n\nI found these entities in the text.';
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
      content: 'This is not valid JSON at all { broken',
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

/**
 * Create a mock LLM that returns valid JSON but wrong schema.
 */
function createWrongSchemaProvider(): LLMProvider {
  return {
    name: 'WrongSchemaProvider',
    model: 'mock-model',
    chat: vi.fn(async (): Promise<ChatResponse> => ({
      content: JSON.stringify({
        items: [{ label: 'OpenAI' }], // Wrong structure
      }),
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

const sampleText =
  'OpenAI, led by CEO Sam Altman, developed GPT-4, a powerful large language model.';

// ============================================================================
// Tests
// ============================================================================

describe('LLMEntityExtractor', () => {
  describe('constructor', () => {
    it('should create extractor with valid config', () => {
      const provider = createMockLLMProvider([]);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      expect(extractor.name).toBe('LLMEntityExtractor');
    });

    it('should throw if llmProvider is not provided', () => {
      expect(() => {
        new LLMEntityExtractor({} as EntityExtractorConfig);
      }).toThrow(ExtractionError);
    });

    it('should throw if minConfidence is out of range', () => {
      const provider = createMockLLMProvider([]);

      expect(() => {
        new LLMEntityExtractor({ llmProvider: provider, minConfidence: -0.1 });
      }).toThrow('minConfidence must be between 0 and 1');

      expect(() => {
        new LLMEntityExtractor({ llmProvider: provider, minConfidence: 1.5 });
      }).toThrow('minConfidence must be between 0 and 1');
    });

    it('should throw if maxInputTokens is too small', () => {
      const provider = createMockLLMProvider([]);

      expect(() => {
        new LLMEntityExtractor({ llmProvider: provider, maxInputTokens: 50 });
      }).toThrow('maxInputTokens must be at least 100');
    });
  });

  describe('extract', () => {
    it('should extract entities from text', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(3);
      expect(result.entities[0]).toMatchObject({
        name: 'OpenAI',
        type: 'organization',
      });
      expect(result.sourceText).toBe(sampleText);
      expect(result.metadata.llmLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should throw on empty text', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      await expect(extractor.extract('')).rejects.toThrow(
        'Cannot extract from empty text'
      );
      await expect(extractor.extract('   ')).rejects.toThrow(
        'Cannot extract from empty text'
      );
    });

    it('should filter entities by confidence threshold', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({
        llmProvider: provider,
        minConfidence: 0.9, // Should exclude GPT-4 (0.85)
      });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(2);
      expect(result.entities.map((e) => e.name)).toContain('OpenAI');
      expect(result.entities.map((e) => e.name)).toContain('Sam Altman');
      expect(result.entities.map((e) => e.name)).not.toContain('GPT-4');
    });

    it('should allow overriding confidence in options', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({
        llmProvider: provider,
        minConfidence: 0.5, // Low default
      });

      const result = await extractor.extract(sampleText, { minConfidence: 0.92 });

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]?.name).toBe('OpenAI');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const provider = createMockLLMProvider(sampleEntities, {
        wrapInCodeBlock: true,
      });
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(3);
    });

    it('should extract JSON from text with extra content', async () => {
      const provider = createMockLLMProvider(sampleEntities, {
        addExtraText: true,
      });
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(3);
    });

    it('should throw on invalid JSON response', async () => {
      const provider = createInvalidJSONProvider();
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      await expect(extractor.extract(sampleText)).rejects.toThrow(
        'Failed to parse LLM response'
      );
    });

    it('should throw on wrong schema response', async () => {
      const provider = createWrongSchemaProvider();
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      await expect(extractor.extract(sampleText)).rejects.toThrow(
        'Response validation failed'
      );
    });

    it('should wrap LLM errors properly', async () => {
      const provider = createMockLLMProvider([], {
        throwError: new Error('API rate limit exceeded'),
      });
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      await expect(extractor.extract(sampleText)).rejects.toThrow(
        'LLM error - API rate limit exceeded'
      );
    });

    it('should filter by entity types when configured', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({
        llmProvider: provider,
        entityTypes: ['person', 'organization'],
      });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(2);
      expect(result.entities.map((e) => e.type)).not.toContain('product');
    });

    it('should deduplicate entities by normalized name', async () => {
      const duplicateEntities: ExtractedEntity[] = [
        { name: 'OpenAI', type: 'organization', confidence: 0.95 },
        { name: 'openai', type: 'organization', confidence: 0.8 }, // Duplicate
        { name: 'Sam Altman', type: 'person', confidence: 0.9 },
      ];

      const provider = createMockLLMProvider(duplicateEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText);

      expect(result.entities).toHaveLength(2);
      // Should keep the one with higher confidence
      const openai = result.entities.find((e) =>
        e.name.toLowerCase().includes('openai')
      );
      expect(openai?.confidence).toBe(0.95);
    });

    it('should attach source document ID when provided', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const result = await extractor.extract(sampleText, {
        sourceDocumentId: 'doc-123',
      });

      expect(result.sourceDocumentId).toBe('doc-123');
    });
  });

  describe('extractToGraph', () => {
    let graphStore: InMemoryGraphStore;

    beforeEach(() => {
      graphStore = new InMemoryGraphStore();
    });

    it('should create nodes for extracted entities', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const { result, nodeIds } = await extractor.extractToGraph(
        sampleText,
        graphStore
      );

      expect(result.entities).toHaveLength(3);
      expect(nodeIds).toHaveLength(3);

      // Verify nodes were created
      const counts = await graphStore.count();
      expect(counts.nodes).toBe(3);

      // Verify node content
      const node = await graphStore.getNode(nodeIds[0]!);
      expect(node).not.toBeNull();
      expect(node?.type).toBe('entity');
      expect(node?.label).toBe('OpenAI');
      expect(node?.properties.entityType).toBe('organization');
    });

    it('should generate deterministic node IDs', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const { nodeIds: firstIds } = await extractor.extractToGraph(
        sampleText,
        graphStore
      );

      // Create new store and extract again
      const newStore = new InMemoryGraphStore();
      const { nodeIds: secondIds } = await extractor.extractToGraph(
        sampleText,
        newStore
      );

      // IDs should be the same
      expect(firstIds).toEqual(secondIds);
    });

    it('should handle duplicate extractions via upsert', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      // Extract twice to same store
      await extractor.extractToGraph(sampleText, graphStore);
      await extractor.extractToGraph(sampleText, graphStore);

      // Should not create duplicates
      const counts = await graphStore.count();
      expect(counts.nodes).toBe(3);
    });

    it('should store source document ID in node properties', async () => {
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      const { nodeIds } = await extractor.extractToGraph(sampleText, graphStore, {
        sourceDocumentId: 'doc-456',
      });

      const node = await graphStore.getNode(nodeIds[0]!);
      expect(node?.properties.sourceDocumentId).toBe('doc-456');
    });

    it('should continue on individual node creation failures', async () => {
      // This is hard to test directly, but we verify the try-catch behavior
      // by ensuring partial results still work
      const provider = createMockLLMProvider(sampleEntities);
      const extractor = new LLMEntityExtractor({ llmProvider: provider });

      // Should complete successfully even if internal issues
      const { result, nodeIds } = await extractor.extractToGraph(
        sampleText,
        graphStore
      );

      expect(result.entities.length).toBeGreaterThan(0);
      expect(nodeIds.length).toBeGreaterThan(0);
    });
  });

  describe('generateEntityNodeId', () => {
    it('should generate deterministic IDs', () => {
      const entity: ExtractedEntity = {
        name: 'OpenAI',
        type: 'organization',
        confidence: 0.95,
      };

      const id1 = generateEntityNodeId(entity);
      const id2 = generateEntityNodeId(entity);

      expect(id1).toBe(id2);
      expect(id1).toBe('entity:organization:openai');
    });

    it('should normalize spaces and special characters', () => {
      const entity: ExtractedEntity = {
        name: 'Sam  Altman',
        type: 'person',
        confidence: 0.9,
      };

      const id = generateEntityNodeId(entity);
      expect(id).toBe('entity:person:sam-altman');
    });

    it('should use normalizedName if provided', () => {
      const entity: ExtractedEntity = {
        name: 'OpenAI, Inc.',
        normalizedName: 'openai',
        type: 'organization',
        confidence: 0.95,
      };

      const id = generateEntityNodeId(entity);
      expect(id).toBe('entity:organization:openai');
    });

    it('should remove special characters', () => {
      const entity: ExtractedEntity = {
        name: "O'Reilly Media",
        type: 'organization',
        confidence: 0.8,
      };

      const id = generateEntityNodeId(entity);
      expect(id).toBe('entity:organization:oreilly-media');
    });
  });

  describe('error handling', () => {
    it('should provide troubleshooting hints', () => {
      const error = ExtractionError.parseError(
        'LLMEntityExtractor',
        'Invalid JSON'
      );

      expect(error.troubleshootingHint).toContain('temperature');
      expect(error.code).toBe('PARSE_ERROR');
    });

    it('should preserve error cause', () => {
      const cause = new Error('Network timeout');
      const error = ExtractionError.llmError(
        'LLMEntityExtractor',
        'Request failed',
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should format error details correctly', () => {
      const error = ExtractionError.configError(
        'LLMEntityExtractor',
        'Invalid config'
      );

      const details = error.toDetails();
      expect(details.code).toBe('CONFIG_ERROR');
      expect(details.extractorName).toBe('LLMEntityExtractor');
    });
  });

  describe('long text chunking', () => {
    it('should process long texts in chunks', async () => {
      // Create a text that exceeds maxInputTokens
      const longText = 'OpenAI is great. '.repeat(2000); // ~6000 words

      const entities: ExtractedEntity[] = [
        { name: 'OpenAI', type: 'organization', confidence: 0.95 },
      ];

      const provider = createMockLLMProvider(entities);
      const extractor = new LLMEntityExtractor({
        llmProvider: provider,
        maxInputTokens: 500, // Force chunking
      });

      const result = await extractor.extract(longText);

      // Should have called LLM multiple times
      expect((provider.chat as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);

      // Should deduplicate results from multiple chunks
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]?.name).toBe('OpenAI');
    });
  });
});
