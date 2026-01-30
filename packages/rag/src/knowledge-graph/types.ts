/**
 * Knowledge Graph Types
 *
 * Core interfaces for the knowledge graph system.
 * All graph stores must implement the GraphStore interface.
 */

// ============================================================================
// Node Types
// ============================================================================

/**
 * Types of nodes in the knowledge graph.
 *
 * - concept: Abstract idea or topic (e.g., "machine learning")
 * - entity: Named entity (e.g., "OpenAI", "TypeScript")
 * - document: Source document reference
 * - chunk: Text chunk from a document
 */
export type GraphNodeType = 'concept' | 'entity' | 'document' | 'chunk';

/**
 * Metadata associated with a graph node.
 *
 * Common fields are strongly typed; applications can add custom fields
 * via the index signature.
 */
export interface GraphNodeProperties {
  /** Human-readable description */
  description?: string;
  /** Source document ID (for document/chunk nodes) */
  sourceDocumentId?: string;
  /** Page number (for document/chunk nodes) */
  pageNumber?: number;
  /** Confidence score (0-1) for extracted nodes */
  confidence?: number;
  /** Allow application-specific custom fields */
  [key: string]: unknown;
}

/**
 * A node in the knowledge graph.
 *
 * Nodes represent entities, concepts, documents, or chunks that can be
 * connected via edges.
 *
 * @example
 * ```typescript
 * const node: GraphNode = {
 *   id: 'node-123',
 *   type: 'concept',
 *   label: 'Machine Learning',
 *   properties: {
 *     description: 'A branch of artificial intelligence',
 *     confidence: 0.95
 *   },
 *   createdAt: new Date()
 * };
 * ```
 */
export interface GraphNode {
  /** Unique identifier for this node */
  id: string;
  /** Node type (concept, entity, document, chunk) */
  type: GraphNodeType;
  /** Human-readable label */
  label: string;
  /** Node metadata and custom properties */
  properties: GraphNodeProperties;
  /** Optional embedding vector for similarity search */
  embedding?: number[];
  /** Timestamp when the node was created */
  createdAt: Date;
  /** Timestamp when the node was last updated */
  updatedAt?: Date;
}

/**
 * Input for creating a new node (without auto-generated fields).
 */
export interface GraphNodeInput {
  /** Optional custom ID (auto-generated if not provided) */
  id?: string;
  /** Node type */
  type: GraphNodeType;
  /** Human-readable label */
  label: string;
  /** Node metadata and custom properties */
  properties?: GraphNodeProperties;
  /** Optional embedding vector for similarity search */
  embedding?: number[];
}

// ============================================================================
// Edge Types
// ============================================================================

/**
 * Types of relationships between nodes.
 *
 * - references: Citation or reference relationship
 * - contains: Parent-child containment (document contains chunks)
 * - relatedTo: General semantic relationship
 * - derivedFrom: Extraction or derivation relationship
 * - mentions: Entity mention in text
 * - similarTo: Semantic similarity relationship
 */
export type GraphEdgeType =
  | 'references'
  | 'contains'
  | 'relatedTo'
  | 'derivedFrom'
  | 'mentions'
  | 'similarTo';

/**
 * Metadata associated with a graph edge.
 */
export interface GraphEdgeProperties {
  /** Context or description of the relationship */
  context?: string;
  /** Confidence score (0-1) for extracted relationships */
  confidence?: number;
  /** Allow application-specific custom fields */
  [key: string]: unknown;
}

/**
 * An edge connecting two nodes in the knowledge graph.
 *
 * Edges represent relationships between nodes. They are directional
 * (source → target) but can be traversed in both directions.
 *
 * @example
 * ```typescript
 * const edge: GraphEdge = {
 *   id: 'edge-456',
 *   source: 'node-123',
 *   target: 'node-789',
 *   type: 'relatedTo',
 *   weight: 0.8,
 *   properties: {
 *     context: 'Both discuss neural networks',
 *     confidence: 0.9
 *   },
 *   createdAt: new Date()
 * };
 * ```
 */
