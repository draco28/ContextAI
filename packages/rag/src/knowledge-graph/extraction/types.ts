/**
 * Knowledge Graph Extraction Types
 *
 * Types for LLM-based entity and relation extraction.
 * These extractors analyze text and populate knowledge graphs automatically.
 */

import type { LLMProvider } from '@contextaisdk/core';
import type { GraphEdgeType, GraphStore } from '../types.js';

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Granular entity types for classification.
 *
 * These are more specific than GraphNodeType ('entity') and are stored
 * in the node's `properties.entityType` field for filtering and display.
 *
 * @example
 * - "OpenAI" → 'organization'
 * - "Sam Altman" → 'person'
 * - "machine learning" → 'concept'
 * - "San Francisco" → 'location'
 */
export type ExtractedEntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'concept'
  | 'product'
  | 'technology'
  | 'event'
  | 'date'
  | 'quantity'
  | 'other';

/**
 * An entity extracted from text by the LLM.
 *
 * Entities are named things that can be connected via relationships.
 * Each entity has a type, confidence score, and optional metadata.
 */
export interface ExtractedEntity {
  /** Entity name as it appears in text (e.g., "OpenAI") */
  name: string;

  /** Normalized/canonical form (e.g., "openai" for deduplication) */
  normalizedName?: string;

  /** Entity type classification */
  type: ExtractedEntityType;

  /** Brief description of the entity in this context */
  description?: string;

  /** Confidence score from LLM (0-1, higher = more confident) */
  confidence: number;

  /** Character offsets where entity was mentioned (optional) */
  mentions?: Array<{ start: number; end: number }>;

  /** Additional properties from extraction */
  properties?: Record<string, unknown>;
}

// ============================================================================
// Relation Types
// ============================================================================

/**
 * A relationship extracted from text by the LLM.
 *
 * Relations connect two entities and describe how they're related.
 * The relation type maps to GraphEdgeType for graph storage.
 */
export interface ExtractedRelation {
  /** Source entity name (must match an extracted entity) */
  sourceName: string;

  /** Target entity name (must match an extracted entity) */
  targetName: string;

  /** Relationship type (maps to GraphEdgeType) */
  relationType: GraphEdgeType;

  /** Natural language description of the relationship */
  description: string;

  /** Confidence score from LLM (0-1) */
  confidence: number;

  /** Whether the relation applies in both directions */
  bidirectional?: boolean;

  /** Additional properties */
  properties?: Record<string, unknown>;
}

// ============================================================================
// Extraction Results
// ============================================================================

/**
 * Metadata about an extraction operation.
 */
export interface ExtractionMetadata {
  /** Time taken for LLM call in milliseconds */
  llmLatencyMs: number;

  /** Number of tokens used (if available from provider) */
  tokensUsed?: number;

  /** Model identifier used for extraction */
  model?: string;
}

/**
 * Result from entity extraction.
 */
export interface EntityExtractionResult {
  /** Extracted entities */
  entities: ExtractedEntity[];

  /** Source text that was analyzed */
  sourceText: string;

  /** Source document ID if available */
  sourceDocumentId?: string;

  /** Extraction metadata */
  metadata: ExtractionMetadata;
}

/**
 * Result from relation extraction.
 */
export interface RelationExtractionResult {
  /** Extracted relations */
  relations: ExtractedRelation[];

  /** Source text that was analyzed */
  sourceText: string;

  /** Entity names that were provided for relation extraction */
  entityNames: string[];

  /** Extraction metadata */
  metadata: ExtractionMetadata;
}

/**
 * Combined extraction result (entities + relations).
 */
export interface KnowledgeExtractionResult {
  /** Extracted entities */
  entities: ExtractedEntity[];

  /** Extracted relations */
  relations: ExtractedRelation[];

  /** Source text that was analyzed */
  sourceText: string;

  /** Source document ID if available */
  sourceDocumentId?: string;

  /** Extraction metadata */
  metadata: ExtractionMetadata;
}

// ============================================================================
// Extraction Options
// ============================================================================

/**
 * Options for extraction operations.
 */
export interface ExtractionOptions {
  /** Override minimum confidence threshold */
  minConfidence?: number;

  /** Override LLM temperature */
  temperature?: number;

  /** Source document ID to attach to extracted entities */
  sourceDocumentId?: string;

  /** Source chunk ID if from a chunked document */
  sourceChunkId?: string;
}

// ============================================================================
// Extractor Configurations
// ============================================================================

/**
 * Configuration for the entity extractor.
 */
export interface EntityExtractorConfig {
  /**
   * LLM provider for extraction.
   * Required - the extractor uses LLM to understand and classify entities.
   */
  llmProvider: LLMProvider;

  /**
   * Entity types to extract.
   * If not specified, extracts all types.
   *
   * @default All types
   */
  entityTypes?: ExtractedEntityType[];

  /**
   * Minimum confidence threshold (0-1).
   * Entities below this threshold are filtered out.
   *
   * @default 0.5
   */
  minConfidence?: number;

  /**
   * Custom prompt template for entity extraction.
   * Use {text} placeholder for the input text.
   *
   * @default Built-in prompt optimized for JSON output
   */
  promptTemplate?: string;

  /**
   * LLM temperature for extraction.
   * Lower values produce more deterministic results.
   *
   * @default 0
   */
  temperature?: number;

  /**
   * Maximum input tokens per LLM call.
   * Longer texts will be processed in chunks.
   *
   * @default 4000
   */
  maxInputTokens?: number;
}

