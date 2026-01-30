/**
 * Knowledge Graph Extraction Schemas
 *
 * Zod schemas for validating LLM extraction responses.
 * These ensure type safety at runtime when parsing JSON from LLMs.
 */

import { z } from 'zod';
import { GraphEdgeTypeSchema } from '../schemas.js';

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * Schema for granular entity types.
 */
export const ExtractedEntityTypeSchema = z.enum([
  'person',
  'organization',
  'location',
  'concept',
  'product',
  'technology',
  'event',
  'date',
  'quantity',
  'other',
]);

/**
 * Schema for text mention spans.
 */
export const MentionSpanSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});

/**
 * Schema for an extracted entity from LLM response.
 *
 * This validates the raw JSON that the LLM returns before
 * we convert it to our TypeScript types.
 */
export const ExtractedEntitySchema = z.object({
  name: z.string().min(1, 'Entity name cannot be empty'),
  normalizedName: z.string().optional(),
  type: ExtractedEntityTypeSchema,
  description: z.string().optional(),
  confidence: z
    .number()
    .min(0, 'Confidence must be >= 0')
    .max(1, 'Confidence must be <= 1'),
  mentions: z.array(MentionSpanSchema).optional(),
  properties: z.record(z.unknown()).optional(),
});

/**
 * Schema for the LLM's entity extraction response.
 *
 * The LLM is prompted to return JSON in this format:
 * { "entities": [ { name, type, description, confidence }, ... ] }
 */
export const LLMEntityResponseSchema = z.object({
  entities: z.array(ExtractedEntitySchema),
});

// ============================================================================
// Relation Schemas
// ============================================================================

/**
 * Schema for an extracted relation from LLM response.
 */
export const ExtractedRelationSchema = z.object({
  sourceName: z.string().min(1, 'Source entity name cannot be empty'),
  targetName: z.string().min(1, 'Target entity name cannot be empty'),
  relationType: GraphEdgeTypeSchema,
  description: z.string().min(1, 'Relation description cannot be empty'),
  confidence: z
    .number()
    .min(0, 'Confidence must be >= 0')
    .max(1, 'Confidence must be <= 1'),
  bidirectional: z.boolean().optional(),
  properties: z.record(z.unknown()).optional(),
});

/**
 * Schema for the LLM's relation extraction response.
 *
 * The LLM is prompted to return JSON in this format:
 * { "relations": [ { sourceName, targetName, relationType, ... }, ... ] }
 */
export const LLMRelationResponseSchema = z.object({
  relations: z.array(ExtractedRelationSchema),
});

// ============================================================================
// Combined Schemas
// ============================================================================

/**
 * Schema for the LLM's combined extraction response.
 *
 * The LLM is prompted to return JSON in this format:
 * {
 *   "entities": [ ... ],
 *   "relations": [ ... ]
 * }
 */
export const LLMCombinedResponseSchema = z.object({
  entities: z.array(ExtractedEntitySchema),
  relations: z.array(ExtractedRelationSchema),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

/**
 * Inferred types from Zod schemas.
 *
 * These match our manual TypeScript types but are derived from
 * the schemas, ensuring they stay in sync.
 */
export type ZodExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ZodExtractedRelation = z.infer<typeof ExtractedRelationSchema>;
export type ZodLLMEntityResponse = z.infer<typeof LLMEntityResponseSchema>;
export type ZodLLMRelationResponse = z.infer<typeof LLMRelationResponseSchema>;
export type ZodLLMCombinedResponse = z.infer<typeof LLMCombinedResponseSchema>;
