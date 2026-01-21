/**
 * E2E Test Helpers
 *
 * Utilities for end-to-end testing of the RAG pipeline.
 * Provides deterministic embedding providers, pipeline factories,
 * and performance measurement helpers.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EmbeddingProvider, EmbeddingResult } from '../../src/embeddings/types.js';
import type { Chunk, ChunkWithEmbedding, VectorStore } from '../../src/vector-store/types.js';
import type { ChunkingStrategy } from '../../src/chunking/types.js';
import type { Document } from '../../src/loaders/types.js';

// ============================================================================
// Path Utilities
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get the absolute path to a fixture file.
 */
export function getFixturePath(filename: string): string {
  return resolve(__dirname, 'fixtures', filename);
}

// ============================================================================
// Deterministic Embedding Provider
// ============================================================================

/**
 * A deterministic embedding provider for E2E tests.
 *
 * Generates consistent embeddings based on text content using a hash-based
 * approach. Similar texts will produce similar vectors, enabling meaningful
 * semantic search in tests without external dependencies.
 *
 * Key properties:
 * - Same text always produces same embedding (deterministic)
 * - Different texts produce different embeddings (discriminative)
 * - Embeddings are normalized (unit length)
 * - Fast: No external API calls
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'DeterministicTestProvider';
  readonly dimensions: number;
  readonly maxBatchSize = 100;

  constructor(dimensions = 128) {
    this.dimensions = dimensions;
  }

  /**
   * Generate a deterministic embedding for text.
   *
   * Uses a combination of:
   * 1. Character-level hash for base vector
   * 2. Word frequency for additional variation
   * 3. Length normalization
   */
  embed = async (text: string): Promise<EmbeddingResult> => {
    const embedding = this.generateEmbedding(text);
    return {
      embedding,
      tokenCount: Math.ceil(text.length / 4), // Approximate tokens
      model: 'deterministic-test-v1',
    };
  };

  /**
   * Batch embed multiple texts.
   */
  embedBatch = async (texts: string[]): Promise<EmbeddingResult[]> => {
    return Promise.all(texts.map((text) => this.embed(text)));
  };

  /**
   * Always available (no external dependencies).
   */
  isAvailable = async (): Promise<boolean> => {
    return true;
  };

  /**
   * Generate a deterministic embedding vector from text.
   *
   * Algorithm:
   * 1. Split text into words
   * 2. For each word, hash it to an index in the vector
   * 3. Increment that dimension based on word frequency
   * 4. Add character-level features for fine-grained similarity
   * 5. Normalize to unit length
   */
  private generateEmbedding(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const normalizedText = text.toLowerCase().trim();

    if (normalizedText.length === 0) {
      // Return a zero-like vector for empty text
      vector[0] = 1;
      return this.normalize(vector);
    }

    // Word-level features (coarse semantic similarity)
    const words = normalizedText.split(/\s+/).filter((w) => w.length > 0);
    for (const word of words) {
      const hash = this.hashString(word);
      const index = Math.abs(hash) % this.dimensions;
      vector[index] += 1;

      // Add bigram features for adjacent dimensions
      const bigramIndex = (index + 1) % this.dimensions;
      vector[bigramIndex] += 0.5;
    }

    // Character-level features (fine-grained similarity)
    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const index = (charCode * 17) % this.dimensions; // Prime multiplier for spread
      vector[index] += 0.1;
    }

    // Add length-based feature
    const lengthIndex = (normalizedText.length * 7) % this.dimensions;
    vector[lengthIndex] += Math.log(normalizedText.length + 1);

    return this.normalize(vector);
  }

  /**
   * Simple string hash function (djb2 variant).
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Ensure positive
  }

  /**
   * Normalize vector to unit length (L2 normalization).
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) {
      vector[0] = 1; // Avoid zero vector
      return vector;
    }
    return vector.map((v) => v / magnitude);
  }
}

// ============================================================================
// Mock LLM Provider for Agentic Chunker
// ============================================================================

/**
 * Configuration for mock LLM responses.
 */
export interface MockLLMConfig {
  /** Fixed response to return for any input */
  response?: string;
  /** Function to generate response based on input */
  responseGenerator?: (prompt: string) => string;
  /** Simulate delay in milliseconds */
  delayMs?: number;
  /** Simulate failure */
  shouldFail?: boolean;
  /** Error message when failing */
  errorMessage?: string;
}

/**
 * A mock LLM provider for testing agentic components.
 *
 * Returns deterministic responses for chunking boundary detection.
 */
export class MockLLMProvider {
  private config: MockLLMConfig;

  constructor(config: MockLLMConfig = {}) {
    this.config = config;
  }

