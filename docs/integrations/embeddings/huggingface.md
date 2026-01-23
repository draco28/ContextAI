# HuggingFace Embeddings Integration

Run embedding models locally with HuggingFace Transformers.js.

## Why Local Embeddings?

- **Free** - No API costs
- **Private** - Data never leaves your machine
- **Fast** - No network latency
- **Offline** - Works without internet

## Installation

```bash
pnpm add @contextaisdk/rag
# Transformers.js is included
```

## Quick Start

```typescript
import { HuggingFaceEmbeddingProvider } from '@contextaisdk/rag';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

// Single embedding
const vector = await embeddings.embed('Hello world');
console.log('Dimensions:', vector.length); // 384

// Batch embeddings
const vectors = await embeddings.embedBatch([
  'First document',
  'Second document',
]);
```

## Configuration

### Basic Options

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  // Model to use
  model: 'BAAI/bge-small-en-v1.5',

  // Quantization for smaller models
  quantized: true, // Default: true

  // Progress callback during download
  onProgress: (progress) => {
    console.log(`Loading: ${progress.percent}%`);
  },
});
```

### Recommended Models

| Model | Dimensions | Size | Quality |
|-------|------------|------|---------|
| `BAAI/bge-small-en-v1.5` | 384 | 33MB | Good |
| `BAAI/bge-base-en-v1.5` | 768 | 110MB | Better |
| `BAAI/bge-large-en-v1.5` | 1024 | 335MB | Best |
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | 22MB | Fast |

### Model Selection

```typescript
// For most use cases (recommended)
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

// For higher quality
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-large-en-v1.5',
});

// For fastest speed
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
});
```

## Usage

### Single Text

```typescript
const vector = await embeddings.embed('Your text here');
// Returns: number[] (e.g., 384 floats for bge-small)
```

### Batch Processing

```typescript
const texts = [
  'First document content',
  'Second document content',
  'Third document content',
];

const vectors = await embeddings.embedBatch(texts);
// Returns: number[][] (array of vectors)
```

### With RAG Engine

```typescript
import {
  RAGEngineImpl,
  HuggingFaceEmbeddingProvider,
  InMemoryVectorStore,
  RecursiveChunker,
  DenseRetriever,
} from '@contextaisdk/rag';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

const vectorStore = new InMemoryVectorStore({
  dimensions: 384, // Match model dimensions
});

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

// Ingest and search
await rag.ingest(documents);
const results = await rag.search('query');
```

## Performance

### First Load

Models are downloaded on first use:

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
  onProgress: ({ percent, loaded, total }) => {
    console.log(`Downloading: ${percent.toFixed(1)}%`);
  },
});

// First call downloads the model
const vector = await embeddings.embed('Test');
```

Models are cached in `~/.cache/transformers/` after download.

### Warm Up

Pre-load the model on app start:

```typescript
// In app initialization
await embeddings.embed('warmup');

// Now subsequent calls are fast
```

### Batch for Speed

```typescript
// Slower: Individual calls
for (const text of texts) {
  const v = await embeddings.embed(text);
}

// Faster: Batch call
const vectors = await embeddings.embedBatch(texts);
```

### Memory Usage

| Model | Memory |
|-------|--------|
| bge-small | ~150MB |
| bge-base | ~450MB |
| bge-large | ~1.3GB |

## Caching

### LRU Cache

Avoid re-computing embeddings:

```typescript
import {
  CachedEmbeddingProvider,
  LRUEmbeddingCache,
  HuggingFaceEmbeddingProvider,
} from '@contextaisdk/rag';

const baseEmbeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

const cache = new LRUEmbeddingCache({
  maxSize: 10000, // Cache up to 10K embeddings
});

const embeddings = new CachedEmbeddingProvider({
  provider: baseEmbeddings,
  cache,
});

// First call computes
const v1 = await embeddings.embed('Hello');

// Second call returns cached
const v2 = await embeddings.embed('Hello'); // Instant!
```

### Persistent Cache

For cross-session caching:

```typescript
import { FileEmbeddingCache } from '@contextaisdk/rag';

const cache = new FileEmbeddingCache({
  path: './embedding-cache.json',
});

const embeddings = new CachedEmbeddingProvider({
  provider: baseEmbeddings,
  cache,
});
```

## Multilingual

For non-English text:

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-m3', // Multilingual
});
```

## Best Practices

### 1. Match Dimensions

Ensure vector store dimensions match:

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5', // 384 dimensions
});

const vectorStore = new InMemoryVectorStore({
  dimensions: 384, // Must match!
});
```

### 2. Use Quantized Models

Smaller and faster with minimal quality loss:

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
  quantized: true, // Default
});
```

### 3. Pre-load in Production

```typescript
// On server start
await embeddings.embed('warmup');
console.log('Embeddings ready');
```

## Troubleshooting

### Model Download Fails

```bash
# Clear cache and retry
rm -rf ~/.cache/transformers/
```

### Out of Memory

Use a smaller model:

```typescript
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'sentence-transformers/all-MiniLM-L6-v2', // 22MB
});
```

### Slow Performance

1. Use batch embedding for multiple texts
2. Enable quantization (default)
3. Use smaller model

## Comparison: Local vs API

| Aspect | HuggingFace (Local) | OpenAI API |
|--------|---------------------|------------|
| Cost | Free | $0.0001/1K tokens |
| Privacy | 100% local | Data sent to API |
| Latency | ~10ms | ~200ms |
| Quality | Very good | Excellent |
| Setup | Download models | Just API key |

## Next Steps

- [pgvector Store](../vector-stores/pgvector.md) - Production storage
- [Build RAG Pipeline](../../how-to/rag/build-rag-pipeline.md) - Complete setup
- [Chunking Strategies](../../concepts/rag/chunking.md) - Document chunking
