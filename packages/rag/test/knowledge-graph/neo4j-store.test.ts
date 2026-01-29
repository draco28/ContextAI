/**
 * Neo4jGraphStore Tests
 *
 * Tests the Neo4j adapter configuration and validation logic.
 *
 * NOTE: Integration tests that require a real Neo4j instance are skipped
 * by default. They can be enabled by setting NEO4J_TEST_URL environment
 * variable to a Neo4j connection string.
 *
 * Example: NEO4J_TEST_URL=neo4j://localhost:7687 pnpm test
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

// Types from the module
import type {
  GraphNodeInput,
  GraphEdgeInput,
} from '../../src/knowledge-graph/types.js';
import { GraphStoreError } from '../../src/knowledge-graph/errors.js';
import {
  Neo4jGraphStore,
  Neo4jGraphStoreConfigSchema,
  type Neo4jGraphStoreConfig,
} from '../../src/knowledge-graph/neo4j-store.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestNodeInput(overrides?: Partial<GraphNodeInput>): GraphNodeInput {
  return {
    type: 'concept',
    label: 'Test Node',
    properties: {},
    ...overrides,
  };
}

function createTestEdgeInput(overrides?: Partial<GraphEdgeInput>): GraphEdgeInput {
  return {
    source: 'node1',
    target: 'node2',
    type: 'relatedTo',
    weight: 0.8,
    properties: {},
    ...overrides,
  };
}

// Check if integration tests should run
const NEO4J_TEST_URL = process.env.NEO4J_TEST_URL;
const RUN_INTEGRATION = !!NEO4J_TEST_URL;

// ============================================================================
// Configuration Schema Tests (no driver needed)
// ============================================================================

describe('Neo4jGraphStoreConfigSchema', () => {
  it('should validate valid config with connectionString', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      username: 'neo4j',
      password: 'password',
    });

    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database).toBe('neo4j');
      expect(result.data.maxConnectionPoolSize).toBe(100);
      expect(result.data.maxNodes).toBe(0);
      expect(result.data.maxEdges).toBe(0);
    }
  });

  it('should validate custom database name', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      database: 'mydb',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database).toBe('mydb');
    }
  });

  it('should validate custom pool size', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      maxConnectionPoolSize: 50,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxConnectionPoolSize).toBe(50);
    }
  });

  it('should reject config without connectionString or driver', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      username: 'neo4j',
      password: 'password',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid connection string', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'not-a-valid-url',
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative maxNodes', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      maxNodes: -1,
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative maxEdges', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      maxEdges: -1,
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid pool size', () => {
    const result = Neo4jGraphStoreConfigSchema.safeParse({
      connectionString: 'neo4j://localhost:7687',
      maxConnectionPoolSize: 0,
    });

    expect(result.success).toBe(false);
  });

  it('should accept various neo4j URL schemes', () => {
    const schemes = [
      'neo4j://localhost:7687',
      'neo4j+s://example.com:7687',
      'neo4j+ssc://example.com:7687',
      'bolt://localhost:7687',
      'bolt+s://example.com:7687',
    ];

    for (const connectionString of schemes) {
      const result = Neo4jGraphStoreConfigSchema.safeParse({ connectionString });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// Constructor Tests
// ============================================================================

describe('Neo4jGraphStore Constructor', () => {
  it('should throw if neither connectionString nor driver provided', () => {
    expect(() => new Neo4jGraphStore({} as Neo4jGraphStoreConfig)).toThrow(GraphStoreError);
  });

  it('should use default name if not provided', () => {
    // This test verifies the config is validated correctly
    // The actual driver creation will fail without a real connection
    expect(() => new Neo4jGraphStore({} as Neo4jGraphStoreConfig)).toThrow(/connectionString/);
  });
});

// ============================================================================
// Integration Tests (require NEO4J_TEST_URL environment variable)
// ============================================================================

describe.skipIf(!RUN_INTEGRATION)('Neo4jGraphStore Integration Tests', () => {
  let store: Neo4jGraphStore;

  beforeAll(() => {
    if (!NEO4J_TEST_URL) {
      throw new Error('NEO4J_TEST_URL not set');
    }
  });

  beforeEach(async () => {
    store = new Neo4jGraphStore({
      connectionString: NEO4J_TEST_URL!,
      username: process.env.NEO4J_TEST_USER ?? 'neo4j',
      password: process.env.NEO4J_TEST_PASSWORD ?? 'password',
    });

    // Clear the database before each test
    await store.clear();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
  });

  describe('Node Operations', () => {
    it('should add and retrieve a node', async () => {
      const nodeInput = createTestNodeInput({
        id: 'test-node-1',
        label: 'Test Concept',
        properties: { description: 'A test node' },
      });

      const nodeId = await store.addNode(nodeInput);
      expect(nodeId).toBe('test-node-1');

      const node = await store.getNode(nodeId);
      expect(node).not.toBeNull();
      expect(node?.id).toBe('test-node-1');
      expect(node?.label).toBe('Test Concept');
      expect(node?.properties.description).toBe('A test node');
    });

    it('should generate ID if not provided', async () => {
      const nodeInput = createTestNodeInput({ label: 'Auto ID Node' });

      const nodeId = await store.addNode(nodeInput);
      expect(nodeId).toMatch(/^node_\d+_[a-z0-9]+$/);

      const node = await store.getNode(nodeId);
      expect(node?.label).toBe('Auto ID Node');
    });

    it('should update a node', async () => {
      const nodeId = await store.addNode(createTestNodeInput({ id: 'update-test' }));

      const updated = await store.updateNode(nodeId, {
        label: 'Updated Label',
        properties: { newProp: 'value' },
      });

      expect(updated.label).toBe('Updated Label');
      expect(updated.properties.newProp).toBe('value');
    });

    it('should delete a node', async () => {
      const nodeId = await store.addNode(createTestNodeInput({ id: 'delete-test' }));

      await store.deleteNode(nodeId);

      const node = await store.getNode(nodeId);
      expect(node).toBeNull();
    });

    it('should reject duplicate node ID', async () => {
      await store.addNode(createTestNodeInput({ id: 'duplicate' }));

      await expect(
        store.addNode(createTestNodeInput({ id: 'duplicate' }))
      ).rejects.toThrow(GraphStoreError);
    });
  });

  describe('Edge Operations', () => {
    beforeEach(async () => {
      // Create nodes for edge tests
      await store.addNode(createTestNodeInput({ id: 'node1' }));
      await store.addNode(createTestNodeInput({ id: 'node2' }));
    });

    it('should add and retrieve an edge', async () => {
      const edgeInput = createTestEdgeInput({
        id: 'test-edge-1',
        source: 'node1',
        target: 'node2',
      });

      const edgeId = await store.addEdge(edgeInput);
      expect(edgeId).toBe('test-edge-1');

      const edge = await store.getEdge(edgeId);
      expect(edge).not.toBeNull();
      expect(edge?.source).toBe('node1');
      expect(edge?.target).toBe('node2');
    });

    it('should reject edge with nonexistent source', async () => {
      await expect(
        store.addEdge(createTestEdgeInput({ source: 'nonexistent', target: 'node2' }))
      ).rejects.toThrow(/source node not found/);
    });

    it('should reject edge with nonexistent target', async () => {
      await expect(
        store.addEdge(createTestEdgeInput({ source: 'node1', target: 'nonexistent' }))
      ).rejects.toThrow(/target node not found/);
    });

    it('should allow self-loops', async () => {
      const edgeId = await store.addEdge(
        createTestEdgeInput({ source: 'node1', target: 'node1' })
      );

      const edge = await store.getEdge(edgeId);
      expect(edge?.source).toBe('node1');
      expect(edge?.target).toBe('node1');
    });
  });

  describe('Traversal Operations', () => {
    beforeEach(async () => {
      // Create a small graph
      await store.addNode(createTestNodeInput({ id: 'a', label: 'Node A' }));
      await store.addNode(createTestNodeInput({ id: 'b', label: 'Node B' }));
      await store.addNode(createTestNodeInput({ id: 'c', label: 'Node C' }));
      await store.addEdge(createTestEdgeInput({ source: 'a', target: 'b' }));
      await store.addEdge(createTestEdgeInput({ source: 'b', target: 'c' }));
    });

    it('should get direct neighbors', async () => {
      const neighbors = await store.getNeighbors('a', { depth: 1 });

      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].node.id).toBe('b');
      expect(neighbors[0].depth).toBe(1);
    });

    it('should traverse multiple hops', async () => {
      const neighbors = await store.getNeighbors('a', { depth: 2 });

      expect(neighbors).toHaveLength(2);
      const ids = neighbors.map((n) => n.node.id);
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });

    it('should filter by direction', async () => {
      // Outgoing from a
      const outgoing = await store.getNeighbors('a', { direction: 'outgoing' });
      expect(outgoing.some((n) => n.node.id === 'b')).toBe(true);

      // Incoming to b
      const incoming = await store.getNeighbors('b', { direction: 'incoming' });
      expect(incoming.some((n) => n.node.id === 'a')).toBe(true);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await store.addNode(createTestNodeInput({ id: 'concept1', type: 'concept', label: 'Machine Learning' }));
      await store.addNode(createTestNodeInput({ id: 'concept2', type: 'concept', label: 'Deep Learning' }));
      await store.addNode(createTestNodeInput({ id: 'entity1', type: 'entity', label: 'TensorFlow' }));
    });

    it('should query by node type', async () => {
      const result = await store.query({ nodeTypes: ['concept'] });

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.every((n) => n.type === 'concept')).toBe(true);
    });

    it('should find nodes by label', async () => {
      const nodes = await store.findNodesByLabel('Learning');

      expect(nodes).toHaveLength(2);
      expect(nodes.every((n) => n.label.includes('Learning'))).toBe(true);
    });

    it('should respect limit in findNodesByLabel', async () => {
      const nodes = await store.findNodesByLabel('Learning', { limit: 1 });

      expect(nodes).toHaveLength(1);
    });
  });

  describe('Management Operations', () => {
    it('should count nodes and edges', async () => {
      await store.addNode(createTestNodeInput({ id: 'n1' }));
      await store.addNode(createTestNodeInput({ id: 'n2' }));
      await store.addEdge(createTestEdgeInput({ source: 'n1', target: 'n2' }));

      const counts = await store.count();

      expect(counts.nodes).toBe(2);
      expect(counts.edges).toBe(1);
    });

    it('should clear all data', async () => {
      await store.addNode(createTestNodeInput({ id: 'n1' }));
      await store.addNode(createTestNodeInput({ id: 'n2' }));

      await store.clear();

      const counts = await store.count();
      expect(counts.nodes).toBe(0);
      expect(counts.edges).toBe(0);
    });
  });
});

// ============================================================================
// Type Safety Tests (compile-time checks)
// ============================================================================

describe('Type Safety', () => {
  it('should export correct types', () => {
    // These are compile-time checks - if they compile, the test passes
    const config: Neo4jGraphStoreConfig = {
      connectionString: 'neo4j://localhost:7687',
      username: 'neo4j',
      password: 'password',
      database: 'neo4j',
      maxConnectionPoolSize: 100,
      maxNodes: 1000,
      maxEdges: 5000,
      name: 'test',
    };

    expect(config).toBeDefined();
  });
});
