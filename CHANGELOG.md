# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Agent Runtime (@contextai/core)
- ReAct reasoning loop with Thought → Action → Observation tracing
- Tool framework with Zod validation
- Streaming responses via async generators
- Conversation context management
- Error recovery with retry and circuit breaker patterns
- Input validation for Agent APIs

#### LLM Providers
- **OpenAI Provider** (@contextai/provider-openai)
  - GPT-4o, GPT-4, GPT-3.5 support
  - Streaming and non-streaming modes
  - Tool calling support
  - Integration tests with GLM reasoning model
- **Provider Interface Enhancements**
  - Extended thinking support (Claude, o1)
  - Structured output options
  - Response metadata for debugging
  - Rate limiting configuration
  - Multimodal content types (images, audio)

#### RAG Pipeline (@contextai/rag)
- **Document Loading**
  - TXT, Markdown, JSON loaders
  - Code file loaders (JS, TS, Python)
  - PDF and DOCX support via adapters
  - Extensible DocumentLoaderRegistry

- **Text Chunking**
  - FixedSizeChunker for consistent chunk sizes
  - RecursiveChunker for structured documents
  - SentenceChunker for semantic boundaries
  - Token estimation utilities

- **Embedding Providers**
  - HuggingFace BGE embeddings (local via Transformers.js)
  - Ollama embedding support
  - LRU embedding cache for performance
  - Batch embedding operations

- **Vector Storage**
  - InMemoryVectorStore with dual modes:
    - Brute-force (default): Exact results, O(n), suitable for <10K vectors
    - **HNSW indexing**: O(log n) approximate search for 10K-100K+ vectors
      - Achieves <10ms latency on 10K vectors (NFR-102: <100ms target)
      - Configurable M, efConstruction, efSearch parameters
      - 80-90%+ recall with tunable accuracy/speed tradeoff
  - pgvector adapter for PostgreSQL
  - ChromaDB adapter
  - Metadata filtering support

- **Retrieval**
  - DenseRetriever (semantic similarity)
  - BM25Retriever (keyword matching)
  - HybridRetriever with RRF fusion
  - Configurable top-K retrieval

- **Reranking**
  - BGEReranker (cross-encoder)
  - MMRReranker (diversity optimization)
  - LLMReranker (LLM-as-judge)
  - Position bias mitigation strategies

- **Context Assembly**
  - XMLAssembler (Claude-optimized)
  - MarkdownAssembler (GPT-friendly)
  - Token budget management
  - Deduplication utilities
  - Source attribution

- **Query Enhancement**
  - QueryRewriter for query optimization
  - HyDEEnhancer (hypothetical document embeddings)
  - MultiQueryExpander for query expansion

- **Agentic RAG**
  - retrieve_knowledge tool for agent integration
  - Adaptive retrieval (agent decides when to search)

- **Memory Management** (NFR-103)
  - Float32 storage format (50% memory savings vs Float64)
  - MemoryBudget class for budget enforcement with LRU eviction
  - Memory monitoring utilities (getMemoryStats, formatMemoryStats)
  - Embedding size estimation helpers

#### Startup Optimization (NFR-104)
- **Sub-entry points** for selective imports:
  - `@contextai/core/agent`, `/security`, `/tool`, `/errors`, `/provider`, `/tools`
  - `@contextai/rag/engine`, `/retrieval`, `/embeddings`, `/vector-store`, `/reranker`, `/chunking`, `/assembly`, `/query-enhancement`, `/adaptive`, `/memory`, `/cache`, `/loaders`
  - Up to 68% faster imports when using specific sub-paths vs full package
- **warmUp() method** on RAGEngine for pre-loading ML models
  - Avoids first-request latency during runtime
  - Pre-loads BGE reranker and HuggingFace embedding models
- **Startup benchmarks** in `packages/core/test/startup/` and `packages/rag/test/startup/`
  - Agent initialization: 0.67ms (target <500ms) - 741x faster than requirement
  - RAG engine initialization: 0.065ms (target <200ms)

#### Security
- SQL injection prevention utilities
- Path traversal prevention
- Input validation with Zod schemas
- **Secret redaction** utilities for safe logging

### Fixed

- MMR reranker tests now deterministic

---

## [0.0.1] - 2025-01-01

### Added

- Initial project setup with Turborepo monorepo
- TypeScript configuration with strict mode
- pnpm workspace configuration
- Vitest testing framework
- ESLint and Prettier configuration
- MIT License

---

[Unreleased]: https://github.com/draco28/ContextAI/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/draco28/ContextAI/releases/tag/v0.0.1
