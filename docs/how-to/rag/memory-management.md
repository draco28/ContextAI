# Memory Management for RAG Applications

This guide covers memory-efficient storage and budget enforcement in the `@contextai/rag` package.

## Overview

When building RAG (Retrieval-Augmented Generation) applications, memory usage can quickly become a concern:

- **Embeddings are large**: A single 1536-dimension embedding (OpenAI's `text-embedding-3-small`) uses 12KB in JavaScript's default `number[]` format
- **Scaling compounds the problem**: 10,000 embeddings = 120MB just for vectors
- **Memory leaks hurt production**: Unbounded caches and stores can exhaust server memory

The RAG package addresses these challenges with:

1. **Float32Array storage** - 50% memory reduction
2. **Memory budgets** - Automatic LRU eviction when limits exceeded
3. **Monitoring utilities** - Track and debug memory usage

## Float32Array Storage

By default, `InMemoryVectorStore` stores embeddings as `Float32Array` instead of `number[]`:

```typescript
import { InMemoryVectorStore } from '@contextai/rag';

// Float32 is enabled by default (useFloat32: true)
const store = new InMemoryVectorStore({
  dimensions: 1536,
});

console.log(store.isUsingFloat32()); // true
```

### Why Float32?

| Format | Bytes per Float | 1000 Embeddings (1536 dims) |
|--------|-----------------|------------------------------|
| `number[]` (Float64) | 8 | ~12.3 MB |
| `Float32Array` | 4 | **~6.1 MB** |

**50% memory savings** with negligible accuracy loss for embedding similarity comparisons.

### Disabling Float32 (if needed)

```typescript
const store = new InMemoryVectorStore({
  dimensions: 1536,
  useFloat32: false,  // Use number[] instead
});
```

> **Note**: The API always accepts and returns `number[]`. Float32 conversion is internal.

## Memory Budget Enforcement

Set a memory limit with automatic LRU (Least Recently Used) eviction:

```typescript
import { InMemoryVectorStore, formatBytes } from '@contextai/rag';

const store = new InMemoryVectorStore({
  dimensions: 1536,
  maxMemoryBytes: 100 * 1024 * 1024,  // 100MB limit
  onEviction: (evictedIds, freedBytes) => {
    console.log(`Evicted ${evictedIds.length} chunks, freed ${formatBytes(freedBytes)}`);
  },
});
```

### How Eviction Works

1. When new chunks are inserted, the store calculates required memory
2. If inserting would exceed `maxMemoryBytes`, oldest chunks are evicted
3. Eviction continues until there's room for the new chunks
4. The `onEviction` callback fires with evicted IDs

### Eviction Order

Chunks are evicted in **insertion order** (oldest first). This LRU-like policy ensures frequently-updated data stays in memory while stale data is removed.

## Memory Monitoring

### Vector Store Statistics

```typescript
const stats = store.getMemoryStats();

console.log(`Chunks: ${stats.chunkCount}`);
console.log(`Memory: ${formatBytes(stats.usedBytes)} / ${formatBytes(stats.maxBytes)}`);
console.log(`Per chunk: ${formatBytes(stats.bytesPerChunk)}`);
console.log(`Usage: ${stats.percentUsed.toFixed(1)}%`);
console.log(`Float32: ${stats.useFloat32}`);
```

### Global Memory Statistics

```typescript
import { getMemoryStats, formatMemoryStats } from '@contextai/rag';

const memory = getMemoryStats();
console.log(formatMemoryStats(memory));
// Output: Heap: 45.2/128.0 MB | External: 2.1 MB | ArrayBuffers: 6.1 MB | RSS: 89.3 MB
```

### Size Estimation

Estimate memory usage before allocating:

```typescript
import { estimateSize, estimateEmbeddingMemory, formatBytes } from '@contextai/rag';

// Estimate embedding memory
const bytes = estimateEmbeddingMemory(1536, 1000, true);  // 1000 chunks, Float32
console.log(`Estimated: ${formatBytes(bytes)}`);  // "5.86 MB"

// Estimate arbitrary value size
const obj = { chunks: [...], metadata: {...} };
console.log(`Object size: ${formatBytes(estimateSize(obj))}`);
```

## LRU Cache Memory Limits

The embedding cache also supports memory-based limits:

```typescript
import { LRUCacheProvider, estimateSize } from '@contextai/rag';

const cache = new LRUCacheProvider<string, number[]>({
  maxMemoryBytes: 50 * 1024 * 1024,  // 50MB limit
  estimateSize: (embedding) => embedding.length * 8,  // number[] uses 8 bytes/float
});

// Or use the built-in estimator for complex values
const cache = new LRUCacheProvider({
  maxMemoryBytes: 50 * 1024 * 1024,
  estimateSize: estimateSize,  // Handles objects, arrays, typed arrays
});
```

### Count vs Memory Limits

| Config | Behavior |
|--------|----------|
| `maxSize: 1000` | Evict when >1000 items |
| `maxMemoryBytes: 100MB` | Evict when >100MB used |
| Both | Evict when either limit hit |

## Configuration Examples

### Development (No Limits)

```typescript
const store = new InMemoryVectorStore({
  dimensions: 1536,
  // No maxMemoryBytes = no eviction
});
```

### Production (Bounded Memory)

```typescript
const store = new InMemoryVectorStore({
  dimensions: 1536,
  maxMemoryBytes: 100 * 1024 * 1024,  // 100MB
  onEviction: (ids, bytes) => {
    metrics.increment('rag.evictions', ids.length);
    logger.warn(`Evicted ${ids.length} chunks due to memory pressure`);
  },
});
```

### High-Volume with HNSW

```typescript
const store = new InMemoryVectorStore({
  dimensions: 1536,
  indexType: 'hnsw',           // O(log n) search
  maxMemoryBytes: 500 * 1024 * 1024,  // 500MB budget
  hnswConfig: {
    M: 16,
    efConstruction: 200,
    efSearch: 100,
  },
});
```

## NFR-103 Compliance

The SDK meets the requirement: **baseline memory usage shall not exceed 100MB for typical workloads with 1000 chunks**.

### Proof

```typescript
import { InMemoryVectorStore, formatBytes } from '@contextai/rag';

const store = new InMemoryVectorStore({
  dimensions: 1536,  // OpenAI embedding size
  useFloat32: true,  // Default
});

// Insert 1000 chunks
const chunks = Array.from({ length: 1000 }, (_, i) => ({
  id: `chunk-${i}`,
  content: `Content ${i}`,
  metadata: { index: i },
  embedding: new Array(1536).fill(0).map(() => Math.random()),
}));

await store.insert(chunks);

const stats = store.getMemoryStats();
console.log(`Memory used: ${formatBytes(stats.usedBytes)}`);
// Output: "Memory used: 5.86 MB"
```

**Result**: 1000 chunks with 1536-dimension embeddings use **~6 MB** - well under the 100MB requirement.

## API Reference

### InMemoryVectorStore Config

```typescript
interface InMemoryVectorStoreConfig {
  dimensions: number;           // Required: embedding dimensions
  useFloat32?: boolean;         // Default: true (50% memory savings)
  maxMemoryBytes?: number;      // Optional: memory budget in bytes
  onEviction?: (ids: string[], freedBytes: number) => void;
  // ... other options
}
```

### Memory Utilities

```typescript
// Get Node.js memory stats
function getMemoryStats(): MemoryStats;

// Format stats as human-readable string
function formatMemoryStats(stats: MemoryStats): string;

// Estimate memory size of any value
function estimateSize(value: unknown, options?: { maxDepth?: number }): number;

// Calculate embedding memory requirements
function estimateEmbeddingMemory(
  dimensions: number,
  count: number,
  useFloat32?: boolean
): number;

// Format bytes as human-readable string
function formatBytes(bytes: number, precision?: number): string;

// Convert between formats
function toFloat32Array(embedding: number[]): Float32Array;
function toNumberArray(embedding: Float32Array): number[];
```

### MemoryBudget Class

For custom memory tracking:

```typescript
import { MemoryBudget } from '@contextai/rag';

const budget = new MemoryBudget({
  maxBytes: 100 * 1024 * 1024,
  warningThreshold: 0.8,  // Fire onWarning at 80%
  onWarning: (used, max) => console.warn(`Memory warning: ${used}/${max}`),
  onExceeded: (used, max) => console.error(`Memory exceeded: ${used}/${max}`),
});

budget.track(1000);     // Add 1000 bytes
budget.release(500);    // Remove 500 bytes
budget.check();         // { ok: true, used: 500, available: 99999500, percentage: 0.0005 }
budget.wouldExceed(n);  // Check without modifying
budget.reset();         // Reset to zero
```
