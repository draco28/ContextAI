/**
 * LLM Knowledge Extractor
 *
 * Extracts both entities and relations in a single LLM call,
 * providing the most efficient approach for knowledge graph population.
 *
 * Features:
 * - Single LLM call for both entities and relations
 * - Fallback to separate extraction on parse failure
 * - Automatic graph population with deduplication
 * - Configurable confidence thresholds
 */

import type { ChatMessage, LLMProvider } from '@contextaisdk/core';
import type { GraphEdgeType, GraphStore } from '../types.js';
import type {
  KnowledgeExtractor,
  KnowledgeExtractorConfig,
  KnowledgeExtractionResult,
  ExtractedEntity,
  ExtractedEntityType,
  ExtractedRelation,
  ExtractionOptions,
} from './types.js';
import { LLMCombinedResponseSchema } from './schemas.js';
import { ExtractionError } from './errors.js';
import { DEFAULT_COMBINED_EXTRACTION_PROMPT, formatPrompt } from './prompts.js';
import { LLMEntityExtractor, generateEntityNodeId } from './entity-extractor.js';
import { LLMRelationExtractor } from './relation-extractor.js';

// ============================================================================
// Constants
// ============================================================================

/** Approximate characters per token for chunking */
const CHARS_PER_TOKEN = 4;

/** Default configuration values */
const DEFAULT_CONFIG = {
  minEntityConfidence: 0.5,
  minRelationConfidence: 0.5,
  temperature: 0,
  maxInputTokens: 4000,
  fallbackToSeparate: true,
} as const;

// ============================================================================
// Knowledge Extractor Implementation
// ============================================================================

/**
 * LLM-based combined knowledge extractor.
 *
 * Extracts both entities and relations in a single LLM call for efficiency.
 * Falls back to separate extraction if parsing fails.
 *
 * @example
 * ```typescript
 * const extractor = new LLMKnowledgeExtractor({
 *   llmProvider: new AnthropicProvider({ model: 'claude-sonnet-4-20250514' }),
 *   minEntityConfidence: 0.7,
 *   minRelationConfidence: 0.6,
 * });
 *
 * // Extract both entities and relations
 * const result = await extractor.extract(text);
 * console.log(result.entities);  // [{ name: "OpenAI", ... }]
 * console.log(result.relations); // [{ sourceName: "Sam Altman", targetName: "OpenAI", ... }]
 *
 * // Or extract and populate graph directly
 * const { nodeIds, edgeIds } = await extractor.extractToGraph(text, graphStore);
 * ```
 */
export class LLMKnowledgeExtractor implements KnowledgeExtractor {
  readonly name = 'LLMKnowledgeExtractor';

  private readonly llmProvider: LLMProvider;
  private readonly entityTypes?: ExtractedEntityType[];
  private readonly relationTypes?: GraphEdgeType[];
  private readonly minEntityConfidence: number;
  private readonly minRelationConfidence: number;
  private readonly promptTemplate: string;
  private readonly temperature: number;
  private readonly maxInputTokens: number;
  private readonly fallbackToSeparate: boolean;

  // Fallback extractors (lazy initialized)
  private entityExtractor?: LLMEntityExtractor;
  private relationExtractor?: LLMRelationExtractor;