  /**
   * Generate a completion for the given prompt.
   */
  async complete(prompt: string): Promise<string> {
    if (this.config.shouldFail) {
      throw new Error(this.config.errorMessage ?? 'Mock LLM failure');
    }

    if (this.config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    if (this.config.responseGenerator) {
      return this.config.responseGenerator(prompt);
    }

    if (this.config.response) {
      return this.config.response;
    }

    // Default: return JSON for agentic chunker
    return JSON.stringify({
      boundaries: [0, 100, 200],
      reasoning: 'Default test boundaries',
    });
  }
}

// ============================================================================
// Pipeline Helpers
// ============================================================================

/**
 * Options for document ingestion.
 */
export interface IngestOptions {
  /** Chunking strategy to use */
  chunker: ChunkingStrategy;
  /** Embedding provider */
  embedder: EmbeddingProvider;
  /** Vector store for storage */
  store: VectorStore;
  /** Document ID prefix */
  documentIdPrefix?: string;
}

/**
 * Result of document ingestion.
 */
export interface IngestResult {
  /** Original documents */
  documents: Document[];
  /** Generated chunks */
  chunks: Chunk[];
  /** Chunks with embeddings */
  chunksWithEmbeddings: ChunkWithEmbedding[];
  /** IDs in vector store */
  storedIds: string[];
  /** Time measurements */
  timing: {
    chunkingMs: number;
    embeddingMs: number;
    storageMs: number;
    totalMs: number;
  };
}

/**
 * Ingest documents through the full RAG pipeline.
 *
 * Performs: Document → Chunks → Embeddings → Storage
 */
export async function ingestDocuments(
  documents: Document[],
  options: IngestOptions
): Promise<IngestResult> {
  const startTime = performance.now();
  const { chunker, embedder, store, documentIdPrefix = 'doc' } = options;

  // Step 1: Chunk documents
  const chunkStart = performance.now();
  const allChunks: Chunk[] = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]!;
    // Ensure document has all required fields
    // Use documentIdPrefix if provided, otherwise use existing doc.id
    const docId = documentIdPrefix ? `${documentIdPrefix}-${i}` : (doc.id ?? `doc-${i}`);
    const fullDoc: Document = {
      id: docId,
      content: doc.content,
      source: doc.source,
      metadata: {
        ...doc.metadata,
      },
    };
    const chunks = await chunker.chunk(fullDoc);
    allChunks.push(...chunks);
  }
  const chunkingMs = performance.now() - chunkStart;

  // Step 2: Generate embeddings
  const embedStart = performance.now();
  const texts = allChunks.map((c) => c.content);
  const embeddings = await embedder.embedBatch(texts);

  const chunksWithEmbeddings: ChunkWithEmbedding[] = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i]!.embedding,
  }));
  const embeddingMs = performance.now() - embedStart;

  // Step 3: Store in vector store
  const storageStart = performance.now();
  const storedIds = await store.insert(chunksWithEmbeddings);
  const storageMs = performance.now() - storageStart;

  const totalMs = performance.now() - startTime;

  return {
    documents,
    chunks: allChunks,
    chunksWithEmbeddings,
    storedIds,
    timing: {
      chunkingMs,
      embeddingMs,
      storageMs,
      totalMs,
    },
  };
}

// ============================================================================
// Performance Measurement
// ============================================================================

/**
 * Measure the execution time of an async function.
 */
export async function measureLatency<T>(
  fn: () => Promise<T>
): Promise<{ result: T; latencyMs: number }> {
  const start = performance.now();
  const result = await fn();
  const latencyMs = performance.now() - start;
  return { result, latencyMs };
}

/**
 * Run a function multiple times and collect statistics.
 */
export async function benchmark<T>(
  fn: () => Promise<T>,
  iterations: number = 10
): Promise<{
  results: T[];
  latencies: number[];
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
}> {
  const results: T[] = [];
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { result, latencyMs } = await measureLatency(fn);
    results.push(result);
    latencies.push(latencyMs);
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);

  return {
    results,
    latencies,
    avgMs: sum / iterations,
    minMs: sorted[0]!,
    maxMs: sorted[sorted.length - 1]!,
    p50Ms: sorted[Math.floor(iterations * 0.5)]!,
    p95Ms: sorted[Math.floor(iterations * 0.95)]!,
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Verify that search results are sorted by score descending.
 */
export function assertResultsSortedByScore(
  results: Array<{ score: number }>
): void {
  for (let i = 1; i < results.length; i++) {
    if (results[i]!.score > results[i - 1]!.score) {
      throw new Error(
        `Results not sorted: index ${i - 1} (${results[i - 1]!.score}) < index ${i} (${results[i]!.score})`
      );
    }
  }
}

/**
 * Create a simple test document.
 */
export function createTestDocument(
  content: string,
  source = 'test.txt',
  metadata: Record<string, unknown> = {}
): Document {
  // Generate a simple ID from source and content hash
  const id = `doc-${source.replace(/[^a-zA-Z0-9]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    content,
    source,
    metadata: {
      ...metadata,
      loadedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate N test documents with varying content.
 */
export function generateTestDocuments(count: number): Document[] {
  const topics = [
    'machine learning',
    'software testing',
    'database optimization',
    'web development',
    'cloud computing',
    'data engineering',
    'security practices',
    'API design',
  ];

  return Array.from({ length: count }, (_, i) => {
    const topic = topics[i % topics.length]!;
    const content = `Document ${i + 1}: ${topic}

This document discusses various aspects of ${topic}.
It covers fundamental concepts, best practices, and advanced techniques.

Section 1: Introduction to ${topic}
Understanding ${topic} is essential for modern software development.
This section provides an overview of key concepts.

Section 2: Best Practices
When working with ${topic}, consider these guidelines:
- Practice 1: Follow established patterns
- Practice 2: Test thoroughly
- Practice 3: Document your work

Section 3: Advanced Topics
For experienced practitioners, ${topic} offers deeper exploration.
Advanced techniques can significantly improve outcomes.

Conclusion
Mastering ${topic} requires continuous learning and practice.`;

    return createTestDocument(content, `doc-${i + 1}.md`, { topic, index: i });
  });
}

// ============================================================================
// Environment Checks
// ============================================================================

/**
 * Check if PostgreSQL is available for testing.
 */
export async function isPgAvailable(): Promise<boolean> {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.PG_CONNECTION_STRING ?? 'postgresql://localhost:5432/test',
      connectionTimeoutMillis: 2000,
    });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ChromaDB is available for testing.
 */
export async function isChromaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      process.env.CHROMA_URL ?? 'http://localhost:8000/api/v1/heartbeat',
      { method: 'GET', signal: AbortSignal.timeout(2000) }
    );
    return response.ok;
  } catch {
    return false;
  }
}
