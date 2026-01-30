/**
 * In-Memory Graph Store
 *
 * A pure TypeScript implementation of the GraphStore interface for
 * development and testing. No external dependencies required.
 *
 * Features:
 * - O(1) node/edge lookup by ID
 * - O(degree) neighbor queries via adjacency indexes
 * - BFS traversal with depth control
 * - Full filtering support (type, properties, weight)
 */

import type {
  GraphStore,
  GraphStoreConfig,
  GraphNode,
  GraphNodeInput,
  GraphNodeType,
  GraphEdge,
  GraphEdgeInput,
  GetNeighborsOptions,
  NeighborResult,
  TraversalDirection,
  GraphQueryOptions,
  GraphQueryResult,
  BulkNodeUpdate,
  BulkUpdateOptions,
  BulkDeleteOptions,
  BulkOperationResult,
} from './types.js';
import {
  GraphStoreConfigSchema,
  GraphNodeInputSchema,
  GraphEdgeInputSchema,
  GetNeighborsOptionsSchema,
  GraphQueryOptionsSchema,
  UpsertNodeInputSchema,
  BulkNodeUpdateSchema,
  BulkUpdateOptionsSchema,
  BulkDeleteOptionsSchema,
} from './schemas.js';
import { GraphStoreError } from './errors.js';

/**
 * In-memory graph store for development and testing.
 *
 * Uses Maps for O(1) node/edge access and adjacency sets for
 * efficient graph traversal.
 *
 * @example
 * ```typescript
 * const store = new InMemoryGraphStore({ name: 'test-graph' });
 *
 * // Add nodes
 * const nodeId = await store.addNode({
 *   type: 'concept',
 *   label: 'Machine Learning'
 * });
 *
 * // Add edges
 * await store.addEdge({
 *   source: nodeId,
 *   target: 'other-node',
 *   type: 'relatedTo'
 * });
 *
 * // Traverse
 * const neighbors = await store.getNeighbors(nodeId, { depth: 2 });
 * ```
 */
export class InMemoryGraphStore implements GraphStore {
  readonly name: string;

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /** Maximum nodes allowed (0 = unlimited) */
  private readonly maxNodes: number;

  /** Maximum edges allowed (0 = unlimited) */
  private readonly maxEdges: number;

  // ==========================================================================
  // Primary Storage
  // ==========================================================================

  /** Node storage: id -> GraphNode */
  private readonly nodes: Map<string, GraphNode> = new Map();

  /** Edge storage: id -> GraphEdge */
  private readonly edges: Map<string, GraphEdge> = new Map();

  // ==========================================================================
  // Adjacency Indexes (for efficient traversal)
  // ==========================================================================

  /**
   * Outgoing edges index: nodeId -> Set of edgeIds
   *
   * For a node A with edge A→B, outgoingEdges.get(A) contains the edge ID.
   * This enables O(degree) lookup of all edges leaving a node.
   */
  private readonly outgoingEdges: Map<string, Set<string>> = new Map();

  /**
   * Incoming edges index: nodeId -> Set of edgeIds
   *
   * For an edge A→B, incomingEdges.get(B) contains the edge ID.
   * This enables O(degree) lookup of all edges entering a node.
   */
  private readonly incomingEdges: Map<string, Set<string>> = new Map();

  // ==========================================================================
  // Constructor
  // ==========================================================================

  constructor(config?: GraphStoreConfig) {
    const validated = GraphStoreConfigSchema.parse(config ?? {});
    this.name = validated.name ?? 'InMemoryGraphStore';
    this.maxNodes = validated.maxNodes ?? 0;
    this.maxEdges = validated.maxEdges ?? 0;
  }

  // ==========================================================================
  // Node Operations
  // ==========================================================================