export interface GraphEdge {
  /** Unique identifier for this edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type */
  type: GraphEdgeType;
  /** Relationship strength (0-1, higher = stronger) */
  weight?: number;
  /** Edge metadata and custom properties */
  properties: GraphEdgeProperties;
  /** Timestamp when the edge was created */
  createdAt: Date;
  /** Timestamp when the edge was last updated */
  updatedAt?: Date;
}

/**
 * Input for creating a new edge (without auto-generated fields).
 *
 * @remarks
 * Self-loops (where source === target) are allowed by default.
 * Implementations may choose to reject self-loops by throwing
 * `GraphStoreError.invalidEdge()` if self-referencing edges
 * don't make sense for the use case.
 */
export interface GraphEdgeInput {
  /** Optional custom ID (auto-generated if not provided) */
  id?: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type */
  type: GraphEdgeType;
  /** Relationship strength (0-1) */
  weight?: number;
  /** Edge metadata and custom properties */
  properties?: GraphEdgeProperties;
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Direction for graph traversal.
 */
export type TraversalDirection = 'outgoing' | 'incoming' | 'both';

/**
 * Options for neighbor queries.
 */
export interface GetNeighborsOptions {
  /** Maximum depth to traverse (default: 1) */
  depth?: number;
  /** Direction to traverse (default: 'both') */
  direction?: TraversalDirection;
  /** Filter by edge types (undefined = all types, empty array = no matches) */
  edgeTypes?: GraphEdgeType[];
  /** Filter by node types (undefined = all types, empty array = no matches) */
  nodeTypes?: GraphNodeType[];
  /** Minimum edge weight threshold */
  minWeight?: number;
  /** Maximum number of results */
  limit?: number;
}

/**
 * Result from a neighbor query.
 */
export interface NeighborResult {
  /** The connected node */
  node: GraphNode;
  /** The edge connecting to this node */
  edge: GraphEdge;
  /** Traversal depth from the starting node */
  depth: number;
}

/**
 * Options for pattern-based graph queries.
 */
export interface GraphQueryOptions {
  /** Filter nodes by type (undefined = all types, empty array = no matches) */
  nodeTypes?: GraphNodeType[];
  /** Filter edges by type (undefined = all types, empty array = no matches) */
  edgeTypes?: GraphEdgeType[];
  /** Filter by node properties */
  nodeFilter?: Record<string, unknown>;
  /** Filter by edge properties */
  edgeFilter?: Record<string, unknown>;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Result from a graph query.
 */
export interface GraphQueryResult {
  /** Matching nodes */
  nodes: GraphNode[];
  /** Matching edges */
  edges: GraphEdge[];
  /** Total count (before limit) */
  totalCount: number;
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

/**
 * Result from a bulk operation (update or delete).
 *
 * For atomic operations (default), failedCount is always 0 because any
 * failure triggers a full rollback. For non-atomic operations (continueOnError),
 * you'll see which specific IDs succeeded or failed.
 *
 * @example
 * ```typescript
 * // Atomic operation - all or nothing
 * const result = await store.bulkDeleteNodes(['a', 'b', 'c']);
 * // result: { successCount: 3, successIds: ['a','b','c'], failedCount: 0, failedIds: [] }
 *
 * // Non-atomic operation - continue on errors
 * const result = await store.bulkDeleteNodes(['a', 'missing'], { continueOnError: true });
 * // result: { successCount: 1, successIds: ['a'], failedCount: 1, failedIds: ['missing'] }
 * ```
 */
export interface BulkOperationResult {
  /** Number of successfully processed items */
  successCount: number;
  /** IDs that were processed successfully */
  successIds: string[];
  /** Number of failed items (always 0 for atomic operations) */
  failedCount: number;
  /** IDs that failed (empty for atomic operations - they roll back) */
  failedIds: string[];
}

/**
 * Input for bulk node updates.
 *
 * Each entry specifies a node ID and the updates to apply.
 * The updates are partial - only specified fields are changed.
 */
export interface BulkNodeUpdate {
  /** Node ID to update */
  id: string;
  /** Partial updates to apply to the node */
  updates: Partial<Omit<GraphNodeInput, 'id'>>;
}

/**
 * Options for bulk update operations.
 */
export interface BulkUpdateOptions {
  /**
   * If true, continue processing on individual failures (non-atomic).
   * If false (default), any failure triggers rollback of all changes.
   */
  continueOnError?: boolean;
}

/**
 * Options for bulk delete operations.
 */
export interface BulkDeleteOptions {
  /**
   * If true, continue processing on individual failures (non-atomic).
   * If false (default), any failure triggers rollback of all changes.
   */
  continueOnError?: boolean;
  /**
   * If true, silently skip non-existent nodes instead of treating as failure.
   * Useful for idempotent "ensure deleted" operations.
   */
  skipMissing?: boolean;
}

/**
 * Input for bulk edge updates.
 *
 * Each entry specifies an edge ID and the updates to apply.
 * The updates are partial - only specified fields are changed.
 *
 * @remarks
 * Unlike nodes, edges have immutable `source` and `target` fields.
 * You can only update `type`, `weight`, and `properties`.
 */
export interface BulkEdgeUpdate {
  /** Edge ID to update */
  id: string;
  /** Partial updates to apply to the edge (source/target are immutable) */
  updates: Partial<Omit<GraphEdgeInput, 'id' | 'source' | 'target'>>;
}

// ============================================================================
// Store Configuration
// ============================================================================

/**
 * Configuration for graph stores.
 */
export interface GraphStoreConfig {
  /** Human-readable name for this store */
  name?: string;
  /** Maximum nodes to store (0 = unlimited) */
  maxNodes?: number;
  /** Maximum edges to store (0 = unlimited) */
  maxEdges?: number;
}

// ============================================================================
// Graph Store Interface
// ============================================================================

/**
 * Interface for knowledge graph stores.
 *
 * Graph stores are responsible for:
 * 1. Storing nodes and edges
 * 2. Retrieving nodes by ID
 * 3. Traversing relationships (get neighbors)
 * 4. Querying by patterns
 * 5. Managing stored data (delete, clear)
 *
 * @example
 * ```typescript
 * const store: GraphStore = new InMemoryGraphStore();
 *
 * // Add nodes
 * const nodeId = await store.addNode({
 *   type: 'concept',
 *   label: 'Machine Learning',
 *   properties: { description: 'AI branch' }
 * });
 *
 * // Add edges
 * await store.addEdge({
 *   source: nodeId,
 *   target: 'other-node-id',
 *   type: 'relatedTo',
 *   weight: 0.8
 * });
 *
 * // Query neighbors
 * const neighbors = await store.getNeighbors(nodeId, {
 *   depth: 2,
 *   direction: 'outgoing'
 * });
 * ```
 */
export interface GraphStore {
  /** Human-readable name of this store */
  readonly name: string;

