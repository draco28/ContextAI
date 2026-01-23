# @contextaisdk/rag

> Production-grade RAG pipeline with hybrid retrieval, reranking, and context assembly

[![npm version](https://img.shields.io/npm/v/@contextaisdk/rag.svg?style=flat-square)](https://www.npmjs.com/package/@contextaisdk/rag)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @contextaisdk/rag
# or
pnpm add @contextaisdk/rag
```

## Overview

`@contextaisdk/rag` implements a 9-stage RAG (Retrieval-Augmented Generation) pipeline designed for production use:

```mermaid
graph LR
    subgraph "Indexing (Offline)"
        A[Documents] --> B[Chunk]
        B --> C[Embed]
        C --> D[Store]
    end

    subgraph "Query (Online)"
        E[Query] --> F[Enhance]
        F --> G[Retrieve]
        G --> H[Rerank]
        H --> I[Assemble]
    end

    D -.-> G
```

## Quick Start

```typescript
import {
  RAGEngineImpl,
  InMemoryVectorStore,
  HuggingFaceEmbeddingProvider,
  FixedSizeChunker,
  DenseRetriever,
  BGEReranker,
  MarkdownAssembler,
} from '@contextaisdk/rag';

// 1. Set up components
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

const vectorStore = new InMemoryVectorStore({ dimensions: 384 });
const chunker = new FixedSizeChunker({ chunkSize: 512, overlap: 50 });
const retriever = new DenseRetriever({ vectorStore, embeddings, topK: 10 });
const reranker = new BGEReranker({ model: 'BAAI/bge-reranker-base' });
const assembler = new MarkdownAssembler();

// 2. Create RAG engine
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
  { content: 'Your document content...', metadata: { source: 'doc.md' } },
]);

// 4. Search
const results = await rag.search('How does authentication work?');
console.log(results.context); // Formatted context for LLM
console.log(results.sources); // Source attributions
```

## Pipeline Stages

### Stage 1: Document Loading

Load documents from various sources with the `DocumentLoader` interface.

```typescript
import { DocumentLoaderRegistry, defaultRegistry } from '@contextaisdk/rag';

// Use the default registry (supports .txt, .md, .json, code files)
const docs = await defaultRegistry.load('./documents/guide.md');

// Or register custom loaders
const registry = new DocumentLoaderRegistry();
registry.register('.custom', myCustomLoader);
```

**Supported formats:** TXT, Markdown, JSON, JavaScript, TypeScript, Python, and more.

### Stage 2: Text Chunking

Split documents into chunks using different strategies.

```typescript
import { FixedSizeChunker, RecursiveChunker, SentenceChunker } from '@contextaisdk/rag';

// Fixed-size chunks (fastest)
const fixed = new FixedSizeChunker({
  chunkSize: 512,      // tokens
  overlap: 50,         // overlap between chunks
});

// Recursive splitting (respects document structure)
const recursive = new RecursiveChunker({
  chunkSize: 512,
  separators: ['\n\n', '\n', '. ', ' '],
});

// Sentence-based (preserves semantic boundaries)
const sentence = new SentenceChunker({
  maxChunkSize: 512,
  minChunkSize: 100,
});

const chunks = await chunker.chunk(document);
```

**Strategies:**
| Strategy | Best For | Trade-off |
|----------|----------|-----------|
| `FixedSizeChunker` | Speed, consistency | May split mid-sentence |
| `RecursiveChunker` | Structured docs | Slightly slower |
| `SentenceChunker` | Semantic coherence | Variable chunk sizes |

### Stage 3: Embedding Generation

Generate vector embeddings for chunks.

```typescript
import { HuggingFaceEmbeddingProvider, OllamaEmbeddingProvider } from '@contextaisdk/rag';

// HuggingFace (local, via Transformers.js)
const hf = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5', // 384 dimensions
  // model: 'BAAI/bge-large-en-v1.5', // 1024 dimensions (higher quality)
});

// Ollama (local server)
const ollama = new OllamaEmbeddingProvider({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
});

const embedding = await provider.embed('Your text here');
const embeddings = await provider.embedBatch(['Text 1', 'Text 2', 'Text 3']);
```

**Caching for performance:**

```typescript
import { CachedEmbeddingProvider, LRUEmbeddingCache } from '@contextaisdk/rag';

