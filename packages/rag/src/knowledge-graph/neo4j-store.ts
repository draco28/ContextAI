/**
 * Neo4j Graph Store Implementation
 *
 * A persistent graph store using Neo4j as the backend.
 * Implements the GraphStore interface for knowledge graph operations.
 *
 * @example
 * ```typescript
 * // Using connection string
 * const store = new Neo4jGraphStore({
 *   connectionString: 'neo4j://localhost:7687',
 *   username: 'neo4j',
 *   password: 'password',
 *   database: 'neo4j'
 * });
 *
 * // Using existing driver
 * import neo4j from 'neo4j-driver';
 * const driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
 * const store = new Neo4jGraphStore({ driver });
 *
 * // Add nodes and edges
 * const nodeId = await store.addNode({ type: 'concept', label: 'Machine Learning' });
 * await store.addEdge({ source: nodeId, target: 'other-id', type: 'relatedTo' });
 *
 * // Don't forget to close when done
 * await store.close();
 * ```
 */

import { z } from 'zod';

import type {
  GraphStore,
  GraphStoreConfig,
  GraphNode,
  GraphNodeInput,
  GraphEdge,
  GraphEdgeInput,
  GetNeighborsOptions,
  NeighborResult,
  GraphQueryOptions,
  GraphQueryResult,
  TraversalDirection,
  GraphNodeType,
  GraphEdgeType,
  BulkNodeUpdate,
  BulkEdgeUpdate,
  BulkUpdateOptions,
  BulkDeleteOptions,
  BulkOperationResult,
  ShortestPathOptions,
  PathResult,
} from './types.js';

import {
  GraphNodeInputSchema,
  GraphEdgeInputSchema,
  GetNeighborsOptionsSchema,
  GraphQueryOptionsSchema,
  ShortestPathOptionsSchema,
  UpsertNodeInputSchema,
  UpsertEdgeInputSchema,
  BulkNodeUpdateSchema,
  BulkEdgeUpdateSchema,
  BulkUpdateOptionsSchema,
  BulkDeleteOptionsSchema,
} from './schemas.js';

import { GraphStoreError } from './errors.js';

// ============================================================================
// Neo4j Type Imports (lazy loaded)
// ============================================================================

/**
 * Neo4j driver types - imported dynamically to keep neo4j-driver optional
 */
type Neo4jDriver = import('neo4j-driver').Driver;
type Neo4jSession = import('neo4j-driver').Session;
type Neo4jRecord = import('neo4j-driver').Record;
type Neo4jNode = import('neo4j-driver').Node;
type Neo4jRelationship = import('neo4j-driver').Relationship;
type Neo4jInteger = import('neo4j-driver').Integer;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for Neo4jGraphStore.
 *
 * Provide either `connectionString` + credentials OR a pre-existing `driver`.
 */
export interface Neo4jGraphStoreConfig extends GraphStoreConfig {
  /** Neo4j connection URI (e.g., 'neo4j://localhost:7687', 'neo4j+s://...') */
  connectionString?: string;
  /** Pre-existing Neo4j driver instance (takes precedence over connectionString) */
  driver?: Neo4jDriver;
  /** Username for authentication (required with connectionString) */
  username?: string;
  /** Password for authentication (required with connectionString) */
  password?: string;
  /** Database name (default: 'neo4j') */
  database?: string;
  /** Maximum connection pool size (default: 100) */
  maxConnectionPoolSize?: number;
}

/**
 * Zod schema for validating Neo4jGraphStoreConfig
 */
export const Neo4jGraphStoreConfigSchema = z
  .object({
    name: z.string().min(1).optional(),
    maxNodes: z.number().int().nonnegative().optional().default(0),
    maxEdges: z.number().int().nonnegative().optional().default(0),
    connectionString: z.string().url().optional(),
    // driver is validated separately (can't use Zod for class instances)
    username: z.string().optional(),
    password: z.string().optional(),
    database: z.string().min(1).optional().default('neo4j'),
    maxConnectionPoolSize: z.number().int().positive().optional().default(100),
  })
  .refine(
    (data) => data.connectionString !== undefined || (data as Neo4jGraphStoreConfig).driver !== undefined,
    {
      message: 'Either connectionString or driver must be provided',
    }
  );

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID with a prefix.
 * Uses timestamp + random string for uniqueness.
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert Neo4j Integer to JavaScript number.
 * Neo4j uses a custom Integer type for large numbers.
 */
function toNumber(value: Neo4jInteger | number): number {
  if (typeof value === 'number') return value;
  // Neo4j Integer has toNumber() method
  return (value as Neo4jInteger).toNumber();
}

// Note: recordToGraphNode and recordToGraphEdge helpers are inlined in each method
// to handle JSON parsing of the properties field consistently.

/**
 * Map GraphNodeType to Neo4j label.
 * Uses PascalCase for Neo4j label conventions.
 */
function nodeTypeToLabel(type: GraphNodeType): string {
  const mapping: Record<GraphNodeType, string> = {
    concept: 'Concept',
    entity: 'Entity',
    document: 'Document',
    chunk: 'Chunk',
  };
  return mapping[type];
}

/**
 * Map GraphEdgeType to Neo4j relationship type.
 * Uses SCREAMING_SNAKE_CASE for Neo4j relationship conventions.
 */
function edgeTypeToRelType(type: GraphEdgeType): string {
  const mapping: Record<GraphEdgeType, string> = {
    references: 'REFERENCES',
    contains: 'CONTAINS',
    relatedTo: 'RELATED_TO',
    derivedFrom: 'DERIVED_FROM',
    mentions: 'MENTIONS',
    similarTo: 'SIMILAR_TO',
  };
  return mapping[type];
}

// ============================================================================
// Neo4jGraphStore Implementation
// ============================================================================

/**
 * Neo4j-backed implementation of GraphStore.
 *
 * Features:
 * - Connection pooling via Neo4j driver
 * - Transactions for atomic batch operations
 * - Cypher queries for graph traversal
 * - Automatic cascading deletes
 *
 * @implements {GraphStore}
 */
export class Neo4jGraphStore implements GraphStore {
  readonly name: string;

  private driver: Neo4jDriver;
  private readonly driverOwned: boolean;
  private readonly database: string;
  private readonly maxNodes: number;
  private readonly maxEdges: number;

  /**
   * Create a new Neo4jGraphStore.
   *
   * @param config - Store configuration
   * @throws {GraphStoreError} If configuration is invalid
   */
  constructor(config: Neo4jGraphStoreConfig) {
    // Validate config (excluding driver which can't be validated with Zod)
    const validated = Neo4jGraphStoreConfigSchema.safeParse(config);
    if (!validated.success) {
      throw GraphStoreError.invalidNode('Neo4jGraphStore', validated.error.message);
    }

    this.name = config.name ?? 'Neo4jGraphStore';
    this.database = validated.data.database ?? 'neo4j';
    this.maxNodes = validated.data.maxNodes ?? 0;
    this.maxEdges = validated.data.maxEdges ?? 0;

    // Initialize driver
    if (config.driver) {
      // Use provided driver - we don't own it
      this.driver = config.driver;
      this.driverOwned = false;
    } else {
      // Create our own driver - we own it
      this.driver = this.createDriver(config, validated.data.maxConnectionPoolSize ?? 100);
      this.driverOwned = true;
    }
  }

  /**
   * Create a Neo4j driver instance.
   * Uses lazy import to keep neo4j-driver optional.
   */
  private createDriver(config: Neo4jGraphStoreConfig, maxPoolSize: number): Neo4jDriver {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const neo4j = require('neo4j-driver') as typeof import('neo4j-driver');

    const auth =
      config.username && config.password
        ? neo4j.auth.basic(config.username, config.password)
        : undefined;

    return neo4j.driver(config.connectionString!, auth, {
      maxConnectionPoolSize: maxPoolSize,
    });
  }