  // ==========================================================================
  // Node Operations
  // ==========================================================================

  /**
   * Add a node to the graph.
   *
   * @param node - Node data to insert
   * @returns The ID of the inserted node
   * @throws {GraphStoreError} If insert fails
   */
  addNode(node: GraphNodeInput): Promise<string>;

  /**
   * Add multiple nodes to the graph.
   *
   * @param nodes - Array of nodes to insert
   * @returns Array of inserted node IDs
   * @throws {GraphStoreError} If insert fails
   */
  addNodes(nodes: GraphNodeInput[]): Promise<string[]>;

  /**
   * Get a node by its ID.
   *
   * @param id - Node ID
   * @returns The node, or null if not found
   */
  getNode(id: string): Promise<GraphNode | null>;

  /**
   * Update a node's properties.
   *
   * @param id - Node ID
   * @param updates - Partial node data to merge
   * @returns The updated node
   * @throws {GraphStoreError} If node not found or update fails
   */
  updateNode(
    id: string,
    updates: Partial<Omit<GraphNodeInput, 'id'>>
  ): Promise<GraphNode>;

  /**
   * Delete a node and all its connected edges.
   *
   * @param id - Node ID
   * @throws {GraphStoreError} If delete fails
   */
  deleteNode(id: string): Promise<void>;

  // ==========================================================================
  // Bulk Node Operations
  // ==========================================================================

  /**
   * Check if a node exists by ID.
   *
   * More efficient than `getNode()` when you only need to check existence
   * without retrieving the full node data.
   *
   * @param id - Node ID to check
   * @returns True if node exists, false otherwise
   */
  hasNode(id: string): Promise<boolean>;