const cache = new LRUEmbeddingCache({ maxSize: 10000 });
const cached = new CachedEmbeddingProvider({ provider: hf, cache });
```

### Stage 4: Vector Storage

Store and search embeddings.

```typescript
import { InMemoryVectorStore } from '@contextaisdk/rag';

// Basic setup (brute-force search, good for <10K vectors)
const store = new InMemoryVectorStore({
  dimensions: 384,
  distanceMetric: 'cosine', // 'cosine' | 'euclidean' | 'dotProduct'
});

// Add chunks
await store.add(chunksWithEmbeddings);

// Search
const results = await store.search(queryEmbedding, {
  topK: 10,
  filter: { source: 'docs.md' }, // Metadata filtering
});
```

**HNSW Index for Large Datasets:**

For datasets with 10K-100K+ vectors, enable HNSW (Hierarchical Navigable Small World) indexing for O(log n) search performance:

```typescript
const store = new InMemoryVectorStore({
  dimensions: 384,
  indexType: 'hnsw',  // Enable HNSW index
  hnswConfig: {
    M: 16,              // Connections per node (default: 16)
    efConstruction: 200, // Build quality (default: 200)
    efSearch: 100       // Search quality/speed tradeoff (default: 100)
  }
});
```

| Mode | Complexity | Best For | Accuracy |
|------|------------|----------|----------|
| `brute-force` (default) | O(n) | <10K vectors, exact results | 100% |
| `hnsw` | O(log n) | 10K-100K+ vectors | ~80-95% recall |

**Performance:** HNSW achieves <10ms search latency on 10K vectors (vs ~20ms brute-force).

**Memory Management:**

The vector store includes memory-efficient storage and budget enforcement:

```typescript
import { InMemoryVectorStore, formatBytes } from '@contextaisdk/rag';

// Float32 storage (50% memory savings, enabled by default)
const store = new InMemoryVectorStore({
  dimensions: 384,
  useFloat32: true,  // Default: uses 4 bytes/float instead of 8
});

// With memory budget and eviction callback
const store = new InMemoryVectorStore({
  dimensions: 384,
  maxMemoryBytes: 100 * 1024 * 1024,  // 100MB limit
  onEviction: (ids, freedBytes) => {
    console.log(`Evicted ${ids.length} chunks, freed ${formatBytes(freedBytes)}`);
  },
});

// Check memory usage
const stats = store.getMemoryStats();
console.log(`${formatBytes(stats.usedBytes)} / ${formatBytes(stats.maxBytes)}`);
```

See the [Memory Management Guide](../../docs/how-to/rag/memory-management.md) for detailed documentation on Float32 storage, memory budgets, LRU eviction, and monitoring utilities.

**Available stores:**
- `InMemoryVectorStore` - Development, testing, and medium-scale production (with HNSW)
- pgvector (PostgreSQL) - Production (via adapter)
- ChromaDB - Self-hosted vector DB (via adapter)

### Stage 5: Query Enhancement

Improve retrieval quality by enhancing queries.

```typescript
import { QueryRewriter, HyDEEnhancer, MultiQueryExpander } from '@contextaisdk/rag';

// Query rewriting (fix typos, expand abbreviations)
const rewriter = new QueryRewriter({ llm: yourLLM });
const rewritten = await rewriter.enhance('how does auth wrk?');
// → "How does authentication work?"

// HyDE (Hypothetical Document Embeddings)
const hyde = new HyDEEnhancer({ llm: yourLLM, embeddings });
const enhanced = await hyde.enhance('authentication flow');
// Generates hypothetical answer, embeds that instead

// Multi-query expansion
const expander = new MultiQueryExpander({ llm: yourLLM, numQueries: 3 });
const queries = await expander.enhance('user login');
// → ["user login process", "authentication workflow", "sign in mechanism"]
```

### Stage 6: Retrieval

Retrieve relevant chunks using dense, sparse, or hybrid search.

```typescript
import { DenseRetriever, BM25Retriever, HybridRetriever } from '@contextaisdk/rag';

// Dense retrieval (semantic similarity)
const dense = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 10,
});

// Sparse retrieval (keyword matching)
const sparse = new BM25Retriever({
  documents: chunks,
  k1: 1.2,
  b: 0.75,
});

// Hybrid (best of both worlds)
const hybrid = new HybridRetriever({
  denseRetriever: dense,
  sparseRetriever: sparse,
  denseWeight: 0.7,
  sparseWeight: 0.3,
  fusionMethod: 'rrf', // Reciprocal Rank Fusion
});

