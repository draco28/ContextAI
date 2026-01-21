# How to Use Hybrid Search

Combine dense (semantic) and sparse (keyword) retrieval for better results.

## Why Hybrid?

| Query Type | Dense (Semantic) | Sparse (Keyword) |
|------------|------------------|------------------|
| "password reset" | Finds "account recovery" | Finds exact "password reset" |
| "ERROR_404" | Finds similar errors | Finds exact "ERROR_404" |
| "authentication flow" | Understands concept | Finds exact terms |

Hybrid gives you both.

## Quick Start

```typescript
import {
  DenseRetriever,
  BM25Retriever,
  HybridRetriever,
} from '@contextai/rag';

// Dense (semantic similarity)
const denseRetriever = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 20,
});

// Sparse (keyword matching)
const sparseRetriever = new BM25Retriever({
  documents: chunks, // Your chunked documents
});

// Hybrid (best of both)
const hybridRetriever = new HybridRetriever({
  denseRetriever,
  sparseRetriever,
  denseWeight: 0.7,
  sparseWeight: 0.3,
  fusionMethod: 'rrf',
});

const results = await hybridRetriever.retrieve('How to reset password?');
```

## Complete Example

```typescript
import {
  RAGEngineImpl,
  InMemoryVectorStore,
  HuggingFaceEmbeddingProvider,
  RecursiveChunker,
  DenseRetriever,
  BM25Retriever,
  HybridRetriever,
  BGEReranker,
  MarkdownAssembler,
} from '@contextai/rag';

async function createHybridRAG() {
  // Setup components
  const embeddings = new HuggingFaceEmbeddingProvider({
    model: 'BAAI/bge-small-en-v1.5',
  });

  const vectorStore = new InMemoryVectorStore({ dimensions: 384 });
  const chunker = new RecursiveChunker({ chunkSize: 512 });

  // We need chunks for BM25
  const documents = [
    { content: 'Your documents...', metadata: { source: 'doc1.md' } },
    // ...
  ];

  // Chunk documents
  const allChunks = [];
  for (const doc of documents) {
    const chunks = await chunker.chunk(doc);
    allChunks.push(...chunks);
  }

  // Create retrievers
  const denseRetriever = new DenseRetriever({
    vectorStore,
    embeddings,
    topK: 20,
  });

  const sparseRetriever = new BM25Retriever({
    documents: allChunks,
    k1: 1.2,
    b: 0.75,
  });

  const hybridRetriever = new HybridRetriever({
    denseRetriever,
    sparseRetriever,
    denseWeight: 0.7,
    sparseWeight: 0.3,
    fusionMethod: 'rrf',
  });

  // Create RAG engine
  const rag = new RAGEngineImpl({
    embeddingProvider: embeddings,
    vectorStore,
    chunker,
    retriever: hybridRetriever,
    reranker: new BGEReranker({ model: 'bge-reranker-base' }),
    assembler: new MarkdownAssembler(),
  });

  // Ingest (dense retriever uses vectorStore)
  await rag.ingest(documents);

  return rag;
}

// Usage
const rag = await createHybridRAG();
const results = await rag.search('ERROR_CODE_404 authentication');
```

## Fusion Methods

### Reciprocal Rank Fusion (RRF)

Combines rankings, ignoring score magnitudes:

```typescript
import { reciprocalRankFusion, DEFAULT_RRF_K } from '@contextai/rag';

const hybridRetriever = new HybridRetriever({
  denseRetriever,
  sparseRetriever,
  fusionMethod: 'rrf',
  rrfK: 60, // Default, usually good
});
```

**How RRF works:**
```
Score = sum(1 / (k + rank)) for each result list

Example:
- Doc A: Rank 1 in dense, Rank 3 in sparse
- RRF score = 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
```

### Weighted Sum

Combines normalized scores:

```typescript
const hybridRetriever = new HybridRetriever({
  denseRetriever,
  sparseRetriever,
  denseWeight: 0.7,
  sparseWeight: 0.3,
  fusionMethod: 'weighted_sum',
});
```

**How weighted sum works:**
```
Score = (denseWeight × normalizedDenseScore) + (sparseWeight × normalizedSparseScore)
```

## Tuning Weights

### By Use Case

```typescript
// General Q&A: Balanced semantic understanding
{ denseWeight: 0.7, sparseWeight: 0.3 }

// Technical docs: Need exact terms
{ denseWeight: 0.5, sparseWeight: 0.5 }

// Code search: Exact identifiers matter
{ denseWeight: 0.3, sparseWeight: 0.7 }

// Conversational: Semantic is key
{ denseWeight: 0.9, sparseWeight: 0.1 }
```

### By Experiment

