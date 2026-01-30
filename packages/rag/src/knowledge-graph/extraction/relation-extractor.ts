/**
 * LLM Relation Extractor
 *
 * Extracts relationships between entities using an LLM and optionally
 * populates a knowledge graph with the extracted edges.
 *
 * Features:
 * - Configurable relation types to extract
 * - Confidence-based filtering
 * - Bidirectional relation support
 * - Automatic graph edge creation
 */

import type { ChatMessage, LLMProvider } from '@contextaisdk/core';
import type { GraphEdgeInput, GraphEdgeType, GraphStore } from '../types.js';
import type {
  RelationExtractor,
  RelationExtractorConfig,
  RelationExtractionResult,
  ExtractedEntity,
  ExtractedRelation,
  ExtractionOptions,
} from './types.js';
import { LLMRelationResponseSchema } from './schemas.js';
import { ExtractionError } from './errors.js';
import { DEFAULT_RELATION_EXTRACTION_PROMPT, formatPrompt } from './prompts.js';

// ============================================================================
// Constants
// ============================================================================

/** Default configuration values */
const DEFAULT_CONFIG = {
  minConfidence: 0.5,
  temperature: 0,
} as const;

// ============================================================================
// Relation Extractor Implementation
// ============================================================================

/**
 * LLM-based relation extractor.
 *
 * Uses an LLM to identify relationships between known entities in text.
 * Requires entities to be provided (typically from LLMEntityExtractor).
 *
 * @example
 * ```typescript
 * const extractor = new LLMRelationExtractor({
 *   llmProvider: new AnthropicProvider({ model: 'claude-sonnet-4-20250514' }),
 *   minConfidence: 0.7,
 * });
 *
 * // First extract entities
 * const entities = await entityExtractor.extract(text);
 *
 * // Then extract relations
 * const result = await extractor.extract(text, entities.entities);
 * console.log(result.relations);
 * // [{ sourceName: "Sam Altman", targetName: "OpenAI", relationType: "relatedTo", ... }]
 *
 * // Or extract and populate graph
 * const { edgeIds } = await extractor.extractToGraph(
 *   text, entities.entities, graphStore, entityNodeMap
 * );
 * ```
 */
export class LLMRelationExtractor implements RelationExtractor {
  readonly name = 'LLMRelationExtractor';

  private readonly llmProvider: LLMProvider;
  private readonly relationTypes?: GraphEdgeType[];
  private readonly minConfidence: number;
  private readonly promptTemplate: string;
  private readonly temperature: number;

