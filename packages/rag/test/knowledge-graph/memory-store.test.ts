/**
 * InMemoryGraphStore Tests
 *
 * Comprehensive tests for the in-memory graph store implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryGraphStore,
  GraphStoreError,
  type GraphNodeInput,
  type GraphEdgeInput,
  type GraphNodeType,
  type GraphEdgeType,
} from '../../src/index.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestNode(overrides?: Partial<GraphNodeInput>): GraphNodeInput {
  return {
    type: 'concept',
    label: 'Test Node',
    properties: {},
    ...overrides,
  };
}

function createTestEdge(
  source: string,
  target: string,
  overrides?: Partial<GraphEdgeInput>
): GraphEdgeInput {
  return {
    source,
    target,
    type: 'relatedTo',
    ...overrides,
  };
}

// =============================================================================
// Constructor & Configuration Tests
// =============================================================================

describe('InMemoryGraphStore', () => {
  describe('constructor', () => {
    it('should create store with default config', () => {
      const store = new InMemoryGraphStore();
      expect(store.name).toBe('InMemoryGraphStore');
    });

    it('should create store with custom name', () => {
      const store = new InMemoryGraphStore({ name: 'my-graph' });
      expect(store.name).toBe('my-graph');
    });

    it('should accept capacity limits', async () => {
      const store = new InMemoryGraphStore({ maxNodes: 2, maxEdges: 1 });

      // Add nodes up to limit
      await store.addNode(createTestNode({ id: 'n1' }));
      await store.addNode(createTestNode({ id: 'n2' }));

      // Third node should fail
      await expect(
        store.addNode(createTestNode({ id: 'n3' }))
      ).rejects.toThrow(GraphStoreError);
    });
  });

  // ===========================================================================
  // Node Operations Tests
  // ===========================================================================

  describe('Node Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(() => {
      store = new InMemoryGraphStore();
    });

    describe('addNode', () => {
      it('should add node and return ID', async () => {
        const id = await store.addNode(createTestNode());
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });

      it('should use provided ID if given', async () => {
        const id = await store.addNode(createTestNode({ id: 'custom-id' }));
        expect(id).toBe('custom-id');
      });

      it('should generate unique IDs when not provided', async () => {
        const id1 = await store.addNode(createTestNode());
        const id2 = await store.addNode(createTestNode());
        expect(id1).not.toBe(id2);
      });

      it('should set createdAt timestamp', async () => {
        const id = await store.addNode(createTestNode());
        const node = await store.getNode(id);
        expect(node?.createdAt).toBeInstanceOf(Date);
      });

      it('should throw on duplicate ID', async () => {
        await store.addNode(createTestNode({ id: 'dup' }));
        await expect(
          store.addNode(createTestNode({ id: 'dup' }))
        ).rejects.toThrow(GraphStoreError);
      });

      it('should enforce maxNodes capacity', async () => {
        const limitedStore = new InMemoryGraphStore({ maxNodes: 1 });
        await limitedStore.addNode(createTestNode({ id: 'n1' }));
        await expect(
          limitedStore.addNode(createTestNode({ id: 'n2' }))
        ).rejects.toThrow('Capacity exceeded');
      });

      it('should store all node properties', async () => {
        const id = await store.addNode({
          type: 'entity',
          label: 'Test Entity',
          properties: { foo: 'bar', count: 42 },
          embedding: [0.1, 0.2, 0.3],
        });

        const node = await store.getNode(id);
        expect(node?.type).toBe('entity');
        expect(node?.label).toBe('Test Entity');
        expect(node?.properties).toEqual({ foo: 'bar', count: 42 });
        expect(node?.embedding).toEqual([0.1, 0.2, 0.3]);
      });
    });

    describe('addNodes', () => {
      it('should add multiple nodes', async () => {
        const ids = await store.addNodes([
          createTestNode({ id: 'n1' }),
          createTestNode({ id: 'n2' }),
          createTestNode({ id: 'n3' }),
        ]);

        expect(ids).toHaveLength(3);
        expect(ids).toEqual(['n1', 'n2', 'n3']);
      });

      it('should fail fast on duplicate in batch', async () => {
        await store.addNode(createTestNode({ id: 'existing' }));

        await expect(
          store.addNodes([
            createTestNode({ id: 'new1' }),
            createTestNode({ id: 'existing' }), // Duplicate
            createTestNode({ id: 'new2' }),
          ])
        ).rejects.toThrow(GraphStoreError);
      });
    });

    describe('getNode', () => {
      it('should return node if found', async () => {
        await store.addNode(createTestNode({ id: 'n1', label: 'My Node' }));
        const node = await store.getNode('n1');
        expect(node).not.toBeNull();
        expect(node?.label).toBe('My Node');
      });

      it('should return null if not found', async () => {
        const node = await store.getNode('nonexistent');
        expect(node).toBeNull();
      });
    });

    describe('updateNode', () => {
      it('should update node properties', async () => {
        await store.addNode(createTestNode({ id: 'n1', label: 'Original' }));
        const updated = await store.updateNode('n1', { label: 'Updated' });

        expect(updated.label).toBe('Updated');
        expect(updated.updatedAt).toBeInstanceOf(Date);
      });

      it('should merge properties', async () => {
        await store.addNode(
          createTestNode({ id: 'n1', properties: { a: 1, b: 2 } })
        );
        const updated = await store.updateNode('n1', {
          properties: { b: 3, c: 4 },
        });

        expect(updated.properties).toEqual({ a: 1, b: 3, c: 4 });
      });

      it('should allow changing node type', async () => {
        await store.addNode(createTestNode({ id: 'n1', type: 'concept' }));
        const updated = await store.updateNode('n1', { type: 'entity' });
        expect(updated.type).toBe('entity');
      });

      it('should throw if node not found', async () => {
        await expect(
          store.updateNode('nonexistent', { label: 'New' })
        ).rejects.toThrow('Node not found');
      });
    });

    describe('deleteNode', () => {
      it('should delete existing node', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.deleteNode('n1');

        const node = await store.getNode('n1');
        expect(node).toBeNull();
      });

      it('should be idempotent (no error on non-existent)', async () => {
        await expect(store.deleteNode('nonexistent')).resolves.toBeUndefined();
      });

      it('should cascade delete connected edges', async () => {
        // Create nodes and edges: n1 --e1--> n2 --e2--> n3
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.addNode(createTestNode({ id: 'n2' }));
        await store.addNode(createTestNode({ id: 'n3' }));
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'e1' }));
        await store.addEdge(createTestEdge('n2', 'n3', { id: 'e2' }));

        // Delete n2 (middle node)
        await store.deleteNode('n2');

        // Both edges should be deleted
        const e1 = await store.getEdge('e1');
        const e2 = await store.getEdge('e2');
        expect(e1).toBeNull();
        expect(e2).toBeNull();

        // n1 and n3 should still exist
        expect(await store.getNode('n1')).not.toBeNull();
        expect(await store.getNode('n3')).not.toBeNull();
      });
    });
  });

  // ===========================================================================
  // Bulk Node Operations Tests
  // ===========================================================================

  describe('Bulk Node Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(() => {
      store = new InMemoryGraphStore();
    });

    describe('hasNode', () => {
      it('should return true for existing node', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        expect(await store.hasNode('n1')).toBe(true);
      });

      it('should return false for non-existing node', async () => {
        expect(await store.hasNode('nonexistent')).toBe(false);
      });
    });

    describe('hasNodes', () => {
      it('should return map of existence for all IDs', async () => {
        await store.addNode(createTestNode({ id: 'a' }));
        await store.addNode(createTestNode({ id: 'b' }));

        const result = await store.hasNodes(['a', 'b', 'c']);

        expect(result.get('a')).toBe(true);
        expect(result.get('b')).toBe(true);
        expect(result.get('c')).toBe(false);
      });

      it('should handle empty array', async () => {
        const result = await store.hasNodes([]);
        expect(result.size).toBe(0);
      });
    });

    describe('getNodes', () => {
      it('should return nodes in same order as input IDs', async () => {
        await store.addNode(createTestNode({ id: 'a', label: 'A' }));
        await store.addNode(createTestNode({ id: 'b', label: 'B' }));
        await store.addNode(createTestNode({ id: 'c', label: 'C' }));

        const nodes = await store.getNodes(['c', 'a', 'b']);

        expect(nodes[0]?.label).toBe('C');
        expect(nodes[1]?.label).toBe('A');
        expect(nodes[2]?.label).toBe('B');
      });

      it('should return null for non-existing IDs', async () => {
        await store.addNode(createTestNode({ id: 'a' }));

        const nodes = await store.getNodes(['a', 'missing', 'b']);

        expect(nodes[0]).not.toBeNull();
        expect(nodes[1]).toBeNull();
        expect(nodes[2]).toBeNull();
      });

      it('should handle empty array', async () => {
        const nodes = await store.getNodes([]);
        expect(nodes).toHaveLength(0);
      });
    });

    describe('upsertNode', () => {
      it('should create node if not exists', async () => {
        const node = await store.upsertNode({
          id: 'new-node',
          type: 'concept',
          label: 'New Node',
        });

        expect(node.id).toBe('new-node');
        expect(node.label).toBe('New Node');
        expect(node.createdAt).toBeInstanceOf(Date);
        expect(node.updatedAt).toBeUndefined();
      });

      it('should update node if exists', async () => {
        // First create
        await store.upsertNode({
          id: 'x',
          type: 'concept',
          label: 'Original',
        });

        // Then upsert (update)
        const node = await store.upsertNode({
          id: 'x',
          type: 'entity',
          label: 'Updated',
        });

        expect(node.label).toBe('Updated');
        expect(node.type).toBe('entity');
        expect(node.updatedAt).toBeInstanceOf(Date);
      });

      it('should require ID', async () => {
        await expect(
          // @ts-expect-error - Testing invalid input
          store.upsertNode({ type: 'concept', label: 'No ID' })
        ).rejects.toThrow();
      });

      it('should respect maxNodes capacity on create', async () => {
        const limitedStore = new InMemoryGraphStore({ maxNodes: 1 });
        await limitedStore.upsertNode({ id: 'a', type: 'concept', label: 'A' });

        // Update should work (not creating)
        await expect(
          limitedStore.upsertNode({ id: 'a', type: 'concept', label: 'A Updated' })
        ).resolves.toBeDefined();

        // New node should fail
        await expect(
          limitedStore.upsertNode({ id: 'b', type: 'concept', label: 'B' })
        ).rejects.toThrow('Capacity exceeded');
      });
    });

    describe('upsertNodes', () => {
      it('should create and update multiple nodes', async () => {
        await store.addNode(createTestNode({ id: 'existing', label: 'Old' }));

        const results = await store.upsertNodes([
          { id: 'existing', type: 'concept', label: 'Updated' },
          { id: 'new1', type: 'entity', label: 'New 1' },
          { id: 'new2', type: 'document', label: 'New 2' },
        ]);

        expect(results).toHaveLength(3);
        expect(results[0].label).toBe('Updated');
        expect(results[1].label).toBe('New 1');
        expect(results[2].label).toBe('New 2');
      });
    });

    describe('bulkUpdateNodes', () => {
      beforeEach(async () => {
        await store.addNode(createTestNode({ id: 'a', label: 'A' }));
        await store.addNode(createTestNode({ id: 'b', label: 'B' }));
        await store.addNode(createTestNode({ id: 'c', label: 'C' }));
      });

      describe('atomic mode (default)', () => {
        it('should update all nodes successfully', async () => {
          const result = await store.bulkUpdateNodes([
            { id: 'a', updates: { label: 'A Updated' } },
            { id: 'b', updates: { label: 'B Updated' } },
          ]);

          expect(result.successCount).toBe(2);
          expect(result.successIds).toEqual(['a', 'b']);
          expect(result.failedCount).toBe(0);
          expect(result.failedIds).toEqual([]);

          expect((await store.getNode('a'))?.label).toBe('A Updated');
          expect((await store.getNode('b'))?.label).toBe('B Updated');
        });

        it('should rollback all on any failure', async () => {
          await expect(
            store.bulkUpdateNodes([
              { id: 'a', updates: { label: 'A Updated' } },
              { id: 'missing', updates: { label: 'Will Fail' } },
              { id: 'c', updates: { label: 'C Updated' } },
            ])
          ).rejects.toThrow('Transaction failed');

          // All nodes should be unchanged
          expect((await store.getNode('a'))?.label).toBe('A');
          expect((await store.getNode('c'))?.label).toBe('C');
        });

        it('should throw TRANSACTION_FAILED error on failure', async () => {
          try {
            await store.bulkUpdateNodes([
              { id: 'a', updates: { label: 'Updated' } },
              { id: 'nonexistent', updates: { label: 'Fail' } },
            ]);
            expect.fail('Should have thrown');
          } catch (error) {
            expect(error).toBeInstanceOf(GraphStoreError);
            expect((error as GraphStoreError).code).toBe('TRANSACTION_FAILED');
          }
        });
      });

      describe('non-atomic mode (continueOnError)', () => {
        it('should continue on individual failures', async () => {
          const result = await store.bulkUpdateNodes(
            [
              { id: 'a', updates: { label: 'A Updated' } },
              { id: 'missing', updates: { label: 'Will Fail' } },
              { id: 'c', updates: { label: 'C Updated' } },
            ],
            { continueOnError: true }
          );

          expect(result.successCount).toBe(2);
          expect(result.successIds).toEqual(['a', 'c']);
          expect(result.failedCount).toBe(1);
          expect(result.failedIds).toEqual(['missing']);

          // Successful updates should persist
          expect((await store.getNode('a'))?.label).toBe('A Updated');
          expect((await store.getNode('c'))?.label).toBe('C Updated');
        });
      });
    });

    describe('bulkDeleteNodes', () => {
      beforeEach(async () => {
        await store.addNode(createTestNode({ id: 'a' }));
        await store.addNode(createTestNode({ id: 'b' }));
        await store.addNode(createTestNode({ id: 'c' }));
        await store.addEdge(createTestEdge('a', 'b', { id: 'e1' }));
        await store.addEdge(createTestEdge('b', 'c', { id: 'e2' }));
      });

      describe('atomic mode (default)', () => {
        it('should delete all nodes successfully', async () => {
          const result = await store.bulkDeleteNodes(['a', 'b']);

          expect(result.successCount).toBe(2);
          expect(result.successIds).toEqual(['a', 'b']);
          expect(await store.getNode('a')).toBeNull();
          expect(await store.getNode('b')).toBeNull();
          expect(await store.getNode('c')).not.toBeNull();
        });

        it('should cascade delete connected edges', async () => {
          await store.bulkDeleteNodes(['b']);

          expect(await store.getEdge('e1')).toBeNull();
          expect(await store.getEdge('e2')).toBeNull();
        });

        it('should rollback all on any failure', async () => {
          await expect(
            store.bulkDeleteNodes(['a', 'missing', 'c'])
          ).rejects.toThrow('Transaction failed');

          // All nodes should still exist
          expect(await store.getNode('a')).not.toBeNull();
          expect(await store.getNode('c')).not.toBeNull();
        });

        it('should skip missing nodes with skipMissing option', async () => {
          const result = await store.bulkDeleteNodes(['a', 'missing', 'c'], {
            skipMissing: true,
          });

          // With skipMissing, missing nodes don't cause failure
          // Only actually deleted nodes are counted as success
          expect(result.successCount).toBe(2);
          expect(result.successIds).toEqual(['a', 'c']);
          expect(result.failedCount).toBe(0);
          expect(await store.getNode('a')).toBeNull();
          expect(await store.getNode('c')).toBeNull();
        });
      });

      describe('non-atomic mode (continueOnError)', () => {
        it('should continue on individual failures', async () => {
          const result = await store.bulkDeleteNodes(
            ['a', 'missing', 'c'],
            { continueOnError: true }
          );

          expect(result.successCount).toBe(2);
          expect(result.successIds).toEqual(['a', 'c']);
          expect(result.failedCount).toBe(1);
          expect(result.failedIds).toEqual(['missing']);
        });

        it('should not count missing as failure with skipMissing', async () => {
          const result = await store.bulkDeleteNodes(
            ['a', 'missing'],
            { continueOnError: true, skipMissing: true }
          );

          // Only actually deleted nodes are counted as success
          // Missing nodes are silently skipped (not failed, not success)
          expect(result.successCount).toBe(1);
          expect(result.successIds).toEqual(['a']);
          expect(result.failedCount).toBe(0);
          expect(result.failedIds).toEqual([]);
        });
      });
    });
  });

  // ===========================================================================
  // Edge Operations Tests
  // ===========================================================================

  describe('Edge Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(async () => {
      store = new InMemoryGraphStore();
      // Pre-create nodes for edge tests
      await store.addNode(createTestNode({ id: 'n1' }));
      await store.addNode(createTestNode({ id: 'n2' }));
      await store.addNode(createTestNode({ id: 'n3' }));
    });

    describe('addEdge', () => {
      it('should add edge and return ID', async () => {
        const id = await store.addEdge(createTestEdge('n1', 'n2'));
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });

      it('should use provided ID if given', async () => {
        const id = await store.addEdge(
          createTestEdge('n1', 'n2', { id: 'custom-edge' })
        );
        expect(id).toBe('custom-edge');
      });

      it('should throw if source node does not exist', async () => {
        await expect(
          store.addEdge(createTestEdge('nonexistent', 'n2'))
        ).rejects.toThrow('source node not found');
      });

      it('should throw if target node does not exist', async () => {
        await expect(
          store.addEdge(createTestEdge('n1', 'nonexistent'))
        ).rejects.toThrow('target node not found');
      });

      it('should allow self-loops', async () => {
        const id = await store.addEdge(createTestEdge('n1', 'n1'));
        const edge = await store.getEdge(id);
        expect(edge?.source).toBe('n1');
        expect(edge?.target).toBe('n1');
      });

      it('should store all edge properties', async () => {
        const id = await store.addEdge({
          source: 'n1',
          target: 'n2',
          type: 'mentions',
          weight: 0.75,
          properties: { context: 'test context', confidence: 0.9 },
        });

        const edge = await store.getEdge(id);
        expect(edge?.type).toBe('mentions');
        expect(edge?.weight).toBe(0.75);
        expect(edge?.properties).toEqual({
          context: 'test context',
          confidence: 0.9,
        });
      });

      it('should throw on duplicate ID', async () => {
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'dup' }));
        await expect(
          store.addEdge(createTestEdge('n2', 'n3', { id: 'dup' }))
        ).rejects.toThrow(GraphStoreError);
      });

      it('should enforce maxEdges capacity', async () => {
        const limitedStore = new InMemoryGraphStore({ maxEdges: 1 });
        await limitedStore.addNode(createTestNode({ id: 'a' }));
        await limitedStore.addNode(createTestNode({ id: 'b' }));
        await limitedStore.addNode(createTestNode({ id: 'c' }));

        await limitedStore.addEdge(createTestEdge('a', 'b'));
        await expect(
          limitedStore.addEdge(createTestEdge('b', 'c'))
        ).rejects.toThrow('Capacity exceeded');
      });
    });

    describe('addEdges', () => {
      it('should add multiple edges', async () => {
        const ids = await store.addEdges([
          createTestEdge('n1', 'n2', { id: 'e1' }),
          createTestEdge('n2', 'n3', { id: 'e2' }),
        ]);

        expect(ids).toEqual(['e1', 'e2']);
      });
    });

    describe('getEdge', () => {
      it('should return edge if found', async () => {
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'e1' }));
        const edge = await store.getEdge('e1');
        expect(edge).not.toBeNull();
        expect(edge?.source).toBe('n1');
        expect(edge?.target).toBe('n2');
      });

      it('should return null if not found', async () => {
        const edge = await store.getEdge('nonexistent');
        expect(edge).toBeNull();
      });
    });

    describe('updateEdge', () => {
      it('should update edge properties', async () => {
        await store.addEdge(
          createTestEdge('n1', 'n2', { id: 'e1', weight: 0.5 })
        );
        const updated = await store.updateEdge('e1', { weight: 0.9 });

        expect(updated.weight).toBe(0.9);
        expect(updated.updatedAt).toBeInstanceOf(Date);
      });

      it('should merge properties', async () => {
        await store.addEdge(
          createTestEdge('n1', 'n2', {
            id: 'e1',
            properties: { a: 1, b: 2 },
          })
        );
        const updated = await store.updateEdge('e1', {
          properties: { b: 3, c: 4 },
        });

        expect(updated.properties).toEqual({ a: 1, b: 3, c: 4 });
      });

      it('should throw if edge not found', async () => {
        await expect(
          store.updateEdge('nonexistent', { weight: 1 })
        ).rejects.toThrow('Edge not found');
      });

      it('should not allow changing source/target', async () => {
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'e1' }));
        const updated = await store.updateEdge('e1', { type: 'contains' });

        // Source and target should remain unchanged
        expect(updated.source).toBe('n1');
        expect(updated.target).toBe('n2');
      });
    });

    describe('deleteEdge', () => {
      it('should delete existing edge', async () => {
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'e1' }));
        await store.deleteEdge('e1');

        const edge = await store.getEdge('e1');
        expect(edge).toBeNull();
      });

      it('should be idempotent', async () => {
        await expect(store.deleteEdge('nonexistent')).resolves.toBeUndefined();
      });

      it('should update adjacency indexes', async () => {
        await store.addEdge(createTestEdge('n1', 'n2', { id: 'e1' }));
        await store.deleteEdge('e1');

        // n1 should have no outgoing edges
        const edges = await store.getEdgesForNode('n1', 'outgoing');
        expect(edges).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Traversal Operations Tests
  // ===========================================================================

  describe('Traversal Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(async () => {
      store = new InMemoryGraphStore();

      // Create a test graph:
      //
      //   n1 --e1--> n2 --e2--> n3
      //    |                    ^
      //    +-------- e3 --------+
      //
      await store.addNode(createTestNode({ id: 'n1', type: 'concept' }));
      await store.addNode(createTestNode({ id: 'n2', type: 'entity' }));
      await store.addNode(createTestNode({ id: 'n3', type: 'document' }));
      await store.addEdge(
        createTestEdge('n1', 'n2', { id: 'e1', type: 'relatedTo' })
      );
      await store.addEdge(
        createTestEdge('n2', 'n3', { id: 'e2', type: 'contains' })
      );
      await store.addEdge(
        createTestEdge('n1', 'n3', { id: 'e3', type: 'references', weight: 0.8 })
      );
    });

    describe('getNeighbors', () => {
      it('should return direct neighbors (depth 1)', async () => {
        const neighbors = await store.getNeighbors('n1', { depth: 1 });

        expect(neighbors).toHaveLength(2);
        const nodeIds = neighbors.map((n) => n.node.id);
        expect(nodeIds).toContain('n2');
        expect(nodeIds).toContain('n3');
      });

      it('should include depth information', async () => {
        const neighbors = await store.getNeighbors('n1', { depth: 1 });
        expect(neighbors.every((n) => n.depth === 1)).toBe(true);
      });

      it('should traverse multiple levels', async () => {
        // From n1 with depth 2, should find n2 (depth 1) and n3 (depth 1 via e3, depth 2 via e1->e2)
        const neighbors = await store.getNeighbors('n1', { depth: 2 });

        // n2 and n3 both reachable at depth 1
        expect(neighbors).toHaveLength(2);
      });

      it('should filter by direction (outgoing)', async () => {
        const neighbors = await store.getNeighbors('n2', {
          depth: 1,
          direction: 'outgoing',
        });

        expect(neighbors).toHaveLength(1);
        expect(neighbors[0].node.id).toBe('n3');
      });

      it('should filter by direction (incoming)', async () => {
        const neighbors = await store.getNeighbors('n2', {
          depth: 1,
          direction: 'incoming',
        });

        expect(neighbors).toHaveLength(1);
        expect(neighbors[0].node.id).toBe('n1');
      });

      it('should filter by edge types', async () => {
        const neighbors = await store.getNeighbors('n1', {
          depth: 1,
          edgeTypes: ['references'],
        });

        expect(neighbors).toHaveLength(1);
        expect(neighbors[0].node.id).toBe('n3');
        expect(neighbors[0].edge.type).toBe('references');
      });

      it('should filter by node types', async () => {
        const neighbors = await store.getNeighbors('n1', {
          depth: 1,
          nodeTypes: ['entity'],
        });

        expect(neighbors).toHaveLength(1);
        expect(neighbors[0].node.id).toBe('n2');
        expect(neighbors[0].node.type).toBe('entity');
      });

      it('should filter by minimum weight', async () => {
        const neighbors = await store.getNeighbors('n1', {
          depth: 1,
          minWeight: 0.7,
        });

        // Only e3 has weight >= 0.7
        expect(neighbors).toHaveLength(1);
        expect(neighbors[0].edge.id).toBe('e3');
      });

      it('should respect limit', async () => {
        const neighbors = await store.getNeighbors('n1', {
          depth: 1,
          limit: 1,
        });

        expect(neighbors).toHaveLength(1);
      });

      it('should throw if starting node not found', async () => {
        await expect(store.getNeighbors('nonexistent')).rejects.toThrow(
          'Node not found'
        );
      });

      it('should handle cycles without infinite loop', async () => {
        // Add cycle: n3 -> n1
        await store.addEdge(createTestEdge('n3', 'n1', { id: 'e4' }));

        // Should complete without hanging
        const neighbors = await store.getNeighbors('n1', { depth: 5 });
        expect(neighbors.length).toBeGreaterThan(0);
      });

      it('should not revisit nodes', async () => {
        // Add cycle: n3 -> n1
        await store.addEdge(createTestEdge('n3', 'n1', { id: 'e4' }));

        const neighbors = await store.getNeighbors('n1', { depth: 5 });

        // Each node should appear at most once
        const nodeIds = neighbors.map((n) => n.node.id);
        const uniqueIds = new Set(nodeIds);
        expect(nodeIds.length).toBe(uniqueIds.size);
      });
    });

    describe('getEdgesForNode', () => {
      it('should return all edges (both directions)', async () => {
        const edges = await store.getEdgesForNode('n2');

        expect(edges).toHaveLength(2);
        const edgeIds = edges.map((e) => e.id);
        expect(edgeIds).toContain('e1'); // incoming
        expect(edgeIds).toContain('e2'); // outgoing
      });

      it('should return only outgoing edges', async () => {
        const edges = await store.getEdgesForNode('n1', 'outgoing');

        expect(edges).toHaveLength(2);
        expect(edges.every((e) => e.source === 'n1')).toBe(true);
      });

      it('should return only incoming edges', async () => {
        const edges = await store.getEdgesForNode('n3', 'incoming');

        expect(edges).toHaveLength(2);
        expect(edges.every((e) => e.target === 'n3')).toBe(true);
      });

      it('should return empty array for isolated node', async () => {
        await store.addNode(createTestNode({ id: 'isolated' }));
        const edges = await store.getEdgesForNode('isolated');
        expect(edges).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Query Operations Tests
  // ===========================================================================

  describe('Query Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(async () => {
      store = new InMemoryGraphStore();

      await store.addNode(
        createTestNode({
          id: 'n1',
          type: 'concept',
          label: 'Machine Learning',
          properties: { category: 'AI' },
        })
      );
      await store.addNode(
        createTestNode({
          id: 'n2',
          type: 'entity',
          label: 'TensorFlow',
          properties: { category: 'AI', language: 'Python' },
        })
      );
      await store.addNode(
        createTestNode({
          id: 'n3',
          type: 'document',
          label: 'ML Tutorial',
          properties: { category: 'education' },
        })
      );

      await store.addEdge(
        createTestEdge('n1', 'n2', { id: 'e1', type: 'relatedTo' })
      );
      await store.addEdge(
        createTestEdge('n2', 'n3', { id: 'e2', type: 'mentions' })
      );
    });

    describe('query', () => {
      it('should return all nodes and edges with no filters', async () => {
        const result = await store.query();

        expect(result.nodes).toHaveLength(3);
        expect(result.edges).toHaveLength(2);
        expect(result.totalCount).toBe(5);
      });

      it('should filter by node types', async () => {
        const result = await store.query({ nodeTypes: ['concept', 'entity'] });

        expect(result.nodes).toHaveLength(2);
        expect(result.nodes.every((n) => ['concept', 'entity'].includes(n.type))).toBe(true);
      });

      it('should filter by edge types', async () => {
        const result = await store.query({ edgeTypes: ['relatedTo'] });

        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].type).toBe('relatedTo');
      });

      it('should filter by node properties', async () => {
        const result = await store.query({ nodeFilter: { category: 'AI' } });

        expect(result.nodes).toHaveLength(2);
        expect(result.nodes.every((n) => n.properties.category === 'AI')).toBe(true);
      });

      it('should filter by edge properties', async () => {
        await store.addEdge(
          createTestEdge('n1', 'n3', {
            id: 'e3',
            properties: { verified: true },
          })
        );

        const result = await store.query({
          edgeFilter: { verified: true },
        });

        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].id).toBe('e3');
      });

      it('should apply pagination to nodes', async () => {
        const result = await store.query({ offset: 1, limit: 1 });

        expect(result.nodes).toHaveLength(1);
        // Total count should still reflect all matches
        expect(result.totalCount).toBe(5);
      });

      it('should handle empty array filters (no matches)', async () => {
        const result = await store.query({ nodeTypes: [] });

        expect(result.nodes).toHaveLength(0);
      });
    });

    describe('findNodesByLabel', () => {
      it('should find nodes by exact label', async () => {
        const nodes = await store.findNodesByLabel('Machine Learning');

        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('n1');
      });

      it('should find nodes by partial label', async () => {
        const nodes = await store.findNodesByLabel('Learning');

        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('n1');
      });

      it('should be case-insensitive', async () => {
        const nodes = await store.findNodesByLabel('TENSORFLOW');

        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('n2');
      });

      it('should filter by type', async () => {
        // Add another node with similar label but different type
        await store.addNode(
          createTestNode({ id: 'n4', type: 'chunk', label: 'ML Code' })
        );

        const nodes = await store.findNodesByLabel('ML', { type: 'document' });

        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('n3');
      });

      it('should respect limit', async () => {
        await store.addNode(
          createTestNode({ id: 'n4', label: 'More ML Content' })
        );
        await store.addNode(
          createTestNode({ id: 'n5', label: 'Even More ML' })
        );

        const nodes = await store.findNodesByLabel('ML', { limit: 2 });

        expect(nodes).toHaveLength(2);
      });

      it('should return empty array when no matches', async () => {
        const nodes = await store.findNodesByLabel('NonExistent');
        expect(nodes).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Management Operations Tests
  // ===========================================================================

  describe('Management Operations', () => {
    let store: InMemoryGraphStore;

    beforeEach(() => {
      store = new InMemoryGraphStore();
    });

    describe('count', () => {
      it('should return zero counts for empty store', async () => {
        const counts = await store.count();
        expect(counts).toEqual({ nodes: 0, edges: 0 });
      });

      it('should return correct counts after inserts', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.addNode(createTestNode({ id: 'n2' }));
        await store.addEdge(createTestEdge('n1', 'n2'));

        const counts = await store.count();
        expect(counts).toEqual({ nodes: 2, edges: 1 });
      });

      it('should update counts after deletes', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.addNode(createTestNode({ id: 'n2' }));
        await store.addEdge(createTestEdge('n1', 'n2'));

        await store.deleteNode('n1');

        const counts = await store.count();
        expect(counts).toEqual({ nodes: 1, edges: 0 }); // Edge cascade deleted
      });
    });

    describe('clear', () => {
      it('should remove all nodes and edges', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.addNode(createTestNode({ id: 'n2' }));
        await store.addEdge(createTestEdge('n1', 'n2'));

        await store.clear();

        const counts = await store.count();
        expect(counts).toEqual({ nodes: 0, edges: 0 });
      });

      it('should be safe to call on empty store', async () => {
        await expect(store.clear()).resolves.toBeUndefined();
      });

      it('should allow adding nodes after clear', async () => {
        await store.addNode(createTestNode({ id: 'n1' }));
        await store.clear();
        await store.addNode(createTestNode({ id: 'n2' }));

        const counts = await store.count();
        expect(counts.nodes).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Edge Case Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    let store: InMemoryGraphStore;

    beforeEach(() => {
      store = new InMemoryGraphStore();
    });

    it('should handle empty graph operations gracefully', async () => {
      const result = await store.query();
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);

      const counts = await store.count();
      expect(counts).toEqual({ nodes: 0, edges: 0 });
    });

    it('should handle disconnected components', async () => {
      // Component 1
      await store.addNode(createTestNode({ id: 'a1' }));
      await store.addNode(createTestNode({ id: 'a2' }));
      await store.addEdge(createTestEdge('a1', 'a2'));

      // Component 2 (disconnected)
      await store.addNode(createTestNode({ id: 'b1' }));
      await store.addNode(createTestNode({ id: 'b2' }));
      await store.addEdge(createTestEdge('b1', 'b2'));

      // Traversing from a1 should not reach b1 or b2
      const neighbors = await store.getNeighbors('a1', { depth: 10 });
      const neighborIds = neighbors.map((n) => n.node.id);

      expect(neighborIds).toContain('a2');
      expect(neighborIds).not.toContain('b1');
      expect(neighborIds).not.toContain('b2');
    });

    it('should handle self-referencing nodes', async () => {
      await store.addNode(createTestNode({ id: 'n1' }));
      await store.addEdge(createTestEdge('n1', 'n1')); // Self-loop

      const edges = await store.getEdgesForNode('n1');
      expect(edges).toHaveLength(1); // Should count the self-loop once

      // getNeighbors should not return the same node
      const neighbors = await store.getNeighbors('n1', { depth: 1 });
      expect(neighbors).toHaveLength(0); // Can't be neighbor of yourself
    });

    it('should handle multiple edges between same nodes', async () => {
      await store.addNode(createTestNode({ id: 'n1' }));
      await store.addNode(createTestNode({ id: 'n2' }));

      // Multiple edges with different types
      await store.addEdge(
        createTestEdge('n1', 'n2', { id: 'e1', type: 'relatedTo' })
      );
      await store.addEdge(
        createTestEdge('n1', 'n2', { id: 'e2', type: 'references' })
      );
      await store.addEdge(
        createTestEdge('n1', 'n2', { id: 'e3', type: 'mentions' })
      );

      const edges = await store.getEdgesForNode('n1', 'outgoing');
      expect(edges).toHaveLength(3);

      // But getNeighbors should return n2 only once
      const neighbors = await store.getNeighbors('n1', { depth: 1 });
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].node.id).toBe('n2');
    });
  });
});

// =============================================================================
// GraphStoreError Tests
// =============================================================================

describe('GraphStoreError', () => {
  it('should create error with all properties', () => {
    const error = new GraphStoreError(
      'Test error',
      'NODE_NOT_FOUND',
      'TestStore'
    );

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('NODE_NOT_FOUND');
    expect(error.storeName).toBe('TestStore');
    expect(error.name).toBe('GraphStoreError');
  });

  it('should include cause if provided', () => {
    const cause = new Error('Original error');
    const error = new GraphStoreError(
      'Wrapped error',
      'STORE_ERROR',
      'TestStore',
      cause
    );

    expect(error.cause).toBe(cause);
  });

  describe('factory methods', () => {
    it('nodeNotFound', () => {
      const error = GraphStoreError.nodeNotFound('TestStore', 'node-123');
      expect(error.message).toBe('Node not found: node-123');
      expect(error.code).toBe('NODE_NOT_FOUND');
    });

    it('edgeNotFound', () => {
      const error = GraphStoreError.edgeNotFound('TestStore', 'edge-456');
      expect(error.message).toBe('Edge not found: edge-456');
      expect(error.code).toBe('EDGE_NOT_FOUND');
    });

    it('duplicateNode', () => {
      const error = GraphStoreError.duplicateNode('TestStore', 'dup-id');
      expect(error.message).toBe('Node already exists: dup-id');
      expect(error.code).toBe('DUPLICATE_NODE');
    });

    it('duplicateEdge', () => {
      const error = GraphStoreError.duplicateEdge('TestStore', 'dup-edge');
      expect(error.message).toBe('Edge already exists: dup-edge');
      expect(error.code).toBe('DUPLICATE_EDGE');
    });

    it('invalidNode', () => {
      const error = GraphStoreError.invalidNode('TestStore', 'missing label');
      expect(error.message).toBe('Invalid node: missing label');
      expect(error.code).toBe('INVALID_NODE');
    });

    it('invalidEdge', () => {
      const error = GraphStoreError.invalidEdge(
        'TestStore',
        'source not found'
      );
      expect(error.message).toBe('Invalid edge: source not found');
      expect(error.code).toBe('INVALID_EDGE');
    });

    it('capacityExceeded', () => {
      const error = GraphStoreError.capacityExceeded('TestStore', 'nodes', 100);
      expect(error.message).toBe(
        'Capacity exceeded: maximum nodes limit of 100 reached'
      );
      expect(error.code).toBe('CAPACITY_EXCEEDED');
    });
  });

  describe('toDetails', () => {
    it('should return structured error details', () => {
      const cause = new Error('DB connection failed');
      const error = GraphStoreError.storeUnavailable(
        'MyStore',
        'connection refused',
        cause
      );

      const details = error.toDetails();

      expect(details).toEqual({
        code: 'STORE_UNAVAILABLE',
        storeName: 'MyStore',
        cause,
      });
    });
  });
});
