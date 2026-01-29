/**
 * Knowledge Graph Errors
 */

import { ContextAIError } from '@contextaisdk/core';
import type { GraphStoreErrorCode, GraphStoreErrorDetails } from './types.js';

/**
 * Error thrown when knowledge graph operations fail.
 *
 * Provides structured error information with error codes for
 * programmatic handling.
 *
 * @example
 * ```typescript
 * // Using factory methods (preferred)
 * throw GraphStoreError.nodeNotFound('MyStore', 'node-123');
 *
 * // Direct construction
 * throw new GraphStoreError(
 *   'Custom error message',
 *   'STORE_ERROR',
 *   'MyStore',
 *   originalError
 * );
 * ```
 */
export class GraphStoreError extends ContextAIError {
  /** Machine-readable error code */
  readonly code: GraphStoreErrorCode;
  /** Name of the store that failed */
  readonly storeName: string;
  /** Underlying cause, if any */
  override readonly cause?: Error;

  constructor(
    message: string,
    code: GraphStoreErrorCode,
    storeName: string,
    cause?: Error
  ) {
    super(message, `GRAPHSTORE_${code}`);
    this.name = 'GraphStoreError';
    this.code = code;
    this.storeName = storeName;
    this.cause = cause;
  }

  /**
   * Get error details as a structured object.
   */
  toDetails(): GraphStoreErrorDetails {
    return {
      code: this.code,
      storeName: this.storeName,
      cause: this.cause,
    };
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create an error for node not found.
   */
  static nodeNotFound(storeName: string, nodeId: string): GraphStoreError {
    return new GraphStoreError(
      `Node not found: ${nodeId}`,
      'NODE_NOT_FOUND',
      storeName
    );
  }

  /**
   * Create an error for edge not found.
   */
  static edgeNotFound(storeName: string, edgeId: string): GraphStoreError {
    return new GraphStoreError(
      `Edge not found: ${edgeId}`,
      'EDGE_NOT_FOUND',
      storeName
    );
  }

  /**
   * Create an error for duplicate node.
   */
  static duplicateNode(storeName: string, nodeId: string): GraphStoreError {
    return new GraphStoreError(
      `Node already exists: ${nodeId}`,
      'DUPLICATE_NODE',
      storeName
    );
  }

  /**
   * Create an error for duplicate edge.
   */
  static duplicateEdge(storeName: string, edgeId: string): GraphStoreError {
    return new GraphStoreError(
      `Edge already exists: ${edgeId}`,
      'DUPLICATE_EDGE',
      storeName
    );
  }

  /**
   * Create an error for invalid node (e.g., missing source/target).
   */
  static invalidNode(storeName: string, reason: string): GraphStoreError {
    return new GraphStoreError(
      `Invalid node: ${reason}`,
      'INVALID_NODE',
      storeName
    );
  }

  /**
   * Create an error for invalid edge (e.g., missing source/target nodes).
   */
  static invalidEdge(storeName: string, reason: string): GraphStoreError {
    return new GraphStoreError(
      `Invalid edge: ${reason}`,
      'INVALID_EDGE',
      storeName
    );
  }

  /**
   * Create an error for store unavailable.
   */
  static storeUnavailable(
    storeName: string,
    reason: string,
    cause?: Error
  ): GraphStoreError {
    return new GraphStoreError(
      `Store unavailable: ${reason}`,
      'STORE_UNAVAILABLE',
      storeName,
      cause
    );
  }

  /**
   * Create an error for capacity exceeded.
   */
  static capacityExceeded(
    storeName: string,
    type: 'nodes' | 'edges',
    limit: number
  ): GraphStoreError {
    return new GraphStoreError(
      `Capacity exceeded: maximum ${type} limit of ${limit} reached`,
      'CAPACITY_EXCEEDED',
      storeName
    );
  }

  /**
   * Create an error for insert failure.
   */
  static insertFailed(
    storeName: string,
    reason: string,
    cause?: Error
  ): GraphStoreError {
    return new GraphStoreError(
      `Insert failed: ${reason}`,
      'INSERT_FAILED',
      storeName,
      cause
    );
  }

  /**
   * Create an error for update failure.
   */
  static updateFailed(
    storeName: string,
    reason: string,
    cause?: Error
  ): GraphStoreError {
    return new GraphStoreError(
      `Update failed: ${reason}`,
      'UPDATE_FAILED',
      storeName,
      cause
    );
  }

  /**
   * Create an error for delete failure.
   */
  static deleteFailed(
    storeName: string,
    reason: string,
    cause?: Error
  ): GraphStoreError {
    return new GraphStoreError(
      `Delete failed: ${reason}`,
      'DELETE_FAILED',
      storeName,
      cause
    );
  }

  /**
   * Create an error for query failure.
   */
  static queryFailed(
    storeName: string,
    reason: string,
    cause?: Error
  ): GraphStoreError {
    return new GraphStoreError(
      `Query failed: ${reason}`,
      'QUERY_FAILED',
      storeName,
      cause
    );
  }
}