  /**
   * Add a node to the graph.
   *
   * @param input - Node data to insert
   * @returns The ID of the inserted node
   * @throws {GraphStoreError} If validation fails, duplicate ID, or capacity exceeded
   */
  addNode = async (input: GraphNodeInput): Promise<string> => {
    // 1. Validate input with Zod schema
    const validated = GraphNodeInputSchema.parse(input);

    // 2. Check capacity
    if (this.maxNodes > 0 && this.nodes.size >= this.maxNodes) {
      throw GraphStoreError.capacityExceeded(this.name, 'nodes', this.maxNodes);
    }

    // 3. Generate ID if not provided
    const id = validated.id ?? this.generateId('node');

    // 4. Check for duplicates
    if (this.nodes.has(id)) {
      throw GraphStoreError.duplicateNode(this.name, id);
    }

    // 5. Create full node with timestamp
    const node: GraphNode = {
      id,
      type: validated.type,
      label: validated.label,
      properties: validated.properties ?? {},
      embedding: validated.embedding,
      createdAt: new Date(),
    };

    // 6. Store node
    this.nodes.set(id, node);

    // 7. Initialize adjacency sets for this node
    this.initAdjacencyForNode(id);

    return id;
  };

  /**
   * Add multiple nodes to the graph.
   *
   * @param inputs - Array of nodes to insert
   * @returns Array of inserted node IDs
   */
  addNodes = async (inputs: GraphNodeInput[]): Promise<string[]> => {
    const ids: string[] = [];
    for (const input of inputs) {
      const id = await this.addNode(input);
      ids.push(id);
    }
    return ids;
  };

  /**
   * Get a node by its ID.
   *
   * @param id - Node ID
   * @returns The node, or null if not found
   */
  getNode = async (id: string): Promise<GraphNode | null> => {
    return this.nodes.get(id) ?? null;
  };

  /**
   * Update a node's properties.
   *
   * @param id - Node ID
   * @param updates - Partial node data to merge
   * @returns The updated node
   * @throws {GraphStoreError} If node not found
   */
  updateNode = async (
    id: string,
    updates: Partial<Omit<GraphNodeInput, 'id'>>
  ): Promise<GraphNode> => {
    const existing = this.nodes.get(id);
    if (!existing) {
      throw GraphStoreError.nodeNotFound(this.name, id);
    }

    // Merge updates, preserving existing values for unspecified fields
    const updated: GraphNode = {
      ...existing,
      type: updates.type ?? existing.type,
      label: updates.label ?? existing.label,
      properties: { ...existing.properties, ...updates.properties },
      embedding: updates.embedding ?? existing.embedding,
      updatedAt: new Date(),
    };

    this.nodes.set(id, updated);
    return updated;
  };

  /**
   * Delete a node and all its connected edges.
   *
   * @param id - Node ID
   */
  deleteNode = async (id: string): Promise<void> => {
    const node = this.nodes.get(id);
    if (!node) {
      // Idempotent: return silently if not found
      return;
    }

    // Collect all connected edge IDs (outgoing + incoming)
    const outgoing = this.outgoingEdges.get(id) ?? new Set();
    const incoming = this.incomingEdges.get(id) ?? new Set();
    const connectedEdgeIds = [...outgoing, ...incoming];

    // Delete all connected edges (cascade deletion)
    for (const edgeId of connectedEdgeIds) {
      await this.deleteEdge(edgeId);
    }

    // Remove from adjacency indexes
    this.outgoingEdges.delete(id);
    this.incomingEdges.delete(id);

    // Delete the node
    this.nodes.delete(id);
  };

  // ==========================================================================
  // Bulk Node Operations
  // ==========================================================================

  /**
   * Check if a node exists by ID.
   *
   * O(1) lookup using Map.has().
   */
  hasNode = async (id: string): Promise<boolean> => {
    return this.nodes.has(id);
  };

  /**
   * Check if multiple nodes exist by IDs.
   *
   * Returns a Map for O(1) lookup of results by ID.
   */
  hasNodes = async (ids: string[]): Promise<Map<string, boolean>> => {
    const result = new Map<string, boolean>();
    for (const id of ids) {
      result.set(id, this.nodes.has(id));
    }
    return result;
  };