const results = await retriever.retrieve('authentication flow');
```

**RRF (Reciprocal Rank Fusion):**

```typescript
import { reciprocalRankFusion, DEFAULT_RRF_K } from '@contextaisdk/rag';

const fused = reciprocalRankFusion([denseResults, sparseResults], {
  k: DEFAULT_RRF_K, // 60
});
```

### Stage 7: Reranking

Re-score and re-order results for higher relevance.

```typescript
import { BGEReranker, MMRReranker, LLMReranker } from '@contextaisdk/rag';

// Cross-encoder reranking (most accurate)
const bge = new BGEReranker({
  model: 'BAAI/bge-reranker-base',
});

// MMR for diversity (reduces redundancy)
const mmr = new MMRReranker({
  lambda: 0.5, // Balance relevance vs diversity
  embeddings,
});

// LLM-based reranking (uses your LLM as judge)
const llm = new LLMReranker({
  llm: yourLLM,
  batchSize: 5,
});

const reranked = await reranker.rerank(query, results);
```

**Position bias mitigation:**

```typescript
import { applySandwichOrdering, applyInterleaveOrdering } from '@contextaisdk/rag';

// Sandwich ordering (most relevant at start AND end)
const sandwiched = applySandwichOrdering(results);

// Interleave ordering (alternates high/low relevance)
const interleaved = applyInterleaveOrdering(results);
```

### Stage 8: Context Assembly

Format chunks for LLM consumption.

```typescript
import { XMLAssembler, MarkdownAssembler } from '@contextaisdk/rag';

// XML format (Claude-preferred)
const xml = new XMLAssembler({
  rootTag: 'context',
  chunkTag: 'document',
  includeMetadata: true,
});

// Markdown format (GPT-friendly)
const md = new MarkdownAssembler({
  headerLevel: 2,
  includeCitations: true,
});

const assembled = await assembler.assemble(results, {
  maxTokens: 4000,
  deduplication: true,
});

console.log(assembled.text);    // Formatted context
console.log(assembled.sources); // Source attributions
console.log(assembled.tokens);  // Token count
```

**Token budget management:**

```typescript
import { calculateTokenBudget, applyTokenBudget } from '@contextaisdk/rag';

const budget = calculateTokenBudget({
  maxTokens: 4000,
  reservedForPrompt: 500,
  reservedForResponse: 1000,
});

const fitted = applyTokenBudget(results, budget);
```

### Stage 9: Agentic RAG

Let the agent decide when and how to retrieve.

```typescript
import { Agent, defineTool } from '@contextaisdk/core';

// Create a retrieve_knowledge tool
const retrieveTool = defineTool({
  name: 'retrieve_knowledge',
  description: 'Search the knowledge base for relevant information',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    const results = await rag.search(query);
    return { context: results.context, sources: results.sources };
  },
});

// Agent decides when to use RAG
const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'Use retrieve_knowledge for factual questions.',
  llm: yourLLM,
  tools: [retrieveTool],
});
```

## API Reference

### RAGEngineImpl

The main orchestrator for the RAG pipeline.

```typescript
const rag = new RAGEngineImpl({
  embeddingProvider: EmbeddingProvider;
  vectorStore: VectorStore;
  chunker?: Chunker;
  retriever?: Retriever;
  reranker?: Reranker;
  assembler?: ContextAssembler;
  queryEnhancer?: QueryEnhancer;
});

// Ingest documents
await rag.ingest(documents: Document[], options?: IngestOptions);

// Search
const results = await rag.search(query: string, options?: RAGSearchOptions);
```

### Key Interfaces

```typescript
// Document to ingest
interface Document {
  content: string;
  metadata?: Record<string, unknown>;
}

// Search results
interface RAGResult {
  context: string;           // Formatted text for LLM
  sources: SourceAttribution[];
  chunks: SearchResult[];
  metadata: RAGSearchMetadata;
  timings: RAGTimings;
}

// Embedding provider
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  readonly dimensions: number;
}

