/**
 * LLM Entity Extractor
 *
 * Extracts named entities from text using an LLM and optionally
 * populates a knowledge graph with the extracted entities.
 *
 * Features:
 * - Configurable entity types to extract
 * - Confidence-based filtering
 * - Automatic graph node creation with deduplication
 * - Handles long texts by chunking
 */

import type { ChatMessage, LLMProvider } from '@contextaisdk/core';
import type { GraphNodeInput, GraphStore } from '../types.js';
import type {
  EntityExtractor,
  EntityExtractorConfig,
  EntityExtractionResult,
  ExtractedEntity,
  ExtractedEntityType,
  ExtractionOptions,
} from './types.js';
import { LLMEntityResponseSchema } from './schemas.js';
import { ExtractionError } from './errors.js';
import {
  DEFAULT_ENTITY_EXTRACTION_PROMPT,
  FILTERED_ENTITY_EXTRACTION_PROMPT,
  formatPrompt,
} from './prompts.js';

// ============================================================================
// Constants
// ============================================================================

/** Approximate characters per token for chunking */
const CHARS_PER_TOKEN = 4;

/** Default configuration values */
const DEFAULT_CONFIG = {
  minConfidence: 0.5,
  temperature: 0,
  maxInputTokens: 4000,
} as const;

// ============================================================================
// Entity Extractor Implementation
// ============================================================================

/**
 * LLM-based entity extractor.
 *
 * Uses an LLM to identify and classify named entities in text.
 * Extracted entities can be filtered by type and confidence,
 * then optionally inserted into a graph store.
 *
 * @example
 * ```typescript
 * const extractor = new LLMEntityExtractor({
 *   llmProvider: new AnthropicProvider({ model: 'claude-sonnet-4-20250514' }),
 *   minConfidence: 0.7,
 *   entityTypes: ['person', 'organization']
 * });
 *
 * // Extract entities
 * const result = await extractor.extract(
 *   "Sam Altman is the CEO of OpenAI."
 * );
 * console.log(result.entities);
 * // [{ name: "Sam Altman", type: "person", ... }, { name: "OpenAI", type: "organization", ... }]
 *
 * // Extract and populate graph
 * const { nodeIds } = await extractor.extractToGraph(text, graphStore);
 * ```
 */
export class LLMEntityExtractor implements EntityExtractor {
  readonly name = 'LLMEntityExtractor';

  private readonly llmProvider: LLMProvider;
  private readonly entityTypes?: ExtractedEntityType[];
  private readonly minConfidence: number;
  private readonly promptTemplate: string;
  private readonly temperature: number;
  private readonly maxInputTokens: number;