  /**
   * Get multiple nodes by IDs.
   *
   * Returns nodes in the same order as input IDs, with null for missing nodes.
   */
  getNodes = async (ids: string[]): Promise<(GraphNode | null)[]> => {
    return ids.map((id) => this.nodes.get(id) ?? null);
  };

  /**
   * Create or update a node based on ID.
   *
   * If node exists, updates it. Otherwise, creates it.
   * ID is required for upsert operations.
   */
  upsertNode = async (
    node: GraphNodeInput & { id: string }
  ): Promise<GraphNode> => {
    // Validate input - ID is required for upsert
    const validated = UpsertNodeInputSchema.parse(node);

    const existing = this.nodes.get(validated.id);

    if (existing) {
      // Update existing node
      return this.updateNode(validated.id, {
        type: validated.type,
        label: validated.label,
        properties: validated.properties,
        embedding: validated.embedding,
      });
    } else {
      // Check capacity before creating
      if (this.maxNodes > 0 && this.nodes.size >= this.maxNodes) {
        throw GraphStoreError.capacityExceeded(this.name, 'nodes', this.maxNodes);
      }

      // Create new node
      const newNode: GraphNode = {
        id: validated.id,
        type: validated.type,
        label: validated.label,
        properties: validated.properties ?? {},
        embedding: validated.embedding,
        createdAt: new Date(),
      };

      this.nodes.set(validated.id, newNode);
      this.initAdjacencyForNode(validated.id);

      return newNode;
    }
  };

  /**
   * Create or update multiple nodes.
   */
  upsertNodes = async (
    nodes: (GraphNodeInput & { id: string })[]
  ): Promise<GraphNode[]> => {
    const results: GraphNode[] = [];
    for (const node of nodes) {
      const result = await this.upsertNode(node);
      results.push(result);
    }
    return results;
  };

