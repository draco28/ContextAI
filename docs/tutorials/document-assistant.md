# Tutorial: Build a Document Assistant

Build a RAG-powered assistant that answers questions about your documents.

**Time**: 45 minutes
**Difficulty**: Intermediate
**You'll learn**: RAG pipeline, embeddings, vector search, agent integration

## What We're Building

A document assistant that:
- Ingests markdown/text documents
- Creates embeddings and stores in a vector database
- Retrieves relevant context for questions
- Generates accurate answers with citations

## Prerequisites

```bash
# Create project
mkdir doc-assistant && cd doc-assistant
pnpm init -y

# Install dependencies
pnpm add @contextaisdk/core @contextaisdk/rag @contextaisdk/provider-openai zod
pnpm add -D typescript tsx @types/node
```

## Step 1: Set Up the RAG Engine

Create `src/rag.ts`:

```typescript
import {
  RAGEngineImpl,
  InMemoryVectorStore,
  HuggingFaceEmbeddingProvider,
  RecursiveChunker,
  DenseRetriever,
  BGEReranker,
  MarkdownAssembler,
} from '@contextaisdk/rag';

// 1. Embeddings - converts text to vectors
const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5', // 384 dimensions
});

// 2. Vector store - stores and searches vectors
const vectorStore = new InMemoryVectorStore({
  dimensions: 384,
  distanceMetric: 'cosine',
});

// 3. Chunker - splits documents into smaller pieces
const chunker = new RecursiveChunker({
  chunkSize: 512,
  separators: ['\n\n', '\n', '. ', ' '],
});

// 4. Retriever - finds relevant chunks
const retriever = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 10,
});

// 5. Reranker - improves relevance ordering
const reranker = new BGEReranker({
  model: 'BAAI/bge-reranker-base',
});

// 6. Assembler - formats context for the LLM
const assembler = new MarkdownAssembler({
  includeCitations: true,
});

// 7. Create the RAG engine
export const rag = new RAGEngineImpl({
  embeddingProvider: embeddings,
  vectorStore,
  chunker,
  retriever,
  reranker,
  assembler,
});
```

## Step 2: Create Sample Documents

Create `docs/getting-started.md`:

```markdown
# Getting Started with ContextAI

## Installation

Install the core package:

\`\`\`bash
pnpm add @contextaisdk/core
\`\`\`

## Your First Agent

Create a simple agent:

\`\`\`typescript
import { Agent } from '@contextaisdk/core';

const agent = new Agent({
  name: 'Assistant',
  systemPrompt: 'You are helpful.',
  llm: provider,
});

const response = await agent.run('Hello!');
\`\`\`

## Adding Tools

Agents can use tools to perform actions:

\`\`\`typescript
import { defineTool } from '@contextaisdk/core';

const myTool = defineTool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }, context) => {
    return { success: true, data: { result: input.toUpperCase() } };
  },
});
\`\`\`
```

Create `docs/rag-guide.md`:

```markdown
# RAG Pipeline Guide

## What is RAG?

RAG (Retrieval-Augmented Generation) enhances LLM responses by:

1. Retrieving relevant documents
2. Using them as context for generation
3. Producing more accurate, grounded answers

## Pipeline Stages

### 1. Document Loading

Load documents from various sources:
- Markdown files
- PDFs
- Web pages

### 2. Chunking

Split documents into smaller pieces for better retrieval.
Recommended chunk size: 256-512 tokens.

### 3. Embedding

Convert chunks to vectors using embedding models.
Recommended: BGE-small-en-v1.5 for English content.

### 4. Storage

Store vectors in a database for efficient similarity search.
Options: InMemory (dev), pgvector (production).

### 5. Retrieval

Find relevant chunks using similarity search.
Use hybrid search (dense + sparse) for best results.

### 6. Reranking

Re-order results using a cross-encoder for better relevance.
Recommended: BGE-reranker-base.
```

## Step 3: Ingest Documents

Create `src/ingest.ts`:

```typescript
import { rag } from './rag';
import * as fs from 'fs/promises';
import * as path from 'path';

async function ingestDocuments() {
  const docsDir = path.join(__dirname, '../docs');
  const files = await fs.readdir(docsDir);

  const documents = await Promise.all(
    files
      .filter((f) => f.endsWith('.md'))
      .map(async (file) => {
        const content = await fs.readFile(
          path.join(docsDir, file),
          'utf-8'
        );
        return {
          content,
          metadata: {
            source: file,
            type: 'documentation',
          },
        };
      })
  );

  console.log(`Ingesting ${documents.length} documents...`);

  await rag.ingest(documents);

  console.log('Ingestion complete!');
}

ingestDocuments().catch(console.error);
```

Run ingestion:

```bash
npx tsx src/ingest.ts
```

## Step 4: Create the RAG Tool

Create `src/tools.ts`:

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';
import { rag } from './rag';