  constructor(config: EntityExtractorConfig) {
    if (!config.llmProvider) {
      throw ExtractionError.providerRequired(this.name, 'llmProvider');
    }

    this.llmProvider = config.llmProvider;
    this.entityTypes = config.entityTypes;
    this.minConfidence = config.minConfidence ?? DEFAULT_CONFIG.minConfidence;
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature;
    this.maxInputTokens = config.maxInputTokens ?? DEFAULT_CONFIG.maxInputTokens;

    // Choose prompt based on whether types are filtered
    this.promptTemplate =
      config.promptTemplate ??
      (config.entityTypes && config.entityTypes.length > 0
        ? FILTERED_ENTITY_EXTRACTION_PROMPT
        : DEFAULT_ENTITY_EXTRACTION_PROMPT);

    // Validate configuration
    if (this.minConfidence < 0 || this.minConfidence > 1) {
      throw ExtractionError.configError(
        this.name,
        'minConfidence must be between 0 and 1'
      );
    }

    if (this.maxInputTokens < 100) {
      throw ExtractionError.configError(
        this.name,
        'maxInputTokens must be at least 100'
      );
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Extract entities from text.
   */
  extract = async (
    text: string,
    options?: ExtractionOptions
  ): Promise<EntityExtractionResult> => {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw ExtractionError.emptyText(this.name);
    }

    const startTime = Date.now();
    const minConfidence = options?.minConfidence ?? this.minConfidence;

    // Check if text needs chunking
    const estimatedTokens = Math.ceil(text.length / CHARS_PER_TOKEN);
    let entities: ExtractedEntity[];

    if (estimatedTokens <= this.maxInputTokens) {
      // Single extraction
      entities = await this.extractFromText(text);
    } else {
      // Chunk and merge
      entities = await this.extractFromChunks(text);
    }

    // Filter by confidence
    const filteredEntities = entities.filter((e) => e.confidence >= minConfidence);

    // Deduplicate by normalized name
    const deduplicatedEntities = this.deduplicateEntities(filteredEntities);

    return {
      entities: deduplicatedEntities,
      sourceText: text,
      sourceDocumentId: options?.sourceDocumentId,
      metadata: {
        llmLatencyMs: Date.now() - startTime,
        model: this.llmProvider.model,
      },
    };
  };

  /**
   * Extract entities and populate graph store.
   */
  extractToGraph = async (
    text: string,
    graphStore: GraphStore,
    options?: ExtractionOptions
  ): Promise<{
    result: EntityExtractionResult;
    nodeIds: string[];
  }> => {
    // First extract entities
    const result = await this.extract(text, options);

    // Convert to graph nodes and insert
    const nodeIds: string[] = [];

    for (const entity of result.entities) {
      try {
        const nodeInput = this.entityToNodeInput(entity, options?.sourceDocumentId);
        const nodeId = generateEntityNodeId(entity);

        // Use upsert to handle duplicates gracefully
        await graphStore.upsertNode({ ...nodeInput, id: nodeId });
        nodeIds.push(nodeId);
      } catch (error) {
        // Log but continue - don't fail entire operation for one node
        console.warn(
          `[${this.name}] Failed to create node for entity "${entity.name}":`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return { result, nodeIds };
  };

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Extract entities from a single text segment.
   */
  private extractFromText = async (text: string): Promise<ExtractedEntity[]> => {
    const prompt = this.buildPrompt(text);

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: 2000, // Enough for entity JSON
      });

      return this.parseResponse(response.content);
    } catch (error) {
      if (error instanceof ExtractionError) {
        throw error;
      }
      throw ExtractionError.llmError(
        this.name,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      );
    }
  };

  /**
   * Extract entities from text in chunks, then merge results.
   */
  private extractFromChunks = async (text: string): Promise<ExtractedEntity[]> => {
    const chunkSize = this.maxInputTokens * CHARS_PER_TOKEN;
    const overlap = Math.floor(chunkSize * 0.1); // 10% overlap

    const allEntities: ExtractedEntity[] = [];
    let position = 0;

    while (position < text.length) {
      const chunkEnd = Math.min(position + chunkSize, text.length);
      const chunk = text.slice(position, chunkEnd);

      try {
        const chunkEntities = await this.extractFromText(chunk);

        // Adjust mention positions if present
        for (const entity of chunkEntities) {
          if (entity.mentions) {
            entity.mentions = entity.mentions.map((m) => ({
              start: m.start + position,
              end: m.end + position,
            }));
          }
          allEntities.push(entity);
        }
      } catch (error) {
        // Log and continue with other chunks
        console.warn(
          `[${this.name}] Failed to extract from chunk at position ${position}:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      // Move to next chunk with overlap
      position = chunkEnd - overlap;
      if (position >= text.length - overlap) {
        break;
      }
    }

    return allEntities;
  };

  /**
   * Build the LLM prompt with the input text.
   */
  private buildPrompt(text: string): string {
    const values: Record<string, string> = { text };

    if (this.entityTypes && this.entityTypes.length > 0) {
      values.entityTypes = this.entityTypes.join(', ');
    }

    return formatPrompt(this.promptTemplate, values);
  }

  /**
   * Parse LLM response into extracted entities.
   *
   * Handles various response formats:
   * - Raw JSON
   * - JSON wrapped in markdown code blocks
   * - JSON with leading/trailing text
   */
  private parseResponse(content: string): ExtractedEntity[] {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      const lines = jsonStr.split('\n');
      // Remove first line (```json or ```) and last line (```)
      // Find last index of closing ``` (ES2022 compatible)
      let endIndex = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i]?.trim() === '```') {
          endIndex = i;
          break;
        }
      }
      if (endIndex > 0) {
        jsonStr = lines.slice(1, endIndex).join('\n').trim();
      } else {
        jsonStr = lines.slice(1).join('\n').trim();
      }
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      throw ExtractionError.parseError(
        this.name,
        `Invalid JSON: ${content.slice(0, 200)}...`,
        parseError instanceof Error ? parseError : undefined
      );
    }

    // Validate with Zod
    const result = LLMEntityResponseSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw ExtractionError.validationError(this.name, issues);
    }

    // Filter by entity types if configured
    let entities = result.data.entities;
    if (this.entityTypes && this.entityTypes.length > 0) {
      const allowedTypes = new Set(this.entityTypes);
      entities = entities.filter((e) => allowedTypes.has(e.type));
    }

    return entities;
  }

  /**
   * Deduplicate entities by normalized name.
   *
   * When duplicates are found, keep the one with highest confidence.
   */
  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Map<string, ExtractedEntity>();

    for (const entity of entities) {
      const key = (entity.normalizedName ?? entity.name).toLowerCase().trim();
      const existing = seen.get(key);

      if (!existing || entity.confidence > existing.confidence) {
        seen.set(key, entity);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Convert an extracted entity to a graph node input.
   */
  private entityToNodeInput(
    entity: ExtractedEntity,
    sourceDocumentId?: string
  ): GraphNodeInput {
    return {
      type: 'entity', // All extracted entities use 'entity' type
      label: entity.name,
      properties: {
        description: entity.description,
        confidence: entity.confidence,
        entityType: entity.type, // Store granular type in properties
        sourceDocumentId,
        ...entity.properties,
      },
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a deterministic node ID for an entity.
 *
 * Uses a consistent format: entity:{type}:{normalized-name}
 * This enables deduplication when the same entity is extracted multiple times.
 *
 * @param entity - The extracted entity
 * @returns Deterministic node ID
 */
export function generateEntityNodeId(entity: ExtractedEntity): string {
  const normalized = (entity.normalizedName ?? entity.name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return `entity:${entity.type}:${normalized}`;
}
