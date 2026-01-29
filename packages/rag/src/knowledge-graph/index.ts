/**
 * Knowledge Graph Module
 *
 * Provides interfaces and schemas for knowledge graph storage.
 * Use this module to store and query relationships between concepts,
 * entities, documents, and chunks.
 *
 * @example
 * ```typescript
 * import {
 *   type GraphStore,
 *   type GraphNode,
 *   type GraphEdge,
 *   GraphNodeInputSchema,
 *   GraphStoreError
 * } from '@contextaisdk/rag';
 *
 * // Validate input
 * const result = GraphNodeInputSchema.safeParse({
 *   type: 'concept',
 *   label: 'Machine Learning'
 * });
 *
 * if (result.success) {
 *   const nodeId = await store.addNode(result.data);
 * }
 * ```
 */

// Types (exported as types for tree-shaking)
export type {
  // Node types
  GraphNodeType,
  GraphNodeProperties,
  GraphNode,
  GraphNodeInput,
  // Edge types
  GraphEdgeType,
  GraphEdgeProperties,
  GraphEdge,
  GraphEdgeInput,
  // Query types
  TraversalDirection,
  GetNeighborsOptions,
  NeighborResult,
  GraphQueryOptions,
  GraphQueryResult,
  // Store types
  GraphStoreConfig,
  GraphStore,
  // Error types
  GraphStoreErrorCode,
  GraphStoreErrorDetails,
} from './types.js';

// Zod Schemas (for runtime validation)
export {
  // Node schemas
  GraphNodeTypeSchema,
  GraphNodePropertiesSchema,
  GraphNodeInputSchema,
  GraphNodeSchema,
  // Edge schemas
  GraphEdgeTypeSchema,
  GraphEdgePropertiesSchema,
  GraphEdgeInputSchema,
  GraphEdgeSchema,
  // Query schemas
  TraversalDirectionSchema,
  GetNeighborsOptionsSchema,
  GraphQueryOptionsSchema,
  // Config schema
  GraphStoreConfigSchema,
  // Validated types (from z.infer)
  type ValidatedGraphNodeInput,
  type ValidatedGraphEdgeInput,
  type ValidatedGetNeighborsOptions,
  type ValidatedGraphQueryOptions,
  type ValidatedGraphStoreConfig,
} from './schemas.js';

// Error class
export { GraphStoreError } from './errors.js';

// Implementations
export { InMemoryGraphStore } from './memory-store.js';
export { Neo4jGraphStore, Neo4jGraphStoreConfigSchema } from './neo4j-store.js';
export type { Neo4jGraphStoreConfig } from './neo4j-store.js';
