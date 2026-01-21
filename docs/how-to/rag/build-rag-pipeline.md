# How to Build a RAG Pipeline

Step-by-step guide to building a complete RAG (Retrieval-Augmented Generation) pipeline.

## Prerequisites

```bash
pnpm add @contextai/core @contextai/rag @contextai/provider-openai zod
```

## Complete Pipeline

### Step 1: Set Up Embeddings

```typescript
import { HuggingFaceEmbeddingProvider } from '@contextai/rag';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5', // 384 dimensions
});

// Test it
const vector = await embeddings.embed('Hello world');
console.log('Dimensions:', vector.length); // 384
```

### Step 2: Create Vector Store

```typescript
import { InMemoryVectorStore } from '@contextai/rag';

const vectorStore = new InMemoryVectorStore({
  dimensions: 384, // Match embedding model
  distanceMetric: 'cosine',
});
```

### Step 3: Choose a Chunker

```typescript
import { RecursiveChunker } from '@contextai/rag';

const chunker = new RecursiveChunker({
  chunkSize: 512,
  separators: ['\n\n', '\n', '. ', ' '],
});
```

### Step 4: Set Up Retrieval

```typescript
import { DenseRetriever } from '@contextai/rag';

const retriever = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 10,
});
```

### Step 5: Add Reranking (Optional)

```typescript
import { BGEReranker } from '@contextai/rag';

const reranker = new BGEReranker({
  model: 'BAAI/bge-reranker-base',
});
```

### Step 6: Configure Assembly

```typescript
import { MarkdownAssembler } from '@contextai/rag';

const assembler = new MarkdownAssembler({
  headerLevel: 2,
  includeCitations: true,
});
```

### Step 7: Create RAG Engine

```typescript
import { RAGEngineImpl } from '@contextai/rag';

const rag = new RAGEngineImpl({
  embeddingProvider: embeddings,
  vectorStore,
  chunker,
  retriever,
  reranker,
  assembler,
});
```

## Complete Example

```typescript
// rag-pipeline.ts
import {
  RAGEngineImpl,
  InMemoryVectorStore,
  HuggingFaceEmbeddingProvider,
  RecursiveChunker,
  DenseRetriever,
  BGEReranker,
  MarkdownAssembler,
} from '@contextai/rag';

async function main() {
  // 1. Components
  const embeddings = new HuggingFaceEmbeddingProvider({
    model: 'BAAI/bge-small-en-v1.5',
  });

  const vectorStore = new InMemoryVectorStore({
    dimensions: 384,
  });

  const chunker = new RecursiveChunker({
    chunkSize: 512,
    separators: ['\n\n', '\n', '. ', ' '],
  });

  const retriever = new DenseRetriever({
    vectorStore,
    embeddings,
    topK: 10,
  });

  const reranker = new BGEReranker({
    model: 'BAAI/bge-reranker-base',
  });

  const assembler = new MarkdownAssembler({
    includeCitations: true,
  });

  // 2. Create engine
  const rag = new RAGEngineImpl({
    embeddingProvider: embeddings,
    vectorStore,
    chunker,
    retriever,
    reranker,
    assembler,
  });

  // 3. Ingest documents
  await rag.ingest([
    {
      content: `
# Authentication Guide

## Overview
Our API uses JWT tokens for authentication.

## Getting a Token
1. Call POST /auth/login with credentials
2. Receive a JWT token in the response
3. Include token in Authorization header

## Token Refresh
Tokens expire after 1 hour. Call POST /auth/refresh to get a new token.
      `,
      metadata: { source: 'auth-guide.md', category: 'authentication' },
    },
    {
      content: `
# API Reference

## Endpoints

### GET /users
Returns a list of users.

### POST /users
Create a new user.

### GET /users/:id
Get a specific user by ID.
      `,
      metadata: { source: 'api-reference.md', category: 'api' },
    },
  ]);

  console.log('Documents ingested!');

  // 4. Search
  const results = await rag.search('How do I authenticate API requests?', {
    topK: 5,
    rerank: true,
    maxTokens: 2000,
  });

  console.log('\n=== Search Results ===\n');
  console.log('Context for LLM:');
  console.log(results.context);
  console.log('\nSources:');
  results.sources.forEach((s) => {
    console.log(`- ${s.source} (score: ${s.relevanceScore.toFixed(2)})`);
  });
  console.log('\nTimings:');
  console.log(`- Retrieve: ${results.timings.retrieveMs}ms`);
  console.log(`- Rerank: ${results.timings.rerankMs}ms`);
  console.log(`- Total: ${results.timings.totalMs}ms`);
}

main().catch(console.error);
```