  /**
   * Get a new session for database operations.
   */
  private getSession(): Neo4jSession {
    return this.driver.session({ database: this.database });
  }

  /**
   * Run a query and return results.
   * Handles session lifecycle automatically.
   */
  private runQuery = async <T>(
    cypher: string,
    params: Record<string, unknown>,
    transform: (records: Neo4jRecord[]) => T
  ): Promise<T> => {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, params);
      return transform(result.records);
    } catch (error) {
      throw GraphStoreError.queryFailed(
        this.name,
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      await session.close();
    }
  };

  // ==========================================================================
  // Node Operations
  // ==========================================================================

  /**
   * Add a node to the graph.
   */
  addNode = async (node: GraphNodeInput): Promise<string> => {
    // Validate input
    const validated = GraphNodeInputSchema.safeParse(node);
    if (!validated.success) {
      throw GraphStoreError.invalidNode(this.name, validated.error.message);
    }

    // Check capacity
    if (this.maxNodes > 0) {
      const { nodes } = await this.count();
      if (nodes >= this.maxNodes) {
        throw GraphStoreError.capacityExceeded(this.name, 'nodes', this.maxNodes);
      }
    }

    const id = validated.data.id ?? generateId('node');
    const now = new Date().toISOString();
    const label = nodeTypeToLabel(validated.data.type);

    // Check for duplicate ID
    const existing = await this.getNode(id);
    if (existing) {
      throw GraphStoreError.duplicateNode(this.name, id);
    }

    const cypher = `
      CREATE (n:${label} {
        id: $id,
        type: $type,
        label: $nodeLabel,
        properties: $properties,
        embedding: $embedding,
        createdAt: $createdAt
      })
      RETURN n
    `;

    await this.runQuery(
      cypher,
      {
        id,
        type: validated.data.type,
        nodeLabel: validated.data.label,
        properties: JSON.stringify(validated.data.properties ?? {}),
        embedding: validated.data.embedding ?? null,
        createdAt: now,
      },
      () => null
    );

    return id;
  };

  /**
   * Add multiple nodes to the graph in a single transaction.
   */
  addNodes = async (nodes: GraphNodeInput[]): Promise<string[]> => {
    if (nodes.length === 0) return [];

    // Validate all nodes first
    const validatedNodes = nodes.map((node, index) => {
      const validated = GraphNodeInputSchema.safeParse(node);
      if (!validated.success) {
        throw GraphStoreError.invalidNode(
          this.name,
          `Node at index ${index}: ${validated.error.message}`
        );
      }
      return validated.data;
    });

    // Check capacity
    if (this.maxNodes > 0) {
      const { nodes: currentCount } = await this.count();
      if (currentCount + validatedNodes.length > this.maxNodes) {
        throw GraphStoreError.capacityExceeded(this.name, 'nodes', this.maxNodes);
      }
    }

    const now = new Date().toISOString();
    const nodeData = validatedNodes.map((node) => ({
      id: node.id ?? generateId('node'),
      type: node.type,
      label: nodeTypeToLabel(node.type),
      nodeLabel: node.label,
      properties: JSON.stringify(node.properties ?? {}),
      embedding: node.embedding ?? null,
      createdAt: now,
    }));

    // Check for duplicate IDs
    for (const node of nodeData) {
      const existing = await this.getNode(node.id);
      if (existing) {
        throw GraphStoreError.duplicateNode(this.name, node.id);
      }
    }

    const session = this.getSession();
    try {
      const tx = session.beginTransaction();
      try {
        for (const node of nodeData) {
          const cypher = `
            CREATE (n:${node.label} {
              id: $id,
              type: $type,
              label: $nodeLabel,
              properties: $properties,
              embedding: $embedding,
              createdAt: $createdAt
            })
          `;
          await tx.run(cypher, {
            id: node.id,
            type: node.type,
            nodeLabel: node.nodeLabel,
            properties: node.properties,
            embedding: node.embedding,
            createdAt: node.createdAt,
          });
        }
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    } finally {
      await session.close();
    }

    return nodeData.map((n) => n.id);
  };

  /**
   * Get a node by ID.
   */
  getNode = async (id: string): Promise<GraphNode | null> => {
    const cypher = `
      MATCH (n {id: $id})
      RETURN n
    `;

    return this.runQuery(cypher, { id }, (records) => {
      const record = records[0];
      if (!record) return null;
      const node = record.get('n') as Neo4jNode;
      const props = node.properties as Record<string, unknown>;

      // Parse properties from JSON string
      let parsedProps: Record<string, unknown> = {};
      if (typeof props.properties === 'string') {
        try {
          parsedProps = JSON.parse(props.properties);
        } catch {
          parsedProps = {};
        }
      }

      return {
        id: props.id as string,
        type: props.type as GraphNodeType,
        label: props.label as string,
        properties: parsedProps,
        embedding: props.embedding as number[] | undefined,
        createdAt: new Date(props.createdAt as string),
        updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
      };
    });
  };

  /**
   * Update a node's properties.
   */
  updateNode = async (
    id: string,
    updates: Partial<Omit<GraphNodeInput, 'id'>>
  ): Promise<GraphNode> => {
    // Check node exists
    const existing = await this.getNode(id);
    if (!existing) {
      throw GraphStoreError.nodeNotFound(this.name, id);
    }

    const now = new Date().toISOString();

    // Build SET clauses dynamically
    const setClauses: string[] = ['n.updatedAt = $updatedAt'];
    const params: Record<string, unknown> = { id, updatedAt: now };

    if (updates.type !== undefined) {
      setClauses.push('n.type = $type');
      params.type = updates.type;
    }
    if (updates.label !== undefined) {
      setClauses.push('n.label = $nodeLabel');
      params.nodeLabel = updates.label;
    }
    if (updates.properties !== undefined) {
      // Merge properties
      const merged = { ...existing.properties, ...updates.properties };
      setClauses.push('n.properties = $properties');
      params.properties = JSON.stringify(merged);
    }
    if (updates.embedding !== undefined) {
      setClauses.push('n.embedding = $embedding');
      params.embedding = updates.embedding;
    }

    const cypher = `
      MATCH (n {id: $id})
      SET ${setClauses.join(', ')}
      RETURN n
    `;

    return this.runQuery(cypher, params, (records) => {
      const record = records[0];
      if (!record) {
        throw GraphStoreError.updateFailed(this.name, 'No record returned from update');
      }
      const node = record.get('n') as Neo4jNode;
      const props = node.properties as Record<string, unknown>;

      let parsedProps: Record<string, unknown> = {};
      if (typeof props.properties === 'string') {
        try {
          parsedProps = JSON.parse(props.properties);
        } catch {
          parsedProps = {};
        }
      }

      return {
        id: props.id as string,
        type: props.type as GraphNodeType,
        label: props.label as string,
        properties: parsedProps,
        embedding: props.embedding as number[] | undefined,
        createdAt: new Date(props.createdAt as string),
        updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
      };
    });
  };

  /**
   * Delete a node and all connected edges.
   */
  deleteNode = async (id: string): Promise<void> => {
    // Check node exists
    const existing = await this.getNode(id);
    if (!existing) {
      throw GraphStoreError.nodeNotFound(this.name, id);
    }

    // DETACH DELETE removes the node and all its relationships
    const cypher = `
      MATCH (n {id: $id})
      DETACH DELETE n
    `;

    await this.runQuery(cypher, { id }, () => null);
  };

  // ==========================================================================
  // Bulk Node Operations
  // ==========================================================================

  /**
   * Check if a node exists by ID.
   *
   * Uses COUNT to avoid fetching full node data.
   */
  hasNode = async (id: string): Promise<boolean> => {
    const cypher = `
      MATCH (n {id: $id})
      RETURN count(n) > 0 AS exists
    `;
    return this.runQuery(cypher, { id }, (records) => {
      return records[0]?.get('exists') ?? false;
    });
  };

  /**
   * Check if multiple nodes exist by IDs.
   *
   * Uses UNWIND for efficient batch querying.
   */
  hasNodes = async (ids: string[]): Promise<Map<string, boolean>> => {
    if (ids.length === 0) return new Map();

    const cypher = `
      UNWIND $ids AS nodeId
      OPTIONAL MATCH (n {id: nodeId})
      RETURN nodeId, n IS NOT NULL AS exists
    `;

    return this.runQuery(cypher, { ids }, (records) => {
      const result = new Map<string, boolean>();
      for (const record of records) {
        result.set(record.get('nodeId') as string, record.get('exists') as boolean);
      }
      return result;
    });
  };

  /**
   * Get multiple nodes by IDs.
   *
   * Returns nodes in the same order as input IDs.
   */
  getNodes = async (ids: string[]): Promise<(GraphNode | null)[]> => {
    if (ids.length === 0) return [];

    // Query all nodes, preserving order via UNWIND
    const cypher = `
      UNWIND $ids AS nodeId
      OPTIONAL MATCH (n {id: nodeId})
      RETURN nodeId, n
    `;

    const nodeMap = await this.runQuery(cypher, { ids }, (records) => {
      const map = new Map<string, GraphNode | null>();

      for (const record of records) {
        const nodeId = record.get('nodeId') as string;
        const node = record.get('n') as Neo4jNode | null;

        if (!node) {
          map.set(nodeId, null);
          continue;
        }

        const props = node.properties as Record<string, unknown>;
        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        map.set(nodeId, {
          id: props.id as string,
          type: props.type as GraphNodeType,
          label: props.label as string,
          properties: parsedProps,
          embedding: props.embedding as number[] | undefined,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt
            ? new Date(props.updatedAt as string)
            : undefined,
        });
      }

      return map;
    });

    // Return in original order
    return ids.map((id) => nodeMap.get(id) ?? null);
  };

  /**
   * Create or update a node based on ID.
   *
   * Uses Neo4j MERGE with ON CREATE/ON MATCH for atomic upsert.
   */
  upsertNode = async (
    node: GraphNodeInput & { id: string }
  ): Promise<GraphNode> => {
    const validated = UpsertNodeInputSchema.parse(node);
    const now = new Date().toISOString();
    const label = nodeTypeToLabel(validated.type);

    // Check capacity for potential new node
    if (this.maxNodes > 0) {
      const existing = await this.getNode(validated.id);
      if (!existing) {
        const { nodes } = await this.count();
        if (nodes >= this.maxNodes) {
          throw GraphStoreError.capacityExceeded(this.name, 'nodes', this.maxNodes);
        }
      }
    }

    // MERGE: create if not exists, update if exists
    const cypher = `
      MERGE (n {id: $id})
      ON CREATE SET
        n:${label},
        n.type = $type,
        n.label = $nodeLabel,
        n.properties = $properties,
        n.embedding = $embedding,
        n.createdAt = $now
      ON MATCH SET
        n.type = $type,
        n.label = $nodeLabel,
        n.properties = $properties,
        n.embedding = $embedding,
        n.updatedAt = $now
      RETURN n
    `;

    return this.runQuery(
      cypher,
      {
        id: validated.id,
        type: validated.type,
        nodeLabel: validated.label,
        properties: JSON.stringify(validated.properties ?? {}),
        embedding: validated.embedding ?? null,
        now,
      },
      (records) => {
        const record = records[0];
        if (!record) {
          throw GraphStoreError.insertFailed(this.name, 'No record returned from upsert');
        }

        const n = record.get('n') as Neo4jNode;
        const props = n.properties as Record<string, unknown>;

        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        return {
          id: props.id as string,
          type: props.type as GraphNodeType,
          label: props.label as string,
          properties: parsedProps,
          embedding: props.embedding as number[] | undefined,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt
            ? new Date(props.updatedAt as string)
            : undefined,
        };
      }
    );
  };

  /**
   * Create or update multiple nodes.
   *
   * Uses a transaction for atomicity.
   */
  upsertNodes = async (
    nodes: (GraphNodeInput & { id: string })[]
  ): Promise<GraphNode[]> => {
    if (nodes.length === 0) return [];

    // Validate all nodes first
    const validatedNodes = nodes.map((node, index) => {
      const validated = UpsertNodeInputSchema.safeParse(node);
      if (!validated.success) {
        throw GraphStoreError.invalidNode(
          this.name,
          `Node at index ${index}: ${validated.error.message}`
        );
      }
      return validated.data;
    });

    const session = this.getSession();
    try {
      const tx = session.beginTransaction();
      const results: GraphNode[] = [];

      try {
        const now = new Date().toISOString();

        for (const node of validatedNodes) {
          const label = nodeTypeToLabel(node.type);
          const cypher = `
            MERGE (n {id: $id})
            ON CREATE SET
              n:${label},
              n.type = $type,
              n.label = $nodeLabel,
              n.properties = $properties,
              n.embedding = $embedding,
              n.createdAt = $now
            ON MATCH SET
              n.type = $type,
              n.label = $nodeLabel,
              n.properties = $properties,
              n.embedding = $embedding,
              n.updatedAt = $now
            RETURN n
          `;

          const result = await tx.run(cypher, {
            id: node.id,
            type: node.type,
            nodeLabel: node.label,
            properties: JSON.stringify(node.properties ?? {}),
            embedding: node.embedding ?? null,
            now,
          });

          const record = result.records[0];
          if (!record) {
            throw GraphStoreError.insertFailed(this.name, 'No record returned from upsert');
          }
          const n = record.get('n') as Neo4jNode;
          const props = n.properties as Record<string, unknown>;

          let parsedProps: Record<string, unknown> = {};
          if (typeof props.properties === 'string') {
            try {
              parsedProps = JSON.parse(props.properties);
            } catch {
              parsedProps = {};
            }
          }

          results.push({
            id: props.id as string,
            type: props.type as GraphNodeType,
            label: props.label as string,
            properties: parsedProps,
            embedding: props.embedding as number[] | undefined,
            createdAt: new Date(props.createdAt as string),
            updatedAt: props.updatedAt
              ? new Date(props.updatedAt as string)
              : undefined,
          });
        }

        await tx.commit();
        return results;
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    } finally {
      await session.close();
    }
  };

  /**
   * Update multiple nodes atomically.
   *
   * Uses Neo4j transactions for atomicity.
   */
  bulkUpdateNodes = async (
    updates: BulkNodeUpdate[],
    options?: BulkUpdateOptions
  ): Promise<BulkOperationResult> => {
    const opts = BulkUpdateOptionsSchema.parse(options ?? {});

    if (updates.length === 0) {
      return { successCount: 0, successIds: [], failedCount: 0, failedIds: [] };
    }

    // Validate all updates
    for (const update of updates) {
      BulkNodeUpdateSchema.parse(update);
    }

    if (!opts.continueOnError) {
      // ATOMIC: Use transaction
      const session = this.getSession();
      try {
        const tx = session.beginTransaction();
        try {
          const now = new Date().toISOString();
          const successIds: string[] = [];

          for (const update of updates) {
            // Check node exists
            const checkResult = await tx.run(
              'MATCH (n {id: $id}) RETURN n',
              { id: update.id }
            );
            if (checkResult.records.length === 0) {
              throw new Error(`Node not found: ${update.id}`);
            }

            // Build dynamic SET clauses
            const setClauses = ['n.updatedAt = $updatedAt'];
            const params: Record<string, unknown> = {
              id: update.id,
              updatedAt: now,
            };

            if (update.updates.type !== undefined) {
              setClauses.push('n.type = $type');
              params.type = update.updates.type;
            }
            if (update.updates.label !== undefined) {
              setClauses.push('n.label = $nodeLabel');
              params.nodeLabel = update.updates.label;
            }
            if (update.updates.properties !== undefined) {
              setClauses.push('n.properties = $properties');
              params.properties = JSON.stringify(update.updates.properties);
            }
            if (update.updates.embedding !== undefined) {
              setClauses.push('n.embedding = $embedding');
              params.embedding = update.updates.embedding;
            }

            await tx.run(
              `MATCH (n {id: $id}) SET ${setClauses.join(', ')}`,
              params
            );
            successIds.push(update.id);
          }

          await tx.commit();
          return {
            successCount: successIds.length,
            successIds,
            failedCount: 0,
            failedIds: [],
          };
        } catch (error) {
          await tx.rollback();
          throw GraphStoreError.transactionFailed(
            this.name,
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
      } finally {
        await session.close();
      }
    } else {
      // NON-ATOMIC: Continue on errors
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const update of updates) {
        try {
          await this.updateNode(update.id, update.updates);
          successIds.push(update.id);
        } catch {
          failedIds.push(update.id);
        }
      }

      return {
        successCount: successIds.length,
        successIds,
        failedCount: failedIds.length,
        failedIds,
      };
    }
  };

  /**
   * Delete multiple nodes atomically.
   *
   * Uses Neo4j transactions. DETACH DELETE cascades to edges.
   */
  bulkDeleteNodes = async (
    ids: string[],
    options?: BulkDeleteOptions
  ): Promise<BulkOperationResult> => {
    const opts = BulkDeleteOptionsSchema.parse(options ?? {});

    if (ids.length === 0) {
      return { successCount: 0, successIds: [], failedCount: 0, failedIds: [] };
    }

    if (!opts.continueOnError) {
      // ATOMIC: Use transaction
      const session = this.getSession();
      try {
        const tx = session.beginTransaction();
        try {
          const successIds: string[] = [];

          for (const id of ids) {
            // Check node exists
            const checkResult = await tx.run(
              'MATCH (n {id: $id}) RETURN n',
              { id }
            );

            if (checkResult.records.length === 0) {
              if (!opts.skipMissing) {
                throw new Error(`Node not found: ${id}`);
              }
              // Skip missing nodes but don't count as success
              continue;
            }

            // DETACH DELETE removes node and all relationships
            await tx.run('MATCH (n {id: $id}) DETACH DELETE n', { id });
            successIds.push(id);
          }

          await tx.commit();
          return {
            successCount: successIds.length,
            successIds,
            failedCount: 0,
            failedIds: [],
          };
        } catch (error) {
          await tx.rollback();
          throw GraphStoreError.transactionFailed(
            this.name,
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
      } finally {
        await session.close();
      }
    } else {
      // NON-ATOMIC: Continue on errors
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const id of ids) {
        try {
          const existing = await this.getNode(id);
          if (!existing) {
            // With skipMissing, silently skip - don't count as success or failure
            if (!opts.skipMissing) {
              failedIds.push(id);
            }
            continue;
          }
          await this.deleteNode(id);
          successIds.push(id);
        } catch {
          failedIds.push(id);
        }
      }

      return {
        successCount: successIds.length,
        successIds,
        failedCount: failedIds.length,
        failedIds,
      };
    }
  };

  // ==========================================================================
  // Edge Operations
  // ==========================================================================

  /**
   * Add an edge between two nodes.
   */
  addEdge = async (edge: GraphEdgeInput): Promise<string> => {
    // Validate input
    const validated = GraphEdgeInputSchema.safeParse(edge);
    if (!validated.success) {
      throw GraphStoreError.invalidEdge(this.name, validated.error.message);
    }

    // Check source node exists
    const sourceNode = await this.getNode(validated.data.source);
    if (!sourceNode) {
      throw GraphStoreError.invalidEdge(
        this.name,
        `source node not found: ${validated.data.source}`
      );
    }

    // Check target node exists
    const targetNode = await this.getNode(validated.data.target);
    if (!targetNode) {
      throw GraphStoreError.invalidEdge(
        this.name,
        `target node not found: ${validated.data.target}`
      );
    }

    // Check capacity
    if (this.maxEdges > 0) {
      const { edges } = await this.count();
      if (edges >= this.maxEdges) {
        throw GraphStoreError.capacityExceeded(this.name, 'edges', this.maxEdges);
      }
    }

    const id = validated.data.id ?? generateId('edge');
    const now = new Date().toISOString();
    const relType = edgeTypeToRelType(validated.data.type);

    // Check for duplicate ID
    const existing = await this.getEdge(id);
    if (existing) {
      throw GraphStoreError.duplicateEdge(this.name, id);
    }

    const cypher = `
      MATCH (a {id: $sourceId}), (b {id: $targetId})
      CREATE (a)-[r:${relType} {
        id: $id,
        type: $type,
        weight: $weight,
        properties: $properties,
        createdAt: $createdAt
      }]->(b)
      RETURN r
    `;

    await this.runQuery(
      cypher,
      {
        sourceId: validated.data.source,
        targetId: validated.data.target,
        id,
        type: validated.data.type,
        weight: validated.data.weight ?? null,
        properties: JSON.stringify(validated.data.properties ?? {}),
        createdAt: now,
      },
      () => null
    );

    return id;
  };

  /**
   * Add multiple edges in a single transaction.
   */
  addEdges = async (edges: GraphEdgeInput[]): Promise<string[]> => {
    if (edges.length === 0) return [];

    // Validate all edges first
    const validatedEdges = edges.map((edge, index) => {
      const validated = GraphEdgeInputSchema.safeParse(edge);
      if (!validated.success) {
        throw GraphStoreError.invalidEdge(
          this.name,
          `Edge at index ${index}: ${validated.error.message}`
        );
      }
      return validated.data;
    });

    // Verify all source/target nodes exist
    for (const edge of validatedEdges) {
      const sourceNode = await this.getNode(edge.source);
      if (!sourceNode) {
        throw GraphStoreError.invalidEdge(
          this.name,
          `source node not found: ${edge.source}`
        );
      }
      const targetNode = await this.getNode(edge.target);
      if (!targetNode) {
        throw GraphStoreError.invalidEdge(
          this.name,
          `target node not found: ${edge.target}`
        );
      }
    }

    // Check capacity
    if (this.maxEdges > 0) {
      const { edges: currentCount } = await this.count();
      if (currentCount + validatedEdges.length > this.maxEdges) {
        throw GraphStoreError.capacityExceeded(this.name, 'edges', this.maxEdges);
      }
    }

    const now = new Date().toISOString();
    const edgeData = validatedEdges.map((edge) => ({
      id: edge.id ?? generateId('edge'),
      source: edge.source,
      target: edge.target,
      type: edge.type,
      relType: edgeTypeToRelType(edge.type),
      weight: edge.weight ?? null,
      properties: JSON.stringify(edge.properties ?? {}),
      createdAt: now,
    }));

    // Check for duplicate IDs
    for (const edge of edgeData) {
      const existing = await this.getEdge(edge.id);
      if (existing) {
        throw GraphStoreError.duplicateEdge(this.name, edge.id);
      }
    }

    const session = this.getSession();
    try {
      const tx = session.beginTransaction();
      try {
        for (const edge of edgeData) {
          const cypher = `
            MATCH (a {id: $sourceId}), (b {id: $targetId})
            CREATE (a)-[r:${edge.relType} {
              id: $id,
              type: $type,
              weight: $weight,
              properties: $properties,
              createdAt: $createdAt
            }]->(b)
          `;
          await tx.run(cypher, {
            sourceId: edge.source,
            targetId: edge.target,
            id: edge.id,
            type: edge.type,
            weight: edge.weight,
            properties: edge.properties,
            createdAt: edge.createdAt,
          });
        }
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    } finally {
      await session.close();
    }

    return edgeData.map((e) => e.id);
  };

  /**
   * Get an edge by ID.
   */
  getEdge = async (id: string): Promise<GraphEdge | null> => {
    const cypher = `
      MATCH (a)-[r {id: $id}]->(b)
      RETURN r, a.id as sourceId, b.id as targetId
    `;

    return this.runQuery(cypher, { id }, (records) => {
      const record = records[0];
      if (!record) return null;
      const rel = record.get('r') as Neo4jRelationship;
      const sourceId = record.get('sourceId') as string;
      const targetId = record.get('targetId') as string;
      const props = rel.properties as Record<string, unknown>;

      let parsedProps: Record<string, unknown> = {};
      if (typeof props.properties === 'string') {
        try {
          parsedProps = JSON.parse(props.properties);
        } catch {
          parsedProps = {};
        }
      }

      return {
        id: props.id as string,
        source: sourceId,
        target: targetId,
        type: props.type as GraphEdgeType,
        weight: props.weight as number | undefined,
        properties: parsedProps,
        createdAt: new Date(props.createdAt as string),
        updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
      };
    });
  };

  /**
   * Update an edge's properties.
   */
  updateEdge = async (
    id: string,
    updates: Partial<Omit<GraphEdgeInput, 'id' | 'source' | 'target'>>
  ): Promise<GraphEdge> => {
    // Check edge exists
    const existing = await this.getEdge(id);
    if (!existing) {
      throw GraphStoreError.edgeNotFound(this.name, id);
    }

    const now = new Date().toISOString();

    // Build SET clauses dynamically
    const setClauses: string[] = ['r.updatedAt = $updatedAt'];
    const params: Record<string, unknown> = { id, updatedAt: now };

    if (updates.type !== undefined) {
      setClauses.push('r.type = $type');
      params.type = updates.type;
    }
    if (updates.weight !== undefined) {
      setClauses.push('r.weight = $weight');
      params.weight = updates.weight;
    }
    if (updates.properties !== undefined) {
      // Merge properties
      const merged = { ...existing.properties, ...updates.properties };
      setClauses.push('r.properties = $properties');
      params.properties = JSON.stringify(merged);
    }

    const cypher = `
      MATCH (a)-[r {id: $id}]->(b)
      SET ${setClauses.join(', ')}
      RETURN r, a.id as sourceId, b.id as targetId
    `;

    return this.runQuery(cypher, params, (records) => {
      const record = records[0];
      if (!record) {
        throw GraphStoreError.updateFailed(this.name, 'No record returned from update');
      }
      const rel = record.get('r') as Neo4jRelationship;
      const sourceId = record.get('sourceId') as string;
      const targetId = record.get('targetId') as string;
      const props = rel.properties as Record<string, unknown>;

      let parsedProps: Record<string, unknown> = {};
      if (typeof props.properties === 'string') {
        try {
          parsedProps = JSON.parse(props.properties);
        } catch {
          parsedProps = {};
        }
      }

      return {
        id: props.id as string,
        source: sourceId,
        target: targetId,
        type: props.type as GraphEdgeType,
        weight: props.weight as number | undefined,
        properties: parsedProps,
        createdAt: new Date(props.createdAt as string),
        updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
      };
    });
  };

  /**
   * Delete an edge.
   */
  deleteEdge = async (id: string): Promise<void> => {
    // Check edge exists
    const existing = await this.getEdge(id);
    if (!existing) {
      throw GraphStoreError.edgeNotFound(this.name, id);
    }

    const cypher = `
      MATCH ()-[r {id: $id}]->()
      DELETE r
    `;

    await this.runQuery(cypher, { id }, () => null);
  };

  // ==========================================================================
  // Bulk Edge Operations
  // ==========================================================================

  /**
   * Check if an edge exists by ID.
   */
  hasEdge = async (id: string): Promise<boolean> => {
    const cypher = `
      MATCH ()-[r {id: $id}]->()
      RETURN COUNT(r) > 0 AS exists
    `;

    return this.runQuery(cypher, { id }, (records) => {
      const first = records[0];
      if (!first) return false;
      return first.get('exists') as boolean;
    });
  };

  /**
   * Check if multiple edges exist by IDs.
   */
  hasEdges = async (ids: string[]): Promise<Map<string, boolean>> => {
    if (ids.length === 0) {
      return new Map();
    }

    const cypher = `
      UNWIND $ids AS edgeId
      OPTIONAL MATCH ()-[r {id: edgeId}]->()
      RETURN edgeId, r IS NOT NULL AS exists
    `;

    return this.runQuery(cypher, { ids }, (records) => {
      const result = new Map<string, boolean>();
      for (const record of records) {
        const edgeId = record.get('edgeId') as string;
        const exists = record.get('exists') as boolean;
        result.set(edgeId, exists);
      }
      return result;
    });
  };

  /**
   * Get multiple edges by their IDs.
   */
  getEdges = async (ids: string[]): Promise<(GraphEdge | null)[]> => {
    if (ids.length === 0) {
      return [];
    }

    const cypher = `
      UNWIND $ids AS edgeId
      OPTIONAL MATCH (s)-[r {id: edgeId}]->(t)
      RETURN edgeId, r, s.id AS source, t.id AS target
    `;

    const edgeMap = await this.runQuery(cypher, { ids }, (records) => {
      const map = new Map<string, GraphEdge | null>();
      for (const record of records) {
        const edgeId = record.get('edgeId') as string;
        const rel = record.get('r') as Neo4jRelationship | null;
        if (rel) {
          const source = record.get('source') as string;
          const target = record.get('target') as string;
          const props = rel.properties as Record<string, unknown>;

          // Parse properties JSON
          let parsedProps: Record<string, unknown> = {};
          if (typeof props.properties === 'string') {
            try {
              parsedProps = JSON.parse(props.properties);
            } catch {
              parsedProps = {};
            }
          }

          const edge: GraphEdge = {
            id: props.id as string,
            source,
            target,
            type: props.type as GraphEdgeType,
            weight: props.weight as number | undefined,
            properties: parsedProps,
            createdAt: new Date(props.createdAt as string),
            updatedAt: props.updatedAt
              ? new Date(props.updatedAt as string)
              : undefined,
          };
          map.set(edgeId, edge);
        } else {
          map.set(edgeId, null);
        }
      }
      return map;
    });

    // Return in same order as input
    return ids.map((id) => edgeMap.get(id) ?? null);
  };

  /**
   * Create or update an edge based on ID.
   *
   * If the edge exists, updates type/weight/properties (source/target are immutable).
   * If the edge doesn't exist, creates a new edge.
   */
  upsertEdge = async (
    input: GraphEdgeInput & { id: string }
  ): Promise<GraphEdge> => {
    // Validate with schema that requires ID
    const validated = UpsertEdgeInputSchema.parse(input);

    const existing = await this.getEdge(validated.id);
    if (existing) {
      // Update existing edge (source/target preserved from existing)
      return this.updateEdge(validated.id, {
        type: validated.type,
        weight: validated.weight,
        properties: validated.properties,
      });
    } else {
      // Create new edge
      await this.addEdge(validated);
      const created = await this.getEdge(validated.id);
      if (!created) {
        throw GraphStoreError.insertFailed(
          this.name,
          `Failed to create edge: ${validated.id}`
        );
      }
      return created;
    }
  };

  /**
   * Create or update multiple edges based on IDs.
   */
  upsertEdges = async (
    inputs: (GraphEdgeInput & { id: string })[]
  ): Promise<GraphEdge[]> => {
    const results: GraphEdge[] = [];
    for (const input of inputs) {
      const edge = await this.upsertEdge(input);
      results.push(edge);
    }
    return results;
  };

  /**
   * Update multiple edges atomically.
   *
   * Uses Neo4j transactions for atomicity.
   * Edge source/target are immutable - only type, weight, properties can be updated.
   */
  bulkUpdateEdges = async (
    updates: BulkEdgeUpdate[],
    options?: BulkUpdateOptions
  ): Promise<BulkOperationResult> => {
    const opts = BulkUpdateOptionsSchema.parse(options ?? {});

    if (updates.length === 0) {
      return { successCount: 0, successIds: [], failedCount: 0, failedIds: [] };
    }

    // Validate all updates
    for (const update of updates) {
      BulkEdgeUpdateSchema.parse(update);
    }

    if (!opts.continueOnError) {
      // ATOMIC: Use transaction
      const session = this.getSession();
      try {
        const tx = session.beginTransaction();
        try {
          const now = new Date().toISOString();
          const successIds: string[] = [];

          for (const update of updates) {
            // Check edge exists
            const checkResult = await tx.run(
              'MATCH ()-[r {id: $id}]->() RETURN r',
              { id: update.id }
            );
            if (checkResult.records.length === 0) {
              throw new Error(`Edge not found: ${update.id}`);
            }

            // Build dynamic SET clauses
            const setClauses = ['r.updatedAt = $updatedAt'];
            const params: Record<string, unknown> = {
              id: update.id,
              updatedAt: now,
            };

            if (update.updates.type !== undefined) {
              setClauses.push('r.type = $type');
              params.type = update.updates.type;
            }
            if (update.updates.weight !== undefined) {
              setClauses.push('r.weight = $weight');
              params.weight = update.updates.weight;
            }
            if (update.updates.properties !== undefined) {
              setClauses.push('r.properties = $properties');
              params.properties = JSON.stringify(update.updates.properties);
            }

            await tx.run(
              `MATCH ()-[r {id: $id}]->() SET ${setClauses.join(', ')}`,
              params
            );
            successIds.push(update.id);
          }

          await tx.commit();
          return {
            successCount: successIds.length,
            successIds,
            failedCount: 0,
            failedIds: [],
          };
        } catch (error) {
          await tx.rollback();
          throw GraphStoreError.transactionFailed(
            this.name,
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
      } finally {
        await session.close();
      }
    } else {
      // NON-ATOMIC: Continue on errors
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const update of updates) {
        try {
          await this.updateEdge(update.id, update.updates);
          successIds.push(update.id);
        } catch {
          failedIds.push(update.id);
        }
      }

      return {
        successCount: successIds.length,
        successIds,
        failedCount: failedIds.length,
        failedIds,
      };
    }
  };

  /**
   * Delete multiple edges atomically.
   *
   * Uses Neo4j transactions for atomicity.
   */
  bulkDeleteEdges = async (
    ids: string[],
    options?: BulkDeleteOptions
  ): Promise<BulkOperationResult> => {
    const opts = BulkDeleteOptionsSchema.parse(options ?? {});

    if (ids.length === 0) {
      return { successCount: 0, successIds: [], failedCount: 0, failedIds: [] };
    }

    if (!opts.continueOnError) {
      // ATOMIC: Use transaction
      const session = this.getSession();
      try {
        const tx = session.beginTransaction();
        try {
          const successIds: string[] = [];

          for (const id of ids) {
            // Check edge exists
            const checkResult = await tx.run(
              'MATCH ()-[r {id: $id}]->() RETURN r',
              { id }
            );

            if (checkResult.records.length === 0) {
              if (!opts.skipMissing) {
                throw new Error(`Edge not found: ${id}`);
              }
              // Skip missing edges but don't count as success
              continue;
            }

            // Delete the edge
            await tx.run('MATCH ()-[r {id: $id}]->() DELETE r', { id });
            successIds.push(id);
          }

          await tx.commit();
          return {
            successCount: successIds.length,
            successIds,
            failedCount: 0,
            failedIds: [],
          };
        } catch (error) {
          await tx.rollback();
          throw GraphStoreError.transactionFailed(
            this.name,
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error : undefined
          );
        }
      } finally {
        await session.close();
      }
    } else {
      // NON-ATOMIC: Continue on errors
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const id of ids) {
        try {
          const existing = await this.getEdge(id);
          if (existing) {
            await this.deleteEdge(id);
            successIds.push(id);
          } else if (!opts.skipMissing) {
            // Only count as failure if we're NOT skipping missing
            failedIds.push(id);
          }
          // With skipMissing, silently skip
        } catch {
          failedIds.push(id);
        }
      }

      return {
        successCount: successIds.length,
        successIds,
        failedCount: failedIds.length,
        failedIds,
      };
    }
  };

  // ==========================================================================
  // Traversal Operations
  // ==========================================================================

  /**
   * Get all neighbors of a node within the specified depth.
   */
  getNeighbors = async (
    nodeId: string,
    options?: GetNeighborsOptions
  ): Promise<NeighborResult[]> => {
    // Validate options
    const validated = GetNeighborsOptionsSchema.safeParse(options ?? {});
    if (!validated.success) {
      throw GraphStoreError.queryFailed(this.name, validated.error.message);
    }

    // Check node exists
    const startNode = await this.getNode(nodeId);
    if (!startNode) {
      throw GraphStoreError.nodeNotFound(this.name, nodeId);
    }

    const opts = validated.data;
    const depth = opts.depth ?? 1;
    const direction = opts.direction ?? 'both';

    // Build direction pattern for Cypher
    let relationPattern: string;
    switch (direction) {
      case 'outgoing':
        relationPattern = `-[r*1..${depth}]->`;
        break;
      case 'incoming':
        relationPattern = `<-[r*1..${depth}]-`;
        break;
      case 'both':
      default:
        relationPattern = `-[r*1..${depth}]-`;
        break;
    }

    // Build WHERE clauses for filtering
    const whereClauses: string[] = ['neighbor.id <> $nodeId']; // Exclude start node
    const params: Record<string, unknown> = { nodeId };

    if (opts.edgeTypes && opts.edgeTypes.length > 0) {
      // Neo4j relationship types are uppercase
      const relTypes = opts.edgeTypes.map((t) => edgeTypeToRelType(t));
      whereClauses.push(`ALL(rel IN r WHERE type(rel) IN $edgeTypes)`);
      params.edgeTypes = relTypes;
    }

    if (opts.nodeTypes && opts.nodeTypes.length > 0) {
      const labels = opts.nodeTypes.map((t) => nodeTypeToLabel(t));
      whereClauses.push(`ANY(label IN labels(neighbor) WHERE label IN $nodeTypes)`);
      params.nodeTypes = labels;
    }

    if (opts.minWeight !== undefined) {
      whereClauses.push(`ALL(rel IN r WHERE rel.weight IS NULL OR rel.weight >= $minWeight)`);
      params.minWeight = opts.minWeight;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const limitClause = opts.limit ? `LIMIT ${opts.limit}` : '';

    // Use shortestPath for BFS-like traversal and to get actual depth
    const cypher = `
      MATCH path = (start {id: $nodeId})${relationPattern}(neighbor)
      ${whereClause}
      WITH neighbor, relationships(path) as rels, length(path) as depth
      ORDER BY depth
      ${limitClause}
      RETURN DISTINCT neighbor, rels, depth
    `;

    return this.runQuery(cypher, params, (records) => {
      const results: NeighborResult[] = [];
      const seenNodeIds = new Set<string>();

      for (const record of records) {
        const neighborNode = record.get('neighbor') as Neo4jNode;
        const neighborProps = neighborNode.properties as Record<string, unknown>;
        const neighborId = neighborProps.id as string;

        // Skip if we've already seen this node (deduplication)
        if (seenNodeIds.has(neighborId)) continue;
        seenNodeIds.add(neighborId);

        const rels = record.get('rels') as Neo4jRelationship[];
        const pathDepth = toNumber(record.get('depth'));

        // Get the last edge in the path (the one connecting to this neighbor)
        const lastRel = rels[rels.length - 1];
        if (!lastRel) continue; // Skip if no relationship found

        const relProps = lastRel.properties as Record<string, unknown>;

        // Determine source/target based on direction
        // If the relationship's start node is NOT the neighbor, then central node is the start
        // meaning this edge is outgoing FROM central TO neighbor
        const startNodeId = toNumber(lastRel.start);
        const isOutgoing = startNodeId !== toNumber(neighborNode.identity);

        let parsedNodeProps: Record<string, unknown> = {};
        if (typeof neighborProps.properties === 'string') {
          try {
            parsedNodeProps = JSON.parse(neighborProps.properties);
          } catch {
            parsedNodeProps = {};
          }
        }

        let parsedEdgeProps: Record<string, unknown> = {};
        if (typeof relProps.properties === 'string') {
          try {
            parsedEdgeProps = JSON.parse(relProps.properties);
          } catch {
            parsedEdgeProps = {};
          }
        }

        results.push({
          node: {
            id: neighborId,
            type: neighborProps.type as GraphNodeType,
            label: neighborProps.label as string,
            properties: parsedNodeProps,
            embedding: neighborProps.embedding as number[] | undefined,
            createdAt: new Date(neighborProps.createdAt as string),
            updatedAt: neighborProps.updatedAt
              ? new Date(neighborProps.updatedAt as string)
              : undefined,
          },
          edge: {
            id: relProps.id as string,
            source: isOutgoing ? neighborId : nodeId,
            target: isOutgoing ? nodeId : neighborId,
            type: relProps.type as GraphEdgeType,
            weight: relProps.weight as number | undefined,
            properties: parsedEdgeProps,
            createdAt: new Date(relProps.createdAt as string),
            updatedAt: relProps.updatedAt
              ? new Date(relProps.updatedAt as string)
              : undefined,
          },
          depth: pathDepth,
        });
      }

      return results;
    });
  };

  /**
   * Get all edges connected to a node.
   */
  getEdgesForNode = async (
    nodeId: string,
    direction: TraversalDirection = 'both'
  ): Promise<GraphEdge[]> => {
    // Check node exists
    const node = await this.getNode(nodeId);
    if (!node) {
      throw GraphStoreError.nodeNotFound(this.name, nodeId);
    }

    let cypher: string;
    switch (direction) {
      case 'outgoing':
        cypher = `
          MATCH (a {id: $nodeId})-[r]->(b)
          RETURN r, a.id as sourceId, b.id as targetId
        `;
        break;
      case 'incoming':
        cypher = `
          MATCH (a)-[r]->(b {id: $nodeId})
          RETURN r, a.id as sourceId, b.id as targetId
        `;
        break;
      case 'both':
      default:
        cypher = `
          MATCH (a {id: $nodeId})-[r]->(b)
          RETURN r, a.id as sourceId, b.id as targetId
          UNION
          MATCH (a)-[r]->(b {id: $nodeId})
          RETURN r, a.id as sourceId, b.id as targetId
        `;
        break;
    }

    return this.runQuery(cypher, { nodeId }, (records) => {
      const edges: GraphEdge[] = [];
      const seenIds = new Set<string>();

      for (const record of records) {
        const rel = record.get('r') as Neo4jRelationship;
        const sourceId = record.get('sourceId') as string;
        const targetId = record.get('targetId') as string;
        const props = rel.properties as Record<string, unknown>;
        const edgeId = props.id as string;

        // Deduplicate (UNION may return same edge twice for self-loops)
        if (seenIds.has(edgeId)) continue;
        seenIds.add(edgeId);

        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: props.type as GraphEdgeType,
          weight: props.weight as number | undefined,
          properties: parsedProps,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
        });
      }

      return edges;
    });
  };

  /**
   * Find the shortest path between two nodes.
   *
   * Uses Cypher's shortestPath for hop-based shortest path,
   * then calculates weighted cost. For true weighted shortest path
   * in Neo4j, consider using APOC's dijkstra algorithm.
   *
   * @param sourceId - Starting node ID
   * @param targetId - Destination node ID
   * @param options - Path finding options
   * @returns PathResult if path exists, null if no path found
   * @throws {GraphStoreError} If source or target node doesn't exist
   */
  findShortestPath = async (
    sourceId: string,
    targetId: string,
    options?: ShortestPathOptions
  ): Promise<PathResult | null> => {
    // 1. Validate and parse options
    const opts = ShortestPathOptionsSchema.parse(options ?? {});

    // 2. Validate source node exists
    const sourceNode = await this.getNode(sourceId);
    if (!sourceNode) {
      throw GraphStoreError.nodeNotFound(this.name, sourceId);
    }

    // 3. Validate target node exists
    const targetNode = await this.getNode(targetId);
    if (!targetNode) {
      throw GraphStoreError.nodeNotFound(this.name, targetId);
    }

    // 4. Handle trivial case: source equals target
    if (sourceId === targetId) {
      return {
        nodes: [sourceNode],
        edges: [],
        totalCost: 0,
        length: 0,
      };
    }

    // 5. Early termination for impossible filters
    if (opts.edgeTypes && opts.edgeTypes.length === 0) {
      return null;
    }
    // Note: Empty nodeTypes means "no intermediate nodes allowed",
    // which still permits direct paths. Don't early-terminate here.

    // 6. Build Cypher query for shortest path
    const params: Record<string, unknown> = {
      sourceId,
      targetId,
      defaultWeight: opts.defaultWeight,
    };

    // Build relationship type filter
    let relTypeFilter = '';
    if (opts.edgeTypes && opts.edgeTypes.length > 0) {
      const relTypes = opts.edgeTypes.map((t) => edgeTypeToRelType(t));
      relTypeFilter = `:${relTypes.join('|')}`;
      params.edgeTypes = opts.edgeTypes;
    }

    // Build direction pattern
    let relPattern: string;
    switch (opts.direction) {
      case 'outgoing':
        relPattern = `-[r${relTypeFilter}*1..${opts.maxDepth ?? 50}]->`;
        break;
      case 'incoming':
        relPattern = `<-[r${relTypeFilter}*1..${opts.maxDepth ?? 50}]-`;
        break;
      case 'both':
      default:
        relPattern = `-[r${relTypeFilter}*1..${opts.maxDepth ?? 50}]-`;
        break;
    }

    // Build node type filter for intermediate nodes
    let nodeTypeFilter = '';
    if (opts.nodeTypes) {
      if (opts.nodeTypes.length === 0) {
        // Empty array = no intermediate nodes allowed (direct paths only)
        nodeTypeFilter = 'AND length(p) = 1';
      } else {
        // Non-empty array = only allow these types as intermediates
        params.nodeTypes = opts.nodeTypes;
        nodeTypeFilter = `
          AND ALL(n IN nodes(p)[1..-1] WHERE n.type IN $nodeTypes)
        `;
      }
    }

    // Calculate cost expression
    // In weighted mode: sum of (1 - coalesce(r.weight, defaultWeight))
    // In unweighted mode: just count edges
    const costExpr = opts.ignoreWeights
      ? 'length(p)'
      : 'reduce(cost = 0.0, rel IN relationships(p) | cost + (1.0 - coalesce(rel.weight, $defaultWeight)))';

    const cypher = `
      MATCH (source {id: $sourceId}), (target {id: $targetId})
      MATCH p = shortestPath((source)${relPattern}(target))
      WHERE source <> target
      ${nodeTypeFilter}
      WITH p, nodes(p) as pathNodes, relationships(p) as pathRels, ${costExpr} as totalCost
      RETURN pathNodes, pathRels, totalCost, length(p) as pathLength
      ORDER BY totalCost
      LIMIT 1
    `;

    return this.runQuery(cypher, params, (records) => {
      if (records.length === 0) {
        return null;
      }

      // Safe to access [0] since we checked length above
      const record = records[0]!;
      const pathNodes = record.get('pathNodes') as Neo4jNode[];
      const pathRels = record.get('pathRels') as Neo4jRelationship[];
      const totalCost = record.get('totalCost') as number;
      const pathLengthRaw = record.get('pathLength');
      const pathLength =
        typeof pathLengthRaw === 'object' && pathLengthRaw !== null && 'low' in pathLengthRaw
          ? (pathLengthRaw as { low: number }).low
          : (pathLengthRaw as number);

      // Convert Neo4j nodes to GraphNode
      const nodes: GraphNode[] = pathNodes.map((n) => {
        const props = n.properties as Record<string, unknown>;
        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }
        return {
          id: props.id as string,
          type: props.type as GraphNodeType,
          label: props.label as string,
          properties: parsedProps,
          embedding: props.embedding as number[] | undefined,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt
            ? new Date(props.updatedAt as string)
            : undefined,
        };
      });

      // Convert Neo4j relationships to GraphEdge
      const edges: GraphEdge[] = pathRels.map((rel, i) => {
        const props = rel.properties as Record<string, unknown>;
        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }
        // edges[i] connects nodes[i] to nodes[i+1], so i+1 is always valid
        return {
          id: props.id as string,
          source: nodes[i]!.id,
          target: nodes[i + 1]!.id,
          type: props.type as GraphEdgeType,
          weight: props.weight as number | undefined,
          properties: parsedProps,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt
            ? new Date(props.updatedAt as string)
            : undefined,
        };
      });

      return {
        nodes,
        edges,
        totalCost: typeof totalCost === 'number' ? totalCost : 0,
        length: typeof pathLength === 'number' ? pathLength : edges.length,
      };
    });
  };

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Query nodes and edges by pattern.
   */
  query = async (options?: GraphQueryOptions): Promise<GraphQueryResult> => {
    // Validate options
    const validated = GraphQueryOptionsSchema.safeParse(options ?? {});
    if (!validated.success) {
      throw GraphStoreError.queryFailed(this.name, validated.error.message);
    }

    const opts = validated.data;

    // Build node query
    const nodeWhereClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (opts.nodeTypes && opts.nodeTypes.length > 0) {
      nodeWhereClauses.push('n.type IN $nodeTypes');
      params.nodeTypes = opts.nodeTypes;
    }

    if (opts.nodeFilter) {
      Object.entries(opts.nodeFilter).forEach(([key, value], index) => {
        const paramName = `nodeFilter${index}`;
        nodeWhereClauses.push(`n.properties CONTAINS $${paramName}`);
        params[paramName] = `"${key}":${JSON.stringify(value)}`;
      });
    }

    const nodeWhereClause =
      nodeWhereClauses.length > 0 ? `WHERE ${nodeWhereClauses.join(' AND ')}` : '';

    // Query nodes
    const nodeCypher = `
      MATCH (n)
      ${nodeWhereClause}
      RETURN n
    `;

    const nodes = await this.runQuery(nodeCypher, params, (records) => {
      return records.map((record) => {
        const node = record.get('n') as Neo4jNode;
        const props = node.properties as Record<string, unknown>;

        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        return {
          id: props.id as string,
          type: props.type as GraphNodeType,
          label: props.label as string,
          properties: parsedProps,
          embedding: props.embedding as number[] | undefined,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
        };
      });
    });

    // Build edge query
    const edgeWhereClauses: string[] = [];
    const edgeParams: Record<string, unknown> = {};

    if (opts.edgeTypes && opts.edgeTypes.length > 0) {
      edgeWhereClauses.push('r.type IN $edgeTypes');
      edgeParams.edgeTypes = opts.edgeTypes;
    }

    if (opts.edgeFilter) {
      Object.entries(opts.edgeFilter).forEach(([key, value], index) => {
        const paramName = `edgeFilter${index}`;
        edgeWhereClauses.push(`r.properties CONTAINS $${paramName}`);
        edgeParams[paramName] = `"${key}":${JSON.stringify(value)}`;
      });
    }

    const edgeWhereClause =
      edgeWhereClauses.length > 0 ? `WHERE ${edgeWhereClauses.join(' AND ')}` : '';

    // Query edges
    const edgeCypher = `
      MATCH (a)-[r]->(b)
      ${edgeWhereClause}
      RETURN r, a.id as sourceId, b.id as targetId
    `;

    const edges = await this.runQuery(edgeCypher, edgeParams, (records) => {
      return records.map((record) => {
        const rel = record.get('r') as Neo4jRelationship;
        const sourceId = record.get('sourceId') as string;
        const targetId = record.get('targetId') as string;
        const props = rel.properties as Record<string, unknown>;

        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        return {
          id: props.id as string,
          source: sourceId,
          target: targetId,
          type: props.type as GraphEdgeType,
          weight: props.weight as number | undefined,
          properties: parsedProps,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
        };
      });
    });

    // Apply pagination
    const totalCount = nodes.length + edges.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? nodes.length + edges.length;

    const paginatedNodes = nodes.slice(offset, offset + limit);
    const remainingLimit = limit - paginatedNodes.length;
    const edgeOffset = Math.max(0, offset - nodes.length);
    const paginatedEdges =
      remainingLimit > 0 ? edges.slice(edgeOffset, edgeOffset + remainingLimit) : [];

    return {
      nodes: paginatedNodes,
      edges: paginatedEdges,
      totalCount,
    };
  };

  /**
   * Find nodes by label (partial match, case-insensitive).
   */
  findNodesByLabel = async (
    label: string,
    options?: { type?: GraphNodeType; limit?: number }
  ): Promise<GraphNode[]> => {
    const whereClauses: string[] = ['toLower(n.label) CONTAINS toLower($label)'];
    const params: Record<string, unknown> = { label };

    if (options?.type) {
      whereClauses.push('n.type = $type');
      params.type = options.type;
    }

    const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';

    const cypher = `
      MATCH (n)
      WHERE ${whereClauses.join(' AND ')}
      RETURN n
      ${limitClause}
    `;

    return this.runQuery(cypher, params, (records) => {
      return records.map((record) => {
        const node = record.get('n') as Neo4jNode;
        const props = node.properties as Record<string, unknown>;

        let parsedProps: Record<string, unknown> = {};
        if (typeof props.properties === 'string') {
          try {
            parsedProps = JSON.parse(props.properties);
          } catch {
            parsedProps = {};
          }
        }

        return {
          id: props.id as string,
          type: props.type as GraphNodeType,
          label: props.label as string,
          properties: parsedProps,
          embedding: props.embedding as number[] | undefined,
          createdAt: new Date(props.createdAt as string),
          updatedAt: props.updatedAt ? new Date(props.updatedAt as string) : undefined,
        };
      });
    });
  };

  // ==========================================================================
  // Management Operations
  // ==========================================================================

  /**
   * Get counts of nodes and edges.
   */
  count = async (): Promise<{ nodes: number; edges: number }> => {
    const nodeCypher = 'MATCH (n) RETURN count(n) as count';
    const edgeCypher = 'MATCH ()-[r]->() RETURN count(r) as count';

    const [nodeCount, edgeCount] = await Promise.all([
      this.runQuery(nodeCypher, {}, (records) => {
        const record = records[0];
        return record ? toNumber(record.get('count')) : 0;
      }),
      this.runQuery(edgeCypher, {}, (records) => {
        const record = records[0];
        return record ? toNumber(record.get('count')) : 0;
      }),
    ]);

    return { nodes: nodeCount, edges: edgeCount };
  };

  /**
   * Remove all nodes and edges from the store.
   */
  clear = async (): Promise<void> => {
    const cypher = 'MATCH (n) DETACH DELETE n';
    await this.runQuery(cypher, {}, () => null);
  };

  /**
   * Close the driver connection (only if we own it).
   */
  close = async (): Promise<void> => {
    if (this.driverOwned) {
      await this.driver.close();
    }
  };
}