/**
 * Configuration for the relation extractor.
 */
export interface RelationExtractorConfig {
  /**
   * LLM provider for extraction.
   */
  llmProvider: LLMProvider;

  /**
   * Relation types to extract.
   * If not specified, extracts all GraphEdgeType values.
   *
   * @default All GraphEdgeType values
   */
  relationTypes?: GraphEdgeType[];

  /**
   * Minimum confidence threshold (0-1).
   *
   * @default 0.5
   */
  minConfidence?: number;

  /**
   * Custom prompt template for relation extraction.
   * Use {text} and {entityList} placeholders.
   *
   * @default Built-in prompt
   */
  promptTemplate?: string;

  /**
   * LLM temperature for extraction.
   *
   * @default 0
   */
  temperature?: number;

  /**
   * Whether to extract bidirectional hints.
   * When true, the prompt asks LLM to identify symmetric relationships.
   *
   * @default true
   */
  extractBidirectional?: boolean;
}

/**
 * Configuration for the combined knowledge extractor.
 */
export interface KnowledgeExtractorConfig {
  /**
   * LLM provider for extraction.
   */
  llmProvider: LLMProvider;

  /**
   * Entity types to extract.
   *
   * @default All types
   */
  entityTypes?: ExtractedEntityType[];

  /**
   * Relation types to extract.
   *
   * @default All GraphEdgeType values
   */
  relationTypes?: GraphEdgeType[];

  /**
   * Minimum confidence for entities.
   *
   * @default 0.5
   */
  minEntityConfidence?: number;

  /**
   * Minimum confidence for relations.
   *
   * @default 0.5
   */
  minRelationConfidence?: number;

  /**
   * Custom prompt template for combined extraction.
   *
   * @default Built-in prompt
   */
  promptTemplate?: string;

  /**
   * LLM temperature for extraction.
   *
   * @default 0
   */
  temperature?: number;

  /**
   * Maximum input tokens per LLM call.
   *
   * @default 4000
   */
  maxInputTokens?: number;

  /**
   * Whether to fall back to separate extraction on parse failure.
   * If true, tries entity extraction then relation extraction separately.
   *
   * @default true
   */
  fallbackToSeparate?: boolean;
}

// ============================================================================
// Extractor Interfaces
// ============================================================================

/**
 * Interface for entity extractors.
 */
export interface EntityExtractor {
  /** Extractor name for logging */
  readonly name: string;

  /**
   * Extract entities from text.
   *
   * @param text - Text to analyze
   * @param options - Extraction options
   * @returns Extracted entities with metadata
   */
  extract(text: string, options?: ExtractionOptions): Promise<EntityExtractionResult>;

  /**
   * Extract entities and populate graph store.
   *
   * @param text - Text to analyze
   * @param graphStore - Graph store to populate
   * @param options - Extraction options
   * @returns Extraction result and created node IDs
   */
  extractToGraph(
    text: string,
    graphStore: GraphStore,
    options?: ExtractionOptions
  ): Promise<{
    result: EntityExtractionResult;
    nodeIds: string[];
  }>;
}

/**
 * Interface for relation extractors.
 */
export interface RelationExtractor {
  /** Extractor name for logging */
  readonly name: string;

  /**
   * Extract relations from text given known entities.
   *
   * @param text - Text to analyze
   * @param entities - Previously extracted entities
   * @param options - Extraction options
   * @returns Extracted relations with metadata
   */
  extract(
    text: string,
    entities: ExtractedEntity[],
    options?: ExtractionOptions
  ): Promise<RelationExtractionResult>;

  /**
   * Extract relations and populate graph store.
   *
   * @param text - Text to analyze
   * @param entities - Previously extracted entities
   * @param graphStore - Graph store to populate
   * @param entityNodeMap - Map from entity name to node ID
   * @param options - Extraction options
   * @returns Extraction result and created edge IDs
   */
  extractToGraph(
    text: string,
    entities: ExtractedEntity[],
    graphStore: GraphStore,
    entityNodeMap: Map<string, string>,
    options?: ExtractionOptions
  ): Promise<{
    result: RelationExtractionResult;
    edgeIds: string[];
  }>;
}

/**
 * Interface for combined knowledge extractors.
 */
export interface KnowledgeExtractor {
  /** Extractor name for logging */
  readonly name: string;

  /**
   * Extract entities and relations in one pass.
   *
   * @param text - Text to analyze
   * @param options - Extraction options
   * @returns Combined extraction result
   */
  extract(text: string, options?: ExtractionOptions): Promise<KnowledgeExtractionResult>;

  /**
   * Extract and populate graph store with entities and relations.
   *
   * @param text - Text to analyze
   * @param graphStore - Graph store to populate
   * @param options - Extraction options
   * @returns Extraction result and created node/edge IDs
   */
  extractToGraph(
    text: string,
    graphStore: GraphStore,
    options?: ExtractionOptions
  ): Promise<{
    result: KnowledgeExtractionResult;
    nodeIds: string[];
    edgeIds: string[];
  }>;
}

// ============================================================================
// Graph Integration Types
// ============================================================================

/**
 * Result from populating a graph with extracted entities.
 */
export interface GraphPopulationResult {
  /** Node IDs that were created or updated */
  nodeIds: string[];

  /** Edge IDs that were created */
  edgeIds: string[];

  /** Number of entities that were deduplicated (already existed) */
  deduplicatedCount: number;

  /** Number of relations that couldn't be created (missing entities) */
  skippedRelationsCount: number;
}