## Ingesting Documents

### From Files

```typescript
import { defaultRegistry } from '@contextai/rag';
import * as fs from 'fs/promises';
import * as path from 'path';

async function ingestDirectory(dir: string) {
  const files = await fs.readdir(dir);

  const documents = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      return {
        content,
        metadata: { source: file },
      };
    })
  );

  await rag.ingest(documents);
}

await ingestDirectory('./docs');
```

### With Metadata

```typescript
await rag.ingest([
  {
    content: 'Document content...',
    metadata: {
      source: 'guide.md',
      category: 'tutorial',
      author: 'Alice',
      createdAt: new Date().toISOString(),
      version: '2.0',
    },
  },
]);
```

### Incremental Updates

```typescript
// Add new documents
await rag.ingest([newDoc1, newDoc2]);

// Delete by metadata filter
await vectorStore.delete({ source: 'old-doc.md' });

// Update = delete + re-ingest
await vectorStore.delete({ source: 'updated-doc.md' });
await rag.ingest([updatedDoc]);
```

## Search Options

```typescript
const results = await rag.search(query, {
  // Retrieval
  topK: 20,              // Initial candidates
  filter: {              // Metadata filter
    category: 'docs',
  },

  // Reranking
  rerank: true,          // Enable reranking
  finalK: 5,             // Keep after reranking

  // Assembly
  maxTokens: 4000,       // Token budget
  deduplication: true,   // Remove duplicates
});
```

## Using with an Agent

```typescript
import { Agent, defineTool } from '@contextai/core';
import { z } from 'zod';

const searchKnowledgeTool = defineTool({
  name: 'search_knowledge',
  description: 'Search the knowledge base for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    const results = await rag.search(query, {
      topK: 5,
      rerank: true,
      maxTokens: 2000,
    });

    return {
      context: results.context,
      sources: results.sources.map((s) => s.source),
    };
  },
});

const agent = new Agent({
  name: 'Knowledge Assistant',
  systemPrompt: `You answer questions using the knowledge base.
    Always use search_knowledge for factual questions.
    Cite sources in your answers.`,
  llm: provider,
  tools: [searchKnowledgeTool],
});

const response = await agent.run('How do I authenticate API requests?');
```

## Performance Optimization

### Batch Embeddings

```typescript
// Embedding provider handles batching internally
const vectors = await embeddings.embedBatch([
  'text 1',
  'text 2',
  'text 3',
]);
```

### Caching

```typescript
import { CachedEmbeddingProvider, LRUEmbeddingCache } from '@contextai/rag';

const cache = new LRUEmbeddingCache({ maxSize: 10000 });
const cachedEmbeddings = new CachedEmbeddingProvider({
  provider: embeddings,
  cache,
});

const rag = new RAGEngineImpl({
  embeddingProvider: cachedEmbeddings,
  // ...
});
```

### Pre-filtering

```typescript
// Filter before vector search (faster)
const results = await rag.search(query, {
  filter: { category: 'authentication' },
});
```

## Troubleshooting

### Poor Results

1. **Check chunk sizes** - Too large = diluted, too small = lost context
2. **Try hybrid search** - Add keyword matching
3. **Enable reranking** - Better relevance ordering

### Slow Performance

1. **Reduce topK** - Fewer candidates to process
2. **Enable caching** - Avoid re-embedding
3. **Use smaller models** - BGE-small vs BGE-large

### Out of Memory

1. **Batch ingestion** - Process documents in chunks
2. **Use external vector store** - pgvector instead of in-memory
3. **Limit cache size** - Set maxSize on LRU cache

## Next Steps

- [Hybrid Search](./hybrid-search.md) - Combine dense and sparse
- [Agentic RAG](./agentic-rag.md) - Agent-driven retrieval
- [RAG Concepts](../../concepts/rag/overview.md) - Deep dive