```typescript
async function findBestWeights(
  testQueries: { query: string; expectedDoc: string }[],
  weights: Array<{ dense: number; sparse: number }>
) {
  const results = [];

  for (const { dense, sparse } of weights) {
    const retriever = new HybridRetriever({
      denseRetriever,
      sparseRetriever,
      denseWeight: dense,
      sparseWeight: sparse,
    });

    let hits = 0;
    for (const { query, expectedDoc } of testQueries) {
      const retrieved = await retriever.retrieve(query);
      if (retrieved.some((r) => r.metadata.source === expectedDoc)) {
        hits++;
      }
    }

    results.push({
      dense,
      sparse,
      recall: hits / testQueries.length,
    });
  }

  return results.sort((a, b) => b.recall - a.recall);
}

// Test different weights
const testWeights = [
  { dense: 0.9, sparse: 0.1 },
  { dense: 0.7, sparse: 0.3 },
  { dense: 0.5, sparse: 0.5 },
  { dense: 0.3, sparse: 0.7 },
];

const best = await findBestWeights(testQueries, testWeights);
console.log('Best weights:', best[0]);
```

## BM25 Configuration

### Parameters

```typescript
const bm25 = new BM25Retriever({
  documents: chunks,
  k1: 1.2,  // Term frequency saturation (0.5-2.0)
  b: 0.75, // Length normalization (0-1)
  topK: 20,
});
```

**k1**: Higher = more weight to term frequency
**b**: Higher = more penalty for long documents

### Preprocessing

```typescript
// BM25 tokenizes internally, but you can preprocess
const preprocessedChunks = chunks.map((chunk) => ({
  ...chunk,
  content: chunk.content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' '),    // Normalize whitespace
}));

const bm25 = new BM25Retriever({
  documents: preprocessedChunks,
});
```

## Combining with Reranking

```typescript
const rag = new RAGEngineImpl({
  embeddingProvider: embeddings,
  vectorStore,
  retriever: hybridRetriever, // Hybrid for recall
  reranker: new BGEReranker({ model: 'bge-reranker-base' }), // Cross-encoder for precision
  assembler: new MarkdownAssembler(),
});

const results = await rag.search(query, {
  topK: 30,      // Get 30 from hybrid
  rerank: true,  // Rerank all 30
  finalK: 5,     // Keep top 5
});
```

## Metadata Filtering

Filter before fusion:

```typescript
const results = await hybridRetriever.retrieve(query, {
  filter: {
    category: 'documentation',
    version: '2.0',
  },
});
```

## Debugging Hybrid Search

```typescript
// Get results from each retriever
const denseResults = await denseRetriever.retrieve(query);
const sparseResults = await sparseRetriever.retrieve(query);
const hybridResults = await hybridRetriever.retrieve(query);

console.log('=== Dense Results ===');
denseResults.slice(0, 5).forEach((r, i) => {
  console.log(`${i + 1}. ${r.content.slice(0, 50)}... (${r.score.toFixed(3)})`);
});

console.log('\n=== Sparse Results ===');
sparseResults.slice(0, 5).forEach((r, i) => {
  console.log(`${i + 1}. ${r.content.slice(0, 50)}... (${r.score.toFixed(3)})`);
});

console.log('\n=== Hybrid Results ===');
hybridResults.slice(0, 5).forEach((r, i) => {
  console.log(`${i + 1}. ${r.content.slice(0, 50)}... (${r.score.toFixed(3)})`);
});
```

## Common Issues

### Sparse Dominates

**Problem**: Keyword matches outweigh semantic matches

**Solution**: Adjust weights
```typescript
{ denseWeight: 0.8, sparseWeight: 0.2 }
```

### Missing Exact Terms

**Problem**: Specific codes/names not found

**Solution**: Increase sparse weight or use RRF
```typescript
{ denseWeight: 0.5, sparseWeight: 0.5, fusionMethod: 'rrf' }
```

### Too Many Duplicates

**Problem**: Same content from both retrievers

**Solution**: Deduplication in assembly
```typescript
const results = await rag.search(query, {
  deduplication: true,
});
```

## Best Practices

### 1. Start with RRF

```typescript
// RRF is robust to different score scales
{ fusionMethod: 'rrf', rrfK: 60 }
```

### 2. Tune by Evaluation

```typescript
// Test on representative queries
const testSet = [
  { query: 'password reset', expected: ['auth-guide.md'] },
  { query: 'ERROR_404', expected: ['error-codes.md'] },
];
```

### 3. Consider Query Type

```typescript
// Route queries to appropriate retriever
const retriever = query.match(/[A-Z_]{3,}/)
  ? sparseRetriever  // Looks like a code
  : hybridRetriever; // General query
```

## Next Steps

- [Agentic RAG](./agentic-rag.md) - Agent-driven retrieval
- [Retrieval Concepts](../../concepts/rag/retrieval.md) - Deep dive
- [Reranking](../../concepts/rag/reranking.md) - Optimize results