  /**
   * Check if multiple nodes exist by IDs.
   *
   * Returns a Map for O(1) lookup of existence status by ID.
   *
   * @param ids - Array of node IDs to check
   * @returns Map of node ID to existence boolean
   *
   * @example
   * ```typescript
   * const exists = await store.hasNodes(['a', 'b', 'c']);
   * if (exists.get('a')) {
   *   // Node 'a' exists
   * }
   * ```
   */
  hasNodes(ids: string[]): Promise<Map<string, boolean>>;

  /**
   * Get multiple nodes by their IDs.
   *
   * Returns nodes in the same order as input IDs. Non-existent nodes
   * are represented as null in the result array.
   *
   * @param ids - Array of node IDs
   * @returns Array of nodes (null for non-existent IDs)
   *
   * @example
   * ```typescript
   * const nodes = await store.getNodes(['a', 'b', 'missing']);
   * // nodes[0] = GraphNode for 'a'
   * // nodes[1] = GraphNode for 'b'
   * // nodes[2] = null (not found)
   * ```
   */
  getNodes(ids: string[]): Promise<(GraphNode | null)[]>;

  /**
   * Create or update a node based on ID.
   *
   * If a node with the given ID exists, it will be updated.
   * If no node exists, a new one will be created.
   *
   * @param node - Node data (ID is required for upsert)
   * @returns The upserted node
   * @throws {GraphStoreError} If ID not provided or operation fails
   *
   * @example
   * ```typescript
   * // First call creates the node
   * const node1 = await store.upsertNode({ id: 'x', type: 'concept', label: 'A' });
   *
   * // Second call updates it
   * const node2 = await store.upsertNode({ id: 'x', type: 'concept', label: 'B' });
   * // node2.label === 'B', node2.updatedAt is set
   * ```
   */
  upsertNode(node: GraphNodeInput & { id: string }): Promise<GraphNode>;

  /**
   * Create or update multiple nodes based on IDs.
   *
   * @param nodes - Array of nodes (each must have ID)
   * @returns Array of upserted nodes in same order
   * @throws {GraphStoreError} If any node lacks ID or operation fails
   */
  upsertNodes(nodes: (GraphNodeInput & { id: string })[]): Promise<GraphNode[]>;

  /**
   * Update multiple nodes atomically.
   *
   * By default, this is an atomic operation - either all updates succeed
   * or all fail with rollback. Use `options.continueOnError` for non-atomic
   * behavior where each update is attempted independently.
   *
   * @param updates - Array of {id, updates} pairs
   * @param options - Bulk operation options
   * @returns Result with success/failure counts
   * @throws {GraphStoreError} If atomic operation fails (rolls back all changes)
   *
   * @example
   * ```typescript
   * // Atomic: all succeed or all rollback
   * const result = await store.bulkUpdateNodes([
   *   { id: 'a', updates: { label: 'Updated A' } },
   *   { id: 'b', updates: { label: 'Updated B' } },
   * ]);
   * ```
   */
  bulkUpdateNodes(
    updates: BulkNodeUpdate[],
    options?: BulkUpdateOptions
  ): Promise<BulkOperationResult>;

  /**
   * Delete multiple nodes atomically.
   *
   * By default, this is an atomic operation - either all deletes succeed
   * or all fail with rollback. Connected edges are cascade-deleted.
   *
   * @param ids - Array of node IDs to delete
   * @param options - Bulk operation options
   * @returns Result with success/failure counts
   * @throws {GraphStoreError} If atomic operation fails (rolls back all changes)
   *
   * @example
   * ```typescript
   * // Atomic delete with cascade
   * await store.bulkDeleteNodes(['a', 'b', 'c']);
   *
   * // Idempotent delete (skip missing nodes)
   * await store.bulkDeleteNodes(['x', 'y'], { skipMissing: true });
   * ```
   */
  bulkDeleteNodes(
    ids: string[],
    options?: BulkDeleteOptions
  ): Promise<BulkOperationResult>;

  // ==========================================================================
  // Edge Operations
  // ==========================================================================

  /**
   * Add an edge between two nodes.
   *
   * @param edge - Edge data to insert
   * @returns The ID of the inserted edge
   * @throws {GraphStoreError} If source/target nodes don't exist
   */
  addEdge(edge: GraphEdgeInput): Promise<string>;