  /**
   * Update multiple nodes atomically.
   *
   * Default behavior (atomic): Either all updates succeed or all are rolled back.
   * With continueOnError: Attempts all updates, returns success/failure counts.
   */
  bulkUpdateNodes = async (
    updates: BulkNodeUpdate[],
    options?: BulkUpdateOptions
  ): Promise<BulkOperationResult> => {
    const opts = BulkUpdateOptionsSchema.parse(options ?? {});

    if (updates.length === 0) {
      return { successCount: 0, successIds: [], failedCount: 0, failedIds: [] };
    }

    // Validate all update entries
    for (const update of updates) {
      BulkNodeUpdateSchema.parse(update);
    }

    if (!opts.continueOnError) {
      // ATOMIC MODE: Validate all exist, take snapshot, apply, rollback on error

      // Step 1: Verify all nodes exist BEFORE making any changes
      for (const update of updates) {
        if (!this.nodes.has(update.id)) {
          throw GraphStoreError.transactionFailed(
            this.name,
            `Node not found: ${update.id} - rolling back all changes`
          );
        }
      }

      // Step 2: Create snapshot for potential rollback
      const snapshot = new Map<string, GraphNode>();
      for (const update of updates) {
        const node = this.nodes.get(update.id)!;
        // Deep clone to avoid reference issues
        snapshot.set(update.id, { ...node, properties: { ...node.properties } });
      }

      // Step 3: Apply all updates
      try {
        const successIds: string[] = [];
        for (const update of updates) {
          await this.updateNode(update.id, update.updates);
          successIds.push(update.id);
        }
        return {
          successCount: successIds.length,
          successIds,
          failedCount: 0,
          failedIds: [],
        };
      } catch (error) {
        // Step 4: Rollback on any failure
        for (const [id, node] of snapshot) {
          this.nodes.set(id, node);
        }
        throw GraphStoreError.transactionFailed(
          this.name,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        );
      }
    } else {
      // NON-ATOMIC MODE: Continue on individual failures
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
   * Default behavior (atomic): Either all deletes succeed or all are rolled back.
   * Connected edges are cascade-deleted.
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
      // ATOMIC MODE: Validate, snapshot all state, delete, rollback on error

      // Step 1: Verify all nodes exist (unless skipMissing)
      if (!opts.skipMissing) {
        for (const id of ids) {
          if (!this.nodes.has(id)) {
            throw GraphStoreError.transactionFailed(
              this.name,
              `Node not found: ${id} - rolling back all changes`
            );
          }
        }
      }

      // Step 2: Create full state snapshot for rollback
      // We need to snapshot everything that might be affected:
      // - The nodes being deleted
      // - All edges connected to these nodes
      // - Adjacency indexes for these nodes
      const nodeSnapshot = new Map<string, GraphNode>();
      const edgeSnapshot = new Map<string, GraphEdge>();
      const outgoingSnapshot = new Map<string, Set<string>>();
      const incomingSnapshot = new Map<string, Set<string>>();

      // Collect all nodes and their connected edges
      const affectedEdgeIds = new Set<string>();
      for (const id of ids) {
        const node = this.nodes.get(id);
        if (node) {
          nodeSnapshot.set(id, { ...node, properties: { ...node.properties } });

          // Snapshot adjacency indexes
          const outgoing = this.outgoingEdges.get(id);
          const incoming = this.incomingEdges.get(id);
          if (outgoing) {
            outgoingSnapshot.set(id, new Set(outgoing));
            outgoing.forEach((edgeId) => affectedEdgeIds.add(edgeId));
          }
          if (incoming) {
            incomingSnapshot.set(id, new Set(incoming));
            incoming.forEach((edgeId) => affectedEdgeIds.add(edgeId));
          }
        }
      }

      // Snapshot affected edges
      for (const edgeId of affectedEdgeIds) {
        const edge = this.edges.get(edgeId);
        if (edge) {
          edgeSnapshot.set(edgeId, {
            ...edge,
            properties: { ...edge.properties },
          });
        }
      }

      // Step 3: Delete all nodes (cascade deletes edges)
      try {
        const successIds: string[] = [];
        for (const id of ids) {
          if (this.nodes.has(id)) {
            await this.deleteNode(id);
            successIds.push(id);
          }
          // With skipMissing, we just silently skip - don't count as success
        }
        return {
          successCount: successIds.length,
          successIds,
          failedCount: 0,
          failedIds: [],
        };
      } catch (error) {
        // Step 4: Rollback ALL state on failure
        // Restore nodes
        for (const [id, node] of nodeSnapshot) {
          this.nodes.set(id, node);
        }
        // Restore edges
        for (const [id, edge] of edgeSnapshot) {
          this.edges.set(id, edge);
        }
        // Restore adjacency indexes
        for (const [id, set] of outgoingSnapshot) {
          this.outgoingEdges.set(id, set);
        }
        for (const [id, set] of incomingSnapshot) {
          this.incomingEdges.set(id, set);
        }

        throw GraphStoreError.transactionFailed(
          this.name,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        );
      }
    } else {
      // NON-ATOMIC MODE: Continue on individual failures
      const successIds: string[] = [];
      const failedIds: string[] = [];

      for (const id of ids) {
        try {
          if (this.nodes.has(id)) {
            await this.deleteNode(id);
            successIds.push(id);
          } else if (!opts.skipMissing) {
            // Only count as failure if we're NOT skipping missing
            failedIds.push(id);
          }
          // With skipMissing, silently skip - not success, not failure
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
   *
   * @param input - Edge data to insert
   * @returns The ID of the inserted edge
   * @throws {GraphStoreError} If source/target nodes don't exist, duplicate ID, or capacity exceeded
   */
  addEdge = async (input: GraphEdgeInput): Promise<string> => {
    // 1. Validate input with Zod schema
    const validated = GraphEdgeInputSchema.parse(input);

    // 2. Check capacity
    if (this.maxEdges > 0 && this.edges.size >= this.maxEdges) {
      throw GraphStoreError.capacityExceeded(this.name, 'edges', this.maxEdges);
    }

    // 3. Verify source node exists
    if (!this.nodes.has(validated.source)) {
      throw GraphStoreError.invalidEdge(
        this.name,
        `source node not found: ${validated.source}`
      );
    }

    // 4. Verify target node exists
    if (!this.nodes.has(validated.target)) {
      throw GraphStoreError.invalidEdge(
        this.name,
        `target node not found: ${validated.target}`
      );
    }

    // 5. Generate ID if not provided
    const id = validated.id ?? this.generateId('edge');

    // 6. Check for duplicates
    if (this.edges.has(id)) {
      throw GraphStoreError.duplicateEdge(this.name, id);
    }

    // 7. Create full edge with timestamp
    const edge: GraphEdge = {
      id,
      source: validated.source,
      target: validated.target,
      type: validated.type,
      weight: validated.weight,
      properties: validated.properties ?? {},
      createdAt: new Date(),
    };

    // 8. Store edge
    this.edges.set(id, edge);

    // 9. Update adjacency indexes
    this.addEdgeToAdjacency(edge);

    return id;
  };

  /**
   * Add multiple edges to the graph.
   *
   * @param inputs - Array of edges to insert
   * @returns Array of inserted edge IDs
   */
  addEdges = async (inputs: GraphEdgeInput[]): Promise<string[]> => {
    const ids: string[] = [];
    for (const input of inputs) {
      const id = await this.addEdge(input);
      ids.push(id);
    }
    return ids;
  };

  /**
   * Get an edge by its ID.
   *
   * @param id - Edge ID
   * @returns The edge, or null if not found
   */
  getEdge = async (id: string): Promise<GraphEdge | null> => {
    return this.edges.get(id) ?? null;
  };

  /**
   * Update an edge's properties.
   *
   * @param id - Edge ID
   * @param updates - Partial edge data to merge (cannot change source/target)
   * @returns The updated edge
   * @throws {GraphStoreError} If edge not found
   */
  updateEdge = async (
    id: string,
    updates: Partial<Omit<GraphEdgeInput, 'id' | 'source' | 'target'>>
  ): Promise<GraphEdge> => {
    const existing = this.edges.get(id);
    if (!existing) {
      throw GraphStoreError.edgeNotFound(this.name, id);
    }

    // Merge updates, preserving existing values
    const updated: GraphEdge = {
      ...existing,
      type: updates.type ?? existing.type,
      weight: updates.weight ?? existing.weight,
      properties: { ...existing.properties, ...updates.properties },
      updatedAt: new Date(),
    };

    this.edges.set(id, updated);
    return updated;
  };

  /**
   * Delete an edge.
   *
   * @param id - Edge ID
   */
  deleteEdge = async (id: string): Promise<void> => {
    const edge = this.edges.get(id);
    if (!edge) {
      // Idempotent: return silently if not found
      return;
    }

    // Remove from adjacency indexes
    this.removeEdgeFromAdjacency(edge);

    // Delete the edge
    this.edges.delete(id);
  };

  // ==========================================================================
  // Traversal Operations
  // ==========================================================================

  /**
   * Get all neighbors of a node using BFS traversal.
   *
   * @param nodeId - Starting node ID
   * @param options - Traversal options (depth, direction, filters)
   * @returns Array of neighbor results with nodes, edges, and depth
   * @throws {GraphStoreError} If starting node not found
   */
  getNeighbors = async (
    nodeId: string,
    options?: GetNeighborsOptions
  ): Promise<NeighborResult[]> => {
    // 1. Verify starting node exists
    if (!this.nodes.has(nodeId)) {
      throw GraphStoreError.nodeNotFound(this.name, nodeId);
    }

    // 2. Parse and validate options
    const opts = GetNeighborsOptionsSchema.parse(options ?? {});
    const maxDepth = opts.depth ?? 1;
    const direction = opts.direction ?? 'both';
    const edgeTypes = opts.edgeTypes;
    const nodeTypes = opts.nodeTypes;
    const minWeight = opts.minWeight;
    const limit = opts.limit;

    // 3. Initialize BFS structures
    const results: NeighborResult[] = [];
    const visited = new Set<string>([nodeId]); // Track visited nodes
    const queue: Array<{ nodeId: string; depth: number }> = [
      { nodeId, depth: 0 },
    ];

    // 4. BFS traversal
    while (queue.length > 0) {
      const current = queue.shift()!;

      // Stop if we've reached max depth
      if (current.depth >= maxDepth) {
        continue;
      }

      // Get edges based on direction
      const edgeIds = this.getEdgeIdsForDirection(current.nodeId, direction);

      for (const edgeId of edgeIds) {
        const edge = this.edges.get(edgeId)!;

        // Filter by edge types
        if (edgeTypes && edgeTypes.length > 0 && !edgeTypes.includes(edge.type)) {
          continue;
        }

        // Filter by minimum weight
        if (minWeight !== undefined && (edge.weight ?? 0) < minWeight) {
          continue;
        }

        // Determine the neighbor node (could be source or target depending on direction)
        const neighborId =
          edge.source === current.nodeId ? edge.target : edge.source;

        // Skip if already visited (prevents cycles)
        if (visited.has(neighborId)) {
          continue;
        }

        const neighborNode = this.nodes.get(neighborId)!;

        // Filter by node types
        if (nodeTypes && nodeTypes.length > 0 && !nodeTypes.includes(neighborNode.type)) {
          continue;
        }

        // Add to results
        results.push({
          node: neighborNode,
          edge,
          depth: current.depth + 1,
        });

        // Mark as visited and queue for next level
        visited.add(neighborId);
        queue.push({ nodeId: neighborId, depth: current.depth + 1 });

        // Check limit
        if (limit !== undefined && results.length >= limit) {
          return results;
        }
      }
    }

    return results;
  };

  /**
   * Get all edges connected to a node.
   *
   * @param nodeId - Node ID
   * @param direction - Which edges to return (default: 'both')
   * @returns Array of connected edges
   */
  getEdgesForNode = async (
    nodeId: string,
    direction: TraversalDirection = 'both'
  ): Promise<GraphEdge[]> => {
    const edgeIds = this.getEdgeIdsForDirection(nodeId, direction);
    return edgeIds.map((id) => this.edges.get(id)!);
  };

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Query nodes and edges by pattern.
   *
   * @param options - Query filters and pagination
   * @returns Matching nodes and edges with total count
   */
  query = async (options?: GraphQueryOptions): Promise<GraphQueryResult> => {
    const opts = GraphQueryOptionsSchema.parse(options ?? {});
    const { nodeTypes, edgeTypes, nodeFilter, edgeFilter, limit, offset } = opts;

    // Filter nodes
    let matchingNodes = Array.from(this.nodes.values());

    // Empty array means "no matches" (per interface docs)
    if (nodeTypes !== undefined) {
      if (nodeTypes.length === 0) {
        matchingNodes = [];
      } else {
        matchingNodes = matchingNodes.filter((n) => nodeTypes.includes(n.type));
      }
    }

    if (nodeFilter) {
      matchingNodes = matchingNodes.filter((n) =>
        this.matchesPropertyFilter(n.properties, nodeFilter)
      );
    }

    // Filter edges
    let matchingEdges = Array.from(this.edges.values());

    // Empty array means "no matches" (per interface docs)
    if (edgeTypes !== undefined) {
      if (edgeTypes.length === 0) {
        matchingEdges = [];
      } else {
        matchingEdges = matchingEdges.filter((e) => edgeTypes.includes(e.type));
      }
    }

    if (edgeFilter) {
      matchingEdges = matchingEdges.filter((e) =>
        this.matchesPropertyFilter(e.properties, edgeFilter)
      );
    }

    // Calculate total before pagination
    const totalCount = matchingNodes.length + matchingEdges.length;

    // Apply pagination to nodes only (edges are fully returned)
    if (offset !== undefined && offset > 0) {
      matchingNodes = matchingNodes.slice(offset);
    }
    if (limit !== undefined && limit > 0) {
      matchingNodes = matchingNodes.slice(0, limit);
    }

    return {
      nodes: matchingNodes,
      edges: matchingEdges,
      totalCount,
    };
  };

  /**
   * Find nodes by label (case-insensitive partial match).
   *
   * @param label - Label to search for
   * @param options - Optional type filter and limit
   * @returns Matching nodes
   */
  findNodesByLabel = async (
    label: string,
    options?: { type?: GraphNodeType; limit?: number }
  ): Promise<GraphNode[]> => {
    const searchLabel = label.toLowerCase();

    let candidates = Array.from(this.nodes.values());

    // Filter by type first (cheaper operation)
    if (options?.type) {
      candidates = candidates.filter((n) => n.type === options.type);
    }

    // Filter by label (case-insensitive partial match)
    const matches = candidates.filter((n) =>
      n.label.toLowerCase().includes(searchLabel)
    );

    // Apply limit
    if (options?.limit !== undefined && options.limit > 0) {
      return matches.slice(0, options.limit);
    }

    return matches;
  };

  // ==========================================================================
  // Management Operations
  // ==========================================================================

  /**
   * Get counts of nodes and edges.
   *
   * @returns Object with node and edge counts
   */
  count = async (): Promise<{ nodes: number; edges: number }> => {
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
    };
  };

  /**
   * Remove all nodes and edges from the store.
   */
  clear = async (): Promise<void> => {
    this.nodes.clear();
    this.edges.clear();
    this.outgoingEdges.clear();
    this.incomingEdges.clear();
  };

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Generate a unique ID with prefix.
   *
   * Format: {prefix}_{timestamp}_{random}
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Initialize adjacency sets for a new node.
   */
  private initAdjacencyForNode(nodeId: string): void {
    if (!this.outgoingEdges.has(nodeId)) {
      this.outgoingEdges.set(nodeId, new Set());
    }
    if (!this.incomingEdges.has(nodeId)) {
      this.incomingEdges.set(nodeId, new Set());
    }
  }

  /**
   * Add an edge to the adjacency indexes.
   */
  private addEdgeToAdjacency(edge: GraphEdge): void {
    // Add to outgoing edges of source node
    const outgoing = this.outgoingEdges.get(edge.source);
    if (outgoing) {
      outgoing.add(edge.id);
    }

    // Add to incoming edges of target node
    const incoming = this.incomingEdges.get(edge.target);
    if (incoming) {
      incoming.add(edge.id);
    }
  }

  /**
   * Remove an edge from the adjacency indexes.
   */
  private removeEdgeFromAdjacency(edge: GraphEdge): void {
    // Remove from outgoing edges of source node
    const outgoing = this.outgoingEdges.get(edge.source);
    if (outgoing) {
      outgoing.delete(edge.id);
    }

    // Remove from incoming edges of target node
    const incoming = this.incomingEdges.get(edge.target);
    if (incoming) {
      incoming.delete(edge.id);
    }
  }

  /**
   * Get edge IDs for a node based on traversal direction.
   *
   * Note: For self-loops (A→A), the edge appears in both outgoing and incoming.
   * When direction is 'both', we deduplicate to avoid returning the same edge twice.
   */
  private getEdgeIdsForDirection(
    nodeId: string,
    direction: TraversalDirection
  ): string[] {
    const outgoing = this.outgoingEdges.get(nodeId) ?? new Set<string>();
    const incoming = this.incomingEdges.get(nodeId) ?? new Set<string>();

    switch (direction) {
      case 'outgoing':
        return Array.from(outgoing);
      case 'incoming':
        return Array.from(incoming);
      case 'both':
        // Use Set to deduplicate (handles self-loops that appear in both)
        return Array.from(new Set([...outgoing, ...incoming]));
    }
  }

  /**
   * Check if properties match a filter object.
   *
   * All filter keys must match exactly.
   */
  private matchesPropertyFilter(
    properties: Record<string, unknown>,
    filter: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (properties[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
