/**
 * Knowledge Graph Zod Schemas
 *
 * Runtime validation schemas for graph nodes and edges.
 * Use these to validate user input before storing in the graph.
 */

import { z } from 'zod';

// ============================================================================
// Node Schemas
// ============================================================================

/**
 * Schema for node types.
 */
export const GraphNodeTypeSchema = z.enum(
  ['concept', 'entity', 'document', 'chunk'],
  {
    errorMap: () => ({
      message: "Node type must be 'concept', 'entity', 'document', or 'chunk'",
    }),
  }
);

/**
 * Schema for node properties.
 */
export const GraphNodePropertiesSchema = z
  .object({
    description: z.string().optional(),
    sourceDocumentId: z.string().optional(),
    pageNumber: z.number().int().positive().optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .passthrough(); // Allow custom fields

/**
 * Schema for validating node input (user-provided data).
 *
 * @example
 * ```typescript
 * const result = GraphNodeInputSchema.safeParse({
 *   type: 'concept',
 *   label: 'Machine Learning',
 *   properties: { description: 'AI branch' }
 * });
 *
 * if (result.success) {
 *   await store.addNode(result.data);
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */
export const GraphNodeInputSchema = z.object({
  id: z.string().min(1, 'Node ID cannot be empty').optional(),
  type: GraphNodeTypeSchema,
  label: z
    .string({
      required_error: 'Node label is required',
    })
    .min(1, 'Node label cannot be empty'),
  properties: GraphNodePropertiesSchema.optional().default({}),
  embedding: z.array(z.number()).optional(),
});

/**
 * Schema for a complete node (including auto-generated fields).
 */
export const GraphNodeSchema = GraphNodeInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// ============================================================================
// Edge Schemas
// ============================================================================

/**
 * Schema for edge/relationship types.
 */
export const GraphEdgeTypeSchema = z.enum(
  ['references', 'contains', 'relatedTo', 'derivedFrom', 'mentions', 'similarTo'],
  {
    errorMap: () => ({
      message:
        "Edge type must be 'references', 'contains', 'relatedTo', 'derivedFrom', 'mentions', or 'similarTo'",
    }),
  }
);

/**
 * Schema for edge properties.
 */
export const GraphEdgePropertiesSchema = z
  .object({
    context: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .passthrough(); // Allow custom fields

/**
 * Schema for validating edge input (user-provided data).
 *
 * @example
 * ```typescript
 * const result = GraphEdgeInputSchema.safeParse({
 *   source: 'node-1',
 *   target: 'node-2',
 *   type: 'relatedTo',
 *   weight: 0.8
 * });
 *
 * if (result.success) {
 *   await store.addEdge(result.data);
 * }
 * ```
 */
export const GraphEdgeInputSchema = z.object({
  id: z.string().min(1, 'Edge ID cannot be empty').optional(),
  source: z
    .string({
      required_error: 'Source node ID is required',
    })
    .min(1, 'Source node ID cannot be empty'),
  target: z
    .string({
      required_error: 'Target node ID is required',
    })
    .min(1, 'Target node ID cannot be empty'),
  type: GraphEdgeTypeSchema,
  weight: z.number().min(0).max(1).optional(),
  properties: GraphEdgePropertiesSchema.optional().default({}),
});

/**
 * Schema for a complete edge (including auto-generated fields).
 */
export const GraphEdgeSchema = GraphEdgeInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// ============================================================================
// Query Option Schemas
// ============================================================================

/**
 * Schema for traversal direction.
 */
export const TraversalDirectionSchema = z.enum(['outgoing', 'incoming', 'both']);

/**
 * Schema for neighbor query options.
 */
export const GetNeighborsOptionsSchema = z.object({
  depth: z.number().int().positive().max(10).optional().default(1),
  direction: TraversalDirectionSchema.optional().default('both'),
  edgeTypes: z.array(GraphEdgeTypeSchema).optional(),
  nodeTypes: z.array(GraphNodeTypeSchema).optional(),
  minWeight: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().optional(),
});

/**
 * Schema for graph query options.
 */
export const GraphQueryOptionsSchema = z.object({
  nodeTypes: z.array(GraphNodeTypeSchema).optional(),
  edgeTypes: z.array(GraphEdgeTypeSchema).optional(),
  nodeFilter: z.record(z.unknown()).optional(),
  edgeFilter: z.record(z.unknown()).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * Schema for graph store configuration.
 */
export const GraphStoreConfigSchema = z.object({
  name: z.string().min(1).optional(),
  maxNodes: z.number().int().nonnegative().optional().default(0),
  maxEdges: z.number().int().nonnegative().optional().default(0),
});

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

/**
 * Schema for upsert node input (ID is required).
 *
 * Unlike `GraphNodeInputSchema` where ID is optional, upsert requires
 * an ID to determine whether to create or update.
 *
 * @example
 * ```typescript
 * const result = UpsertNodeInputSchema.safeParse({
 *   id: 'node-123',  // Required for upsert
 *   type: 'concept',
 *   label: 'Machine Learning'
 * });
 * ```
 */
export const UpsertNodeInputSchema = GraphNodeInputSchema.extend({
  id: z.string().min(1, 'Node ID is required for upsert'),
});

/**
 * Schema for partial node updates (used in bulk operations).
 */
const PartialNodeUpdatesSchema = z.object({
  type: GraphNodeTypeSchema.optional(),
  label: z.string().min(1).optional(),
  properties: GraphNodePropertiesSchema.optional(),
  embedding: z.array(z.number()).optional(),
});

/**
 * Schema for a single bulk node update entry.
 *
 * @example
 * ```typescript
 * const update = {
 *   id: 'node-123',
 *   updates: { label: 'New Label', properties: { updated: true } }
 * };
 * BulkNodeUpdateSchema.parse(update);
 * ```
 */
export const BulkNodeUpdateSchema = z.object({
  id: z.string().min(1, 'Node ID is required for bulk update'),
  updates: PartialNodeUpdatesSchema,
});

/**
 * Schema for bulk update operation options.
 */
export const BulkUpdateOptionsSchema = z.object({
  continueOnError: z.boolean().optional().default(false),
});

/**
 * Schema for bulk delete operation options.
 */
export const BulkDeleteOptionsSchema = z.object({
  continueOnError: z.boolean().optional().default(false),
  skipMissing: z.boolean().optional().default(false),
});

// ============================================================================
// Inferred Types
// ============================================================================

/**
 * Validated node input type (inferred from schema).
 */
export type ValidatedGraphNodeInput = z.infer<typeof GraphNodeInputSchema>;

/**
 * Validated edge input type (inferred from schema).
 */
export type ValidatedGraphEdgeInput = z.infer<typeof GraphEdgeInputSchema>;

/**
 * Validated neighbor options type (inferred from schema).
 */
export type ValidatedGetNeighborsOptions = z.infer<
  typeof GetNeighborsOptionsSchema
>;

/**
 * Validated query options type (inferred from schema).
 */
export type ValidatedGraphQueryOptions = z.infer<typeof GraphQueryOptionsSchema>;

/**
 * Validated store config type (inferred from schema).
 */
export type ValidatedGraphStoreConfig = z.infer<typeof GraphStoreConfigSchema>;

/**
 * Validated upsert node input type (inferred from schema).
 */
export type ValidatedUpsertNodeInput = z.infer<typeof UpsertNodeInputSchema>;

/**
 * Validated bulk node update type (inferred from schema).
 */
export type ValidatedBulkNodeUpdate = z.infer<typeof BulkNodeUpdateSchema>;

/**
 * Validated bulk update options type (inferred from schema).
 */
export type ValidatedBulkUpdateOptions = z.infer<typeof BulkUpdateOptionsSchema>;

/**
 * Validated bulk delete options type (inferred from schema).
 */
export type ValidatedBulkDeleteOptions = z.infer<typeof BulkDeleteOptionsSchema>;