  /**
   * Add multiple edges to the graph.
   *
   * @param edges - Array of edges to insert
   * @returns Array of inserted edge IDs
   * @throws {GraphStoreError} If any source/target nodes don't exist
   */
  addEdges(edges: GraphEdgeInput[]): Promise<string[]>;

  /**
   * Get an edge by its ID.
   *
   * @param id - Edge ID
   * @returns The edge, or null if not found
   */
  getEdge(id: string): Promise<GraphEdge | null>;

  /**
   * Update an edge's properties.
   *
   * @param id - Edge ID
   * @param updates - Partial edge data to merge
   * @returns The updated edge
   * @throws {GraphStoreError} If edge not found or update fails
   */
  updateEdge(
    id: string,
    updates: Partial<Omit<GraphEdgeInput, 'id' | 'source' | 'target'>>
  ): Promise<GraphEdge>;

  /**
   * Delete an edge.
   *
   * @param id - Edge ID
   * @throws {GraphStoreError} If delete fails
   */
  deleteEdge(id: string): Promise<void>;

  // ==========================================================================
  // Bulk Edge Operations
  // ==========================================================================

  /**
   * Check if an edge exists by ID.
   *
   * More efficient than `getEdge()` when you only need to check existence
   * without retrieving the full edge data.
   *
   * @param id - Edge ID to check
   * @returns True if edge exists, false otherwise
   */
  hasEdge(id: string): Promise<boolean>;

  /**
   * Check if multiple edges exist by IDs.
   *
   * Returns a Map for O(1) lookup of existence status by ID.
   *
   * @param ids - Array of edge IDs to check
   * @returns Map of edge ID to existence boolean
   *
   * @example
   * ```typescript
   * const exists = await store.hasEdges(['e1', 'e2', 'e3']);
   * if (exists.get('e1')) {
   *   // Edge 'e1' exists
   * }
   * ```
   */
  hasEdges(ids: string[]): Promise<Map<string, boolean>>;

  /**
   * Get multiple edges by their IDs.
   *
   * Returns edges in the same order as input IDs. Non-existent edges
   * are represented as null in the result array.
   *
   * @param ids - Array of edge IDs
   * @returns Array of edges (null for non-existent IDs)
   *
   * @example
   * ```typescript
   * const edges = await store.getEdges(['e1', 'e2', 'missing']);
   * // edges[0] = GraphEdge for 'e1'
   * // edges[1] = GraphEdge for 'e2'
   * // edges[2] = null (not found)
   * ```
   */
  getEdges(ids: string[]): Promise<(GraphEdge | null)[]>;

  /**
   * Create or update an edge based on ID.
   *
   * If an edge with the given ID exists, it will be updated.
   * If no edge exists, a new one will be created.
   *
   * @param edge - Edge data (ID is required for upsert)
   * @returns The upserted edge
   * @throws {GraphStoreError} If ID not provided, source/target nodes don't exist, or operation fails
   *
   * @example
   * ```typescript
   * // First call creates the edge
   * const edge1 = await store.upsertEdge({
   *   id: 'e1', source: 'n1', target: 'n2', type: 'relatedTo'
   * });
   *
   * // Second call updates it (cannot change source/target)
   * const edge2 = await store.upsertEdge({
   *   id: 'e1', source: 'n1', target: 'n2', type: 'references', weight: 0.9
   * });
   * ```
   */
  upsertEdge(edge: GraphEdgeInput & { id: string }): Promise<GraphEdge>;

  /**
   * Create or update multiple edges based on IDs.
   *
   * @param edges - Array of edges (each must have ID)
   * @returns Array of upserted edges in same order
   * @throws {GraphStoreError} If any edge lacks ID or operation fails
   */
  upsertEdges(edges: (GraphEdgeInput & { id: string })[]): Promise<GraphEdge[]>;

