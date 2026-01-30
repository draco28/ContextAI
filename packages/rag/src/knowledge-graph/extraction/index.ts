/**
 * Knowledge Graph Extraction Module
 *
 * LLM-based entity and relation extraction for knowledge graphs.
 *
 * @example
 * ```typescript
 * import {
 *   LLMEntityExtractor,
 *   LLMRelationExtractor,
 *   LLMKnowledgeExtractor,
 * } from '@contextaisdk/rag';
 *
 * // Entity extraction only
 * const entityExtractor = new LLMEntityExtractor({ llmProvider });
 * const { entities } = await entityExtractor.extract(text);
 *
 * // Relation extraction (requires entities)
 * const relationExtractor = new LLMRelationExtractor({ llmProvider });
 * const { relations } = await relationExtractor.extract(text, entities);
 *
 * // Combined extraction (most efficient)
 * const knowledgeExtractor = new LLMKnowledgeExtractor({ llmProvider });
 * const { entities, relations } = await knowledgeExtractor.extract(text);
 * ```
 */

// Types
export type {
  // Entity types
  ExtractedEntityType,
  ExtractedEntity,
  EntityExtractionResult,
  EntityExtractorConfig,
  EntityExtractor,
  // Relation types
  ExtractedRelation,
  RelationExtractionResult,
  RelationExtractorConfig,
  RelationExtractor,
  // Combined types
  KnowledgeExtractionResult,
  KnowledgeExtractorConfig,
  KnowledgeExtractor,
  // Common types
  ExtractionMetadata,
  ExtractionOptions,
  GraphPopulationResult,
} from './types.js';

// Schemas
export {
  ExtractedEntityTypeSchema,
  ExtractedEntitySchema,
  ExtractedRelationSchema,
  LLMEntityResponseSchema,
  LLMRelationResponseSchema,
  LLMCombinedResponseSchema,
} from './schemas.js';

// Errors
export { ExtractionError } from './errors.js';
export type { ExtractionErrorCode, ExtractionErrorDetails } from './errors.js';

// Prompts
export {
  DEFAULT_ENTITY_EXTRACTION_PROMPT,
  FILTERED_ENTITY_EXTRACTION_PROMPT,
  DEFAULT_RELATION_EXTRACTION_PROMPT,
  DEFAULT_COMBINED_EXTRACTION_PROMPT,
  formatPrompt,
} from './prompts.js';

// Extractors
export { LLMEntityExtractor, generateEntityNodeId } from './entity-extractor.js';

// Relation and combined extractors will be added in Ticket #70
// export { LLMRelationExtractor } from './relation-extractor.js';
// export { LLMKnowledgeExtractor } from './knowledge-extractor.js';