export const searchDocsTool = defineTool({
  name: 'search_docs',
  description: `Search the documentation for relevant information.
    Use this to find accurate answers to user questions.
    Always cite the source documents in your response.`,
  parameters: z.object({
    query: z.string().describe('Search query - be specific'),
  }),
  execute: async ({ query }, context) => {
    const results = await rag.search(query, {
      topK: 5,
      rerank: true,
      maxTokens: 2000,
    });

    return {
      success: true,
      data: {
        context: results.context,
        sources: results.sources.map((s) => ({
          file: s.source,
          score: s.relevanceScore.toFixed(2),
        })),
      },
    };
  },
});
```

## Step 5: Create the Agent

Create `src/agent.ts`:

```typescript
import { Agent } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { searchDocsTool } from './tools';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});

export const docAgent = new Agent({
  name: 'Document Assistant',
  systemPrompt: `You are a helpful documentation assistant.

Your job is to answer questions about the documentation accurately.

Guidelines:
1. ALWAYS use search_docs to find information before answering
2. Base your answers ONLY on the retrieved documents
3. If information isn't found, say "I couldn't find information about that"
4. Always cite sources: "According to [filename]..."
5. Be concise but thorough

Never make up information. Only use what's in the documents.`,
  llm: provider,
  tools: [searchDocsTool],
});
```

## Step 6: Build the CLI Interface

Create `src/cli.ts`:

```typescript
import * as readline from 'readline';
import { docAgent } from './agent';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat() {
  console.log('\n📚 Document Assistant');
  console.log('Ask questions about the documentation.');
  console.log('Type "exit" to quit.\n');

  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      console.log('\nAssistant: ');

      try {
        // Stream the response
        for await (const event of docAgent.stream(input)) {
          if (event.type === 'text') {
            process.stdout.write(event.text);
          } else if (event.type === 'thought') {
            console.log(`\n[Thinking: ${event.content}]`);
          } else if (event.type === 'action') {
            console.log(`\n[Searching: ${event.input.query}]`);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }

      console.log('\n');
      ask();
    });
  };

  ask();
}

chat();
```

## Step 7: Run It!

```bash
# First, ingest documents
npx tsx src/ingest.ts

# Then run the CLI
npx tsx src/cli.ts
```

Try asking:
- "How do I install ContextAI?"
- "What is RAG?"
- "How do I create a tool?"

## Adding More Features

### Hybrid Search

Better retrieval with keyword + semantic:

```typescript
import { BM25Retriever, HybridRetriever } from '@contextaisdk/rag';

const sparseRetriever = new BM25Retriever({
  documents: chunks,
});

const hybridRetriever = new HybridRetriever({
  denseRetriever: retriever,
  sparseRetriever,
  denseWeight: 0.7,
  sparseWeight: 0.3,
  fusionMethod: 'rrf',
});
```

### Conversation Memory

Remember previous questions:

```typescript
import { InMemoryProvider } from '@contextaisdk/core';

const memory = new InMemoryProvider();

const docAgent = new Agent({
  // ... other config
  memory,
  sessionId: 'doc-session',
});
```

### Metadata Filtering

Search specific document types:

```typescript
const results = await rag.search(query, {
  filter: {
    type: 'documentation',
  },
});
```

### Citation Links

Include clickable references:

```typescript
execute: async ({ query }, context) => {
  const results = await rag.search(query);

  return {
    success: true,
    data: {
      context: results.context,
      sources: results.sources.map((s) => ({
        file: s.source,
        url: `/docs/${s.source}`, // Link to doc
      })),
    },
  };
},
```

## Production Considerations

### 1. Use pgvector

Replace InMemory with pgvector for persistence:

```typescript
import { PgVectorStore } from '@contextaisdk/rag';

const vectorStore = new PgVectorStore({
  connectionString: process.env.DATABASE_URL,
  dimensions: 384,
});
```

### 2. Cache Embeddings

Avoid re-computing embeddings:

```typescript
import { CachedEmbeddingProvider, LRUEmbeddingCache } from '@contextaisdk/rag';

const cache = new LRUEmbeddingCache({ maxSize: 10000 });
const cachedEmbeddings = new CachedEmbeddingProvider({
  provider: embeddings,
  cache,
});
```

### 3. Incremental Updates

Update only changed documents:

```typescript
// Check if document changed
const hash = computeHash(content);
if (hash !== previousHash) {
  await vectorStore.delete({ source: filename });
  await rag.ingest([document]);
}
```

## Complete Project Structure

```
doc-assistant/
├── src/
│   ├── rag.ts        # RAG engine setup
│   ├── tools.ts      # Search tool
│   ├── agent.ts      # Document agent
│   ├── ingest.ts     # Document ingestion
│   └── cli.ts        # CLI interface
├── docs/
│   ├── getting-started.md
│   └── rag-guide.md
├── package.json
└── tsconfig.json
```

## Next Steps

- [Build Q&A Chatbot](./build-qa-chatbot.md) - Add React UI
- [Code Assistant](./code-assistant.md) - Code-specific RAG
- [Hybrid Search](../how-to/rag/hybrid-search.md) - Better retrieval