  /**
   * Update multiple edges atomically.
   *
   * By default, this is an atomic operation - either all updates succeed
   * or all fail with rollback. Use `options.continueOnError` for non-atomic
   * behavior where each update is attempted independently.
   *
   * @remarks
   * Edge source and target are immutable. Only `type`, `weight`, and
   * `properties` can be updated.
   *
   * @param updates - Array of {id, updates} pairs
   * @param options - Bulk operation options
   * @returns Result with success/failure counts
   * @throws {GraphStoreError} If atomic operation fails (rolls back all changes)
   *
   * @example
   * ```typescript
   * // Atomic: all succeed or all rollback
   * const result = await store.bulkUpdateEdges([
   *   { id: 'e1', updates: { weight: 0.9 } },
   *   { id: 'e2', updates: { type: 'references' } },
   * ]);
   * ```
   */
  bulkUpdateEdges(
    updates: BulkEdgeUpdate[],
    options?: BulkUpdateOptions
  ): Promise<BulkOperationResult>;

  /**
   * Delete multiple edges atomically.
   *
   * By default, this is an atomic operation - either all deletes succeed
   * or all fail with rollback.
   *
   * @param ids - Array of edge IDs to delete
   * @param options - Bulk operation options
   * @returns Result with success/failure counts
   * @throws {GraphStoreError} If atomic operation fails (rolls back all changes)
   *
   * @example
   * ```typescript
   * // Atomic delete
   * await store.bulkDeleteEdges(['e1', 'e2', 'e3']);
   *
   * // Idempotent delete (skip missing edges)
   * await store.bulkDeleteEdges(['x', 'y'], { skipMissing: true });
   * ```
   */
  bulkDeleteEdges(
    ids: string[],
    options?: BulkDeleteOptions
  ): Promise<BulkOperationResult>;

  // ==========================================================================
  // Traversal Operations
  // ==========================================================================

  /**
   * Get all neighbors of a node.
   *
   * Traverses the graph from a starting node and returns all connected
   * nodes within the specified depth.
   *
   * @param nodeId - Starting node ID
   * @param options - Traversal options (depth, direction, filters)
   * @returns Array of neighbor results with nodes, edges, and depth
   * @throws {GraphStoreError} If node not found
   */
  getNeighbors(
    nodeId: string,
    options?: GetNeighborsOptions
  ): Promise<NeighborResult[]>;

  /**
   * Get all edges connected to a node.
   *
   * @param nodeId - Node ID
   * @param direction - Which edges to return (default: 'both')
   * @returns Array of connected edges
   */
  getEdgesForNode(
    nodeId: string,
    direction?: TraversalDirection
  ): Promise<GraphEdge[]>;

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Query nodes and edges by pattern.
   *
   * @param options - Query filters and pagination
   * @returns Matching nodes and edges with total count
   */
  query(options?: GraphQueryOptions): Promise<GraphQueryResult>;

  /**
   * Find nodes by label (partial match).
   *
   * @param label - Label to search for
   * @param options - Optional type filter and limit
   * @returns Matching nodes
   */
  findNodesByLabel(
    label: string,
    options?: { type?: GraphNodeType; limit?: number }
  ): Promise<GraphNode[]>;

  // ==========================================================================
  // Management Operations
  // ==========================================================================

  /**
   * Get counts of nodes and edges.
   *
   * @returns Object with node and edge counts
   */
  count(): Promise<{ nodes: number; edges: number }>;

  /**
   * Remove all nodes and edges from the store.
   *
   * @throws {GraphStoreError} If clear fails
   */
  clear(): Promise<void>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for graph store failures.
 */
export type GraphStoreErrorCode =
  | 'NODE_NOT_FOUND'
  | 'EDGE_NOT_FOUND'
  | 'DUPLICATE_NODE'
  | 'DUPLICATE_EDGE'
  | 'INVALID_NODE'
  | 'INVALID_EDGE'
  | 'STORE_UNAVAILABLE'
  | 'CAPACITY_EXCEEDED'
  | 'INSERT_FAILED'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED'
  | 'QUERY_FAILED'
  | 'TRANSACTION_FAILED'
  | 'STORE_ERROR';

/**
 * Details about a graph store error.
 */
export interface GraphStoreErrorDetails {
  /** Machine-readable error code */
  code: GraphStoreErrorCode;
  /** Name of the store that failed */
  storeName: string;
  /** Underlying cause, if any */
  cause?: Error;
}