// Vector store
interface VectorStore {
  add(chunks: ChunkWithEmbedding[]): Promise<void>;
  search(embedding: number[], options: SearchOptions): Promise<SearchResult[]>;
  delete(filter: MetadataFilter): Promise<number>;
}
```

## Performance Tips

1. **Use embedding caching** - Avoid re-embedding the same text
2. **Batch operations** - Use `embedBatch()` instead of individual calls
3. **Choose appropriate chunk sizes** - 256-512 tokens is often optimal
4. **Hybrid retrieval** - Combines semantic and keyword search strengths
5. **Rerank sparingly** - Cross-encoders are slow; rerank top-N only
6. **Use sub-entry points** - Import only what you need for faster startup
7. **Call warmUp()** - Pre-load ML models during app initialization

## Sub-Entry Points

For faster startup times and smaller bundles, import only the modules you need:

```typescript
// Instead of importing everything:
import { RAGEngineImpl, DenseRetriever } from '@contextaisdk/rag';

// Import specific modules:
import { RAGEngineImpl } from '@contextaisdk/rag/engine';
import { DenseRetriever, HybridRetriever } from '@contextaisdk/rag/retrieval';
import { HuggingFaceEmbeddingProvider } from '@contextaisdk/rag/embeddings';
import { InMemoryVectorStore } from '@contextaisdk/rag/vector-store';
import { BGEReranker } from '@contextaisdk/rag/reranker';
import { MarkdownAssembler } from '@contextaisdk/rag/assembly';
```

**Available sub-entry points:**

| Path | Contents |
|------|----------|
| `@contextaisdk/rag/engine` | RAGEngineImpl, RAGEngineError, types |
| `@contextaisdk/rag/retrieval` | DenseRetriever, BM25Retriever, HybridRetriever, RRF utilities |
| `@contextaisdk/rag/embeddings` | HuggingFaceEmbeddingProvider, OllamaEmbeddingProvider, cache utilities |
| `@contextaisdk/rag/vector-store` | InMemoryVectorStore, BaseVectorStore, types |
| `@contextaisdk/rag/reranker` | BGEReranker, MMRReranker, LLMReranker, position bias utilities |
| `@contextaisdk/rag/chunking` | FixedSizeChunker, RecursiveChunker, SentenceChunker |
| `@contextaisdk/rag/assembly` | XMLAssembler, MarkdownAssembler, token budget utilities |
| `@contextaisdk/rag/query-enhancement` | QueryRewriter, HyDEEnhancer, MultiQueryExpander |
| `@contextaisdk/rag/loaders` | DocumentLoaderRegistry, BaseDocumentLoader |
| `@contextaisdk/rag/adaptive` | AdaptiveRAG, QueryClassifier |
| `@contextaisdk/rag/memory` | MemoryBudget, memory utilities |
| `@contextaisdk/rag/cache` | LRUCacheProvider, NoCacheProvider |

**Performance impact:** Using `@contextaisdk/rag/engine` is ~68% faster than importing the full package.

## Startup Optimization

### warmUp() Method

ML models (BGE reranker, HuggingFace embeddings) are loaded lazily on first use. To avoid first-request latency, call `warmUp()` during application startup:

```typescript
import { RAGEngineImpl } from '@contextaisdk/rag/engine';
import { BGEReranker } from '@contextaisdk/rag/reranker';

// Create engine with reranker
const reranker = new BGEReranker({ model: 'BAAI/bge-reranker-base' });
const rag = new RAGEngineImpl({
  retriever,
  assembler,
  reranker,
});

// Pre-load ML models during startup
await rag.warmUp();

// Now search() will be fast (models already loaded)
const results = await rag.search('authentication flow');
```

### HuggingFace Embedding warmup

You can also warm up the embedding provider directly:

```typescript
import { HuggingFaceEmbeddingProvider } from '@contextaisdk/rag/embeddings';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

// Check if model is loaded
console.log(embeddings.isLoaded()); // false

// Pre-load during startup
await embeddings.warmup();

console.log(embeddings.isLoaded()); // true
```

**Cold start targets (NFR-104):**
- Agent initialization: <500ms (actual: ~0.67ms)
- RAG engine initialization: <200ms (actual: ~0.065ms)

## Error Handling

All components throw typed errors:

```typescript
import { VectorStoreError, EmbeddingError, RetrieverError } from '@contextaisdk/rag';

try {
  await vectorStore.search(embedding, { topK: 10 });
} catch (error) {
  if (error instanceof VectorStoreError) {
    console.error('Vector store error:', error.code, error.details);
  }
}
```

## License

MIT
