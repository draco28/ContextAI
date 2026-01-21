# pgvector Integration

Use PostgreSQL with pgvector for production-ready vector storage.

## Why pgvector?

- **Production-ready** - PostgreSQL reliability
- **ACID transactions** - Consistent data
- **Familiar** - SQL queries and tooling
- **Scalable** - Billions of vectors
- **Hybrid queries** - Combine vector + metadata filters

## Prerequisites

### PostgreSQL with pgvector

```bash
# Docker (recommended for development)
docker run -d \
  --name pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Or install extension on existing PostgreSQL
CREATE EXTENSION vector;
```

## Installation

```bash
pnpm add @contextai/rag pg
```

## Quick Start

```typescript
import { PgVectorStore } from '@contextai/rag';

const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL!,
  tableName: 'embeddings',
  dimensions: 384,
});

// Initialize table
await vectorStore.initialize();

// Add vectors
await vectorStore.add([
  {
    id: '1',
    vector: embedding,
    content: 'Document text...',
    metadata: { source: 'doc.md' },
  },
]);

// Search
const results = await vectorStore.search(queryVector, { topK: 5 });
```

## Configuration

### Connection Options

```typescript
const vectorStore = new PgVectorStore({
  // Connection string
  connectionString: 'postgresql://user:pass@localhost:5432/db',

  // Or individual options
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'secret',

  // Table configuration
  tableName: 'embeddings', // Default
  dimensions: 384, // Must match your embedding model

  // Performance
  poolSize: 10, // Connection pool size
});
```

### Distance Metrics

```typescript
const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL!,
  dimensions: 384,

  // Distance metric (default: cosine)
  distanceMetric: 'cosine', // cosine, l2, inner_product
});
```

| Metric | Use Case |
|--------|----------|
| `cosine` | Text embeddings (normalized) |
| `l2` | Image embeddings |
| `inner_product` | When vectors are normalized |

## Schema

The table is created automatically:

```sql
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  vector VECTOR(384),  -- dimensions
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);
```

## Operations

### Add Vectors

```typescript
// Single
await vectorStore.add([{
  id: 'doc-1',
  vector: [0.1, 0.2, ...],
  content: 'Original text',
  metadata: { source: 'file.md', category: 'docs' },
}]);

// Batch
await vectorStore.add(chunks.map((chunk, i) => ({
  id: `chunk-${i}`,
  vector: embeddings[i],
  content: chunk.content,
  metadata: chunk.metadata,
})));
```

### Search

```typescript
// Basic search
const results = await vectorStore.search(queryVector, {
  topK: 10,
});

// With metadata filter
const results = await vectorStore.search(queryVector, {
  topK: 10,
  filter: {
    category: 'documentation',
    version: '2.0',
  },
});
```

### Delete

```typescript
// By ID
await vectorStore.delete({ id: 'doc-1' });

// By metadata filter
await vectorStore.delete({ source: 'old-file.md' });
```

### Update

```typescript
// Delete and re-add
await vectorStore.delete({ id: 'doc-1' });
await vectorStore.add([{
  id: 'doc-1',
  vector: newEmbedding,
  content: 'Updated content',
  metadata: { source: 'file.md' },
}]);
```

## Indexing

### IVFFlat Index

Good for most use cases:

```sql
-- Create index (do this after inserting data)
CREATE INDEX ON embeddings
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);  -- Adjust based on data size
```

**lists parameter**: `sqrt(rows)` is a good starting point.

### HNSW Index

Faster but more memory:

```sql
CREATE INDEX ON embeddings
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### When to Index

```typescript
// 1. Insert all data first (faster without index)
await vectorStore.add(allDocuments);

// 2. Then create index
await vectorStore.createIndex({
  type: 'ivfflat',
  lists: Math.sqrt(allDocuments.length),
});
```

## With RAG Engine

```typescript
import {
  RAGEngineImpl,
  PgVectorStore,
  HuggingFaceEmbeddingProvider,
  RecursiveChunker,
  DenseRetriever,
} from '@contextai/rag';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL!,
  dimensions: 384,
});

await vectorStore.initialize();

const retriever = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 10,
});

const rag = new RAGEngineImpl({
  embeddingProvider: embeddings,
  vectorStore,
  chunker: new RecursiveChunker({ chunkSize: 512 }),
  retriever,
});

// Ingest documents
await rag.ingest(documents);

// Search
const results = await rag.search('How to authenticate?');
```

## Performance Tips

### 1. Batch Operations

```typescript
// Good: Batch inserts
await vectorStore.add(allChunks);

// Bad: Individual inserts
for (const chunk of chunks) {
  await vectorStore.add([chunk]); // Slow!
}
```

### 2. Connection Pooling

```typescript
const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL!,
  poolSize: 20, // Adjust based on load
});
```

### 3. Partial Indexes

For frequently filtered queries:

```sql
CREATE INDEX ON embeddings
USING ivfflat (vector vector_cosine_ops)
WHERE metadata->>'category' = 'documentation';
```

### 4. Query Optimization

```typescript
// Use metadata filters to reduce search space
const results = await vectorStore.search(queryVector, {
  topK: 10,
  filter: { category: 'docs' }, // Narrows search
});
```

## Migrations

### Adding New Metadata Fields

```sql
-- pgvector uses JSONB, so no migration needed
-- Just add new fields to metadata
```

### Changing Dimensions

```sql
-- Requires rebuilding the table
CREATE TABLE embeddings_new (
  id TEXT PRIMARY KEY,
  vector VECTOR(768),  -- New dimensions
  content TEXT,
  metadata JSONB
);

-- Re-embed and insert data
-- Then swap tables
```

## Troubleshooting

### "Extension Not Found"

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Slow Queries

1. Check index exists: `\d embeddings`
2. Rebuild index: `REINDEX INDEX embeddings_vector_idx;`
3. Increase `lists` parameter

### Out of Memory

```sql
-- Reduce work_mem for index building
SET work_mem = '64MB';
```

## Next Steps

- [HuggingFace Embeddings](../embeddings/huggingface.md) - Local embeddings
- [Build RAG Pipeline](../../how-to/rag/build-rag-pipeline.md) - Complete setup
- [Hybrid Search](../../how-to/rag/hybrid-search.md) - Dense + sparse