  constructor(config: KnowledgeExtractorConfig) {
    if (!config.llmProvider) {
      throw ExtractionError.providerRequired(this.name, 'llmProvider');
    }

    this.llmProvider = config.llmProvider;
    this.entityTypes = config.entityTypes;
    this.relationTypes = config.relationTypes;
    this.minEntityConfidence =
      config.minEntityConfidence ?? DEFAULT_CONFIG.minEntityConfidence;
    this.minRelationConfidence =
      config.minRelationConfidence ?? DEFAULT_CONFIG.minRelationConfidence;
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature;
    this.maxInputTokens = config.maxInputTokens ?? DEFAULT_CONFIG.maxInputTokens;
    this.promptTemplate =
      config.promptTemplate ?? DEFAULT_COMBINED_EXTRACTION_PROMPT;
    this.fallbackToSeparate =
      config.fallbackToSeparate ?? DEFAULT_CONFIG.fallbackToSeparate;

    // Validate configuration
    if (this.minEntityConfidence < 0 || this.minEntityConfidence > 1) {
      throw ExtractionError.configError(
        this.name,
        'minEntityConfidence must be between 0 and 1'
      );
    }

    if (this.minRelationConfidence < 0 || this.minRelationConfidence > 1) {
      throw ExtractionError.configError(
        this.name,
        'minRelationConfidence must be between 0 and 1'
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
   * Extract entities and relations in one pass.
   */
  extract = async (
    text: string,
    options?: ExtractionOptions
  ): Promise<KnowledgeExtractionResult> => {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw ExtractionError.emptyText(this.name);
    }

    const startTime = Date.now();

    try {
      // Try combined extraction
      return await this.extractCombined(text, options, startTime);
    } catch (error) {
      // Fallback to separate extraction if enabled
      if (this.fallbackToSeparate && error instanceof ExtractionError) {
        console.warn(
          `[${this.name}] Combined extraction failed, falling back to separate extraction:`,
          error.message
        );
        return await this.extractSeparate(text, options, startTime);
      }
      throw error;
    }
  };

  /**
   * Extract and populate graph store with entities and relations.
   */
  extractToGraph = async (
    text: string,
    graphStore: GraphStore,
    options?: ExtractionOptions
  ): Promise<{
    result: KnowledgeExtractionResult;
    nodeIds: string[];
    edgeIds: string[];
  }> => {
    // First extract everything
    const result = await this.extract(text, options);

    // Create nodes for entities
    const nodeIds: string[] = [];
    const entityNodeMap = new Map<string, string>();

    for (const entity of result.entities) {
      try {
        const nodeId = generateEntityNodeId(entity);
        const nodeInput = {
          id: nodeId,
          type: 'entity' as const,
          label: entity.name,
          properties: {
            description: entity.description,
            confidence: entity.confidence,
            entityType: entity.type,
            sourceDocumentId: options?.sourceDocumentId,
            ...entity.properties,
          },
        };

        await graphStore.upsertNode(nodeInput);
        nodeIds.push(nodeId);
        entityNodeMap.set(entity.name, nodeId);
      } catch (error) {
        console.warn(
          `[${this.name}] Failed to create node for entity "${entity.name}":`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Create edges for relations
    const edgeIds: string[] = [];

    for (const relation of result.relations) {
      try {
        const sourceNodeId = this.findNodeId(relation.sourceName, entityNodeMap);
        const targetNodeId = this.findNodeId(relation.targetName, entityNodeMap);

        if (!sourceNodeId || !targetNodeId) {
          console.warn(
            `[${this.name}] Skipping relation "${relation.sourceName}" -> "${relation.targetName}": ` +
              `entity not found in node map`
          );
          continue;
        }

        const edgeId = await graphStore.addEdge({
          source: sourceNodeId,
          target: targetNodeId,
          type: relation.relationType,
          weight: relation.confidence,
          properties: {
            context: relation.description,
            confidence: relation.confidence,
            ...relation.properties,
          },
        });
        edgeIds.push(edgeId);

        // Create reverse edge if bidirectional
        if (relation.bidirectional) {
          const reverseEdgeId = await graphStore.addEdge({
            source: targetNodeId,
            target: sourceNodeId,
            type: relation.relationType,
            weight: relation.confidence,
            properties: {
              context: relation.description,
              confidence: relation.confidence,
              bidirectionalOf: edgeId,
              ...relation.properties,
            },
          });
          edgeIds.push(reverseEdgeId);
        }
      } catch (error) {
        console.warn(
          `[${this.name}] Failed to create edge for relation:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return { result, nodeIds, edgeIds };
  };

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Extract entities and relations in a single LLM call.
   */
  private extractCombined = async (
    text: string,
    options: ExtractionOptions | undefined,
    startTime: number
  ): Promise<KnowledgeExtractionResult> => {
    const minEntityConfidence =
      options?.minConfidence ?? this.minEntityConfidence;
    const minRelationConfidence =
      options?.minConfidence ?? this.minRelationConfidence;

    // Check if text needs chunking
    const estimatedTokens = Math.ceil(text.length / CHARS_PER_TOKEN);

    if (estimatedTokens > this.maxInputTokens) {
      // For long texts, fall back to separate extraction with chunking
      return await this.extractSeparate(text, options, startTime);
    }

    // Build prompt
    const prompt = formatPrompt(this.promptTemplate, { text });
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: 4000, // Larger for combined output
      });

      const { entities, relations } = this.parseResponse(response.content);

      // Filter entities by confidence and type
      let filteredEntities = entities.filter(
        (e) => e.confidence >= minEntityConfidence
      );
      if (this.entityTypes && this.entityTypes.length > 0) {
        const allowedTypes = new Set(this.entityTypes);
        filteredEntities = filteredEntities.filter((e) =>
          allowedTypes.has(e.type)
        );
      }

      // Deduplicate entities
      const deduplicatedEntities = this.deduplicateEntities(filteredEntities);

      // Build set of valid entity names
      const validEntityNames = new Set(
        deduplicatedEntities.map((e) => e.name.toLowerCase().trim())
      );

      // Filter relations by confidence, type, and valid entities
      let filteredRelations = relations.filter(
        (r) => r.confidence >= minRelationConfidence
      );
      if (this.relationTypes && this.relationTypes.length > 0) {
        const allowedTypes = new Set(this.relationTypes);
        filteredRelations = filteredRelations.filter((r) =>
          allowedTypes.has(r.relationType)
        );
      }
      // Only keep relations where both entities exist
      filteredRelations = filteredRelations.filter((r) => {
        const sourceValid = validEntityNames.has(
          r.sourceName.toLowerCase().trim()
        );
        const targetValid = validEntityNames.has(
          r.targetName.toLowerCase().trim()
        );
        return sourceValid && targetValid;
      });

      return {
        entities: deduplicatedEntities,
        relations: filteredRelations,
        sourceText: text,
        sourceDocumentId: options?.sourceDocumentId,
        metadata: {
          llmLatencyMs: Date.now() - startTime,
          model: this.llmProvider.model,
        },
      };
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
   * Extract using separate entity and relation extractors.
   * Used as fallback or for long texts that need chunking.
   */
  private extractSeparate = async (
    text: string,
    options: ExtractionOptions | undefined,
    startTime: number
  ): Promise<KnowledgeExtractionResult> => {
    // Lazy initialize extractors
    if (!this.entityExtractor) {
      this.entityExtractor = new LLMEntityExtractor({
        llmProvider: this.llmProvider,
        entityTypes: this.entityTypes,
        minConfidence: this.minEntityConfidence,
        temperature: this.temperature,
        maxInputTokens: this.maxInputTokens,
      });
    }

    if (!this.relationExtractor) {
      this.relationExtractor = new LLMRelationExtractor({
        llmProvider: this.llmProvider,
        relationTypes: this.relationTypes,
        minConfidence: this.minRelationConfidence,
        temperature: this.temperature,
      });
    }

    // Extract entities first
    const entityResult = await this.entityExtractor.extract(text, options);

    // Then extract relations
    const relationResult = await this.relationExtractor.extract(
      text,
      entityResult.entities,
      options
    );

    return {
      entities: entityResult.entities,
      relations: relationResult.relations,
      sourceText: text,
      sourceDocumentId: options?.sourceDocumentId,
      metadata: {
        llmLatencyMs: Date.now() - startTime,
        model: this.llmProvider.model,
      },
    };
  };

  /**
   * Parse LLM response into entities and relations.
   */
  private parseResponse(content: string): {
    entities: ExtractedEntity[];
    relations: ExtractedRelation[];
  } {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      const lines = jsonStr.split('\n');
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
    const result = LLMCombinedResponseSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw ExtractionError.validationError(this.name, issues);
    }

    return {
      entities: result.data.entities,
      relations: result.data.relations,
    };
  }

  /**
   * Deduplicate entities by normalized name.
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
   * Find node ID in map using case-insensitive matching.
   */
  private findNodeId(
    entityName: string,
    nodeMap: Map<string, string>
  ): string | undefined {
    if (nodeMap.has(entityName)) {
      return nodeMap.get(entityName);
    }

    const normalizedSearch = entityName.toLowerCase().trim();
    for (const [name, nodeId] of nodeMap) {
      if (name.toLowerCase().trim() === normalizedSearch) {
        return nodeId;
      }
    }

    return undefined;
  }
}