  constructor(config: RelationExtractorConfig) {
    if (!config.llmProvider) {
      throw ExtractionError.providerRequired(this.name, 'llmProvider');
    }

    this.llmProvider = config.llmProvider;
    this.relationTypes = config.relationTypes;
    this.minConfidence = config.minConfidence ?? DEFAULT_CONFIG.minConfidence;
    this.temperature = config.temperature ?? DEFAULT_CONFIG.temperature;
    this.promptTemplate =
      config.promptTemplate ?? DEFAULT_RELATION_EXTRACTION_PROMPT;

    // Validate configuration
    if (this.minConfidence < 0 || this.minConfidence > 1) {
      throw ExtractionError.configError(
        this.name,
        'minConfidence must be between 0 and 1'
      );
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Extract relations from text given known entities.
   */
  extract = async (
    text: string,
    entities: ExtractedEntity[],
    options?: ExtractionOptions
  ): Promise<RelationExtractionResult> => {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw ExtractionError.emptyText(this.name);
    }

    if (!entities || entities.length < 2) {
      // Need at least 2 entities to have a relation
      return {
        relations: [],
        sourceText: text,
        entityNames: entities.map((e) => e.name),
        metadata: {
          llmLatencyMs: 0,
          model: this.llmProvider.model,
        },
      };
    }

    const startTime = Date.now();
    const minConfidence = options?.minConfidence ?? this.minConfidence;

    // Build prompt with entity list
    const entityList = entities.map((e) => e.name).join(', ');
    const prompt = formatPrompt(this.promptTemplate, { text, entityList });

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    try {
      const response = await this.llmProvider.chat(messages, {
        temperature: this.temperature,
        maxTokens: 2000,
      });

      const relations = this.parseResponse(response.content, entities);

      // Filter by confidence
      const filteredRelations = relations.filter(
        (r) => r.confidence >= minConfidence
      );

      return {
        relations: filteredRelations,
        sourceText: text,
        entityNames: entities.map((e) => e.name),
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
   * Extract relations and populate graph store.
   */
  extractToGraph = async (
    text: string,
    entities: ExtractedEntity[],
    graphStore: GraphStore,
    entityNodeMap: Map<string, string>,
    options?: ExtractionOptions
  ): Promise<{
    result: RelationExtractionResult;
    edgeIds: string[];
  }> => {
    // First extract relations
    const result = await this.extract(text, entities, options);

    // Convert to graph edges and insert
    const edgeIds: string[] = [];

    for (const relation of result.relations) {
      try {
        // Look up node IDs for source and target
        const sourceNodeId = this.findNodeId(relation.sourceName, entityNodeMap);
        const targetNodeId = this.findNodeId(relation.targetName, entityNodeMap);

        if (!sourceNodeId || !targetNodeId) {
          console.warn(
            `[${this.name}] Skipping relation "${relation.sourceName}" -> "${relation.targetName}": ` +
              `entity not found in node map`
          );
          continue;
        }

        // Create edge
        const edgeInput = this.relationToEdgeInput(
          relation,
          sourceNodeId,
          targetNodeId
        );
        const edgeId = await graphStore.addEdge(edgeInput);
        edgeIds.push(edgeId);

        // Create reverse edge if bidirectional
        if (relation.bidirectional) {
          const reverseEdgeInput = this.relationToEdgeInput(
            relation,
            targetNodeId,
            sourceNodeId
          );
          const reverseEdgeId = await graphStore.addEdge(reverseEdgeInput);
          edgeIds.push(reverseEdgeId);
        }
      } catch (error) {
        // Log but continue
        console.warn(
          `[${this.name}] Failed to create edge for relation:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return { result, edgeIds };
  };

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Parse LLM response into extracted relations.
   */
  private parseResponse(
    content: string,
    entities: ExtractedEntity[]
  ): ExtractedRelation[] {
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
    const result = LLMRelationResponseSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw ExtractionError.validationError(this.name, issues);
    }

    // Build set of valid entity names (case-insensitive)
    const validEntityNames = new Set(
      entities.map((e) => e.name.toLowerCase().trim())
    );

    // Filter relations by configured types and valid entities
    let relations = result.data.relations;

    // Filter by relation types if configured
    if (this.relationTypes && this.relationTypes.length > 0) {
      const allowedTypes = new Set(this.relationTypes);
      relations = relations.filter((r) => allowedTypes.has(r.relationType));
    }

    // Filter relations where both entities exist
    relations = relations.filter((r) => {
      const sourceValid = validEntityNames.has(r.sourceName.toLowerCase().trim());
      const targetValid = validEntityNames.has(r.targetName.toLowerCase().trim());
      return sourceValid && targetValid;
    });

    return relations;
  }

  /**
   * Find node ID in map using case-insensitive matching.
   */
  private findNodeId(
    entityName: string,
    nodeMap: Map<string, string>
  ): string | undefined {
    // Try exact match first
    if (nodeMap.has(entityName)) {
      return nodeMap.get(entityName);
    }

    // Try case-insensitive match
    const normalizedSearch = entityName.toLowerCase().trim();
    for (const [name, nodeId] of nodeMap) {
      if (name.toLowerCase().trim() === normalizedSearch) {
        return nodeId;
      }
    }

    return undefined;
  }

  /**
   * Convert an extracted relation to a graph edge input.
   */
  private relationToEdgeInput(
    relation: ExtractedRelation,
    sourceNodeId: string,
    targetNodeId: string
  ): GraphEdgeInput {
    return {
      source: sourceNodeId,
      target: targetNodeId,
      type: relation.relationType,
      weight: relation.confidence,
      properties: {
        context: relation.description,
        confidence: relation.confidence,
        ...relation.properties,
      },
    };
  }
}
