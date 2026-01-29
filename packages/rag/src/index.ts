/**
 * @contextaisdk/rag - RAG Engine
 *
 * Document loading, chunking, and retrieval for AI applications.
 *
 * @packageDocumentation
 */

export const VERSION = '0.0.1';

// Cache
export {
  // Classes
  LRUCacheProvider,
  NoCacheProvider,
  // Types
  type CacheProvider,
  type CacheStats,
  type LRUCacheConfig,
} from './cache/index.js';

// Document Loaders
export {
  // Classes
  BaseDocumentLoader,
  DocumentLoaderRegistry,
  LoaderError,
  defaultRegistry,
  // Types
  type Document,
  type DocumentLoader,
  type DocumentMetadata,
  type LoadOptions,
  type LoaderErrorCode,
  type LoaderErrorDetails,
  type RegisterOptions,
} from './loaders/index.js';

// Embedding Providers
export {
  // Base Classes & Errors
  BaseEmbeddingProvider,
  EmbeddingError,
  // Providers
  HuggingFaceEmbeddingProvider,
  OllamaEmbeddingProvider,
  // Cache
  LRUEmbeddingCache,
  CachedEmbeddingProvider,
  generateCacheKey,
  // Utilities
  dotProduct,
  l2Norm,
  normalizeL2,
  cosineSimilarity,
  euclideanDistance,
  isNormalized,
  meanEmbedding,
  // Types
  type EmbeddingResult,
  type EmbeddingProvider,
  type EmbeddingProviderConfig,
  type EmbeddingErrorCode,
  type EmbeddingErrorDetails,
  type HuggingFaceEmbeddingConfig,
  type OllamaEmbeddingConfig,
  type EmbeddingCache,
  type LRUEmbeddingCacheConfig,
  type CachedEmbeddingProviderConfig,
} from './embeddings/index.js';

// Vector Stores
export {
  // Classes
  BaseVectorStore,
  InMemoryVectorStore,
  VectorStoreError,
  // Types
  type Chunk,
  type ChunkMetadata,
  type ChunkWithEmbedding,
  type SearchOptions,
  type SearchResult,
  type MetadataFilter,
  type FilterOperator,
  type DistanceMetric,
  type VectorStore,
  type VectorStoreConfig,
  type VectorStoreErrorCode,
  type VectorStoreErrorDetails,
} from './vector-store/index.js';

// Text Chunking
export {
  // Classes
  BaseChunker,
  ChunkerRegistry,
  ChunkerError,
  FixedSizeChunker,
  RecursiveChunker,
  SentenceChunker,
  defaultChunkerRegistry,
  // Utilities
  CHARS_PER_TOKEN,
  estimateTokens,
  countCharacters,
  measureSize,
  convertSize,
  findSizeIndex,
  splitBySize,
  DEFAULT_CHUNKING_OPTIONS,
  // Types
  type ChunkingOptions,
  type ChunkingStrategy,
  type ChunkerErrorCode,
  type ChunkerErrorDetails,
  type SizeUnit,
} from './chunking/index.js';

// Retrieval (Dense, Sparse, Hybrid)
export {
  // Classes
  BM25Retriever,
  DenseRetriever,
  HybridRetriever,
  RetrieverError,
  // RRF Utilities
  reciprocalRankFusion,
  rrfScore,
  maxRRFScore,
  normalizeRRFScores,
  DEFAULT_RRF_K,
  // Types
  type Retriever,
  type RetrievalResult,
  type RetrievalOptions,
  type HybridRetrievalOptions,
  type HybridScore,
  type BM25Config,
  type BM25Document,
  type DenseRetrieverConfig,
  type HybridRetrieverConfig,
  type RankedItem,
  type RRFResult,
  type RankingList,
  type RetrieverErrorCode,
  type RetrieverErrorDetails,
} from './retrieval/index.js';

// Reranking (Post-retrieval relevance optimization)
export {
  // Classes
  BaseReranker,
  BGEReranker,
  MMRReranker,
  LLMReranker,
  RerankerError,
  // Position Bias Utilities
  applyPositionBias,
  applySandwichOrdering,
  applyReverseSandwichOrdering,
  applyInterleaveOrdering,
  analyzePositionDistribution,
  recommendPositionBiasConfig,
  // Types
  type Reranker,
  type RerankerResult,
  type RerankerScores,
  type RerankerOptions,
  type MMRRerankerOptions,
  type LLMRerankerOptions,
  type BGERerankerConfig,
  type MMRRerankerConfig,
  type LLMRerankerConfig,
  type PositionBiasStrategy,
  type PositionBiasConfig,
  type RerankerErrorCode,
  type RerankerErrorDetails,
  type InternalRerankerResult,
} from './reranker/index.js';

// Context Assembly (Chunk formatting for LLM consumption)
export {
  // Classes
  BaseAssembler,
  XMLAssembler,
  MarkdownAssembler,
  AssemblyError,
  // Ordering Utilities
  applyOrdering,
  orderByRelevance,
  orderBySandwich,
  orderChronologically,
  analyzeOrdering,
  // Token Budget Utilities
  estimateTokens as estimateAssemblyTokens,
  estimateChunkTokens,
  calculateTokenBudget,
  applyTokenBudget,
  truncateText,
  analyzeBudget,
  // Deduplication Utilities
  jaccardSimilarity,
  tokenize as tokenizeForDedup,
  deduplicateResults,
  findSimilarPairs,
  analyzeSimilarity,
  // XML Utilities
  escapeXml,
  escapeXmlAttribute,
  // Defaults
  DEFAULT_ASSEMBLER_CONFIG,
  DEFAULT_XML_CONFIG,
  DEFAULT_MARKDOWN_CONFIG,
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_DEDUPLICATION_CONFIG,
  // Types
  type ContextAssembler,
  type AssembledContext,
  type AssemblerConfig,
  type AssemblyOptions,
  type SourceAttribution,
  type OrderingStrategy,
  type TokenBudgetConfig,
  type DeduplicationConfig,
  type XMLAssemblerConfig,
  type MarkdownAssemblerConfig,
  type AssemblyErrorCode,
  type AssemblyErrorDetails,
  type OrderingAnalysis,
  type BudgetResult,
  type BudgetAnalysis,
  type ChunkTokenAnalysis,
  type DeduplicationResult,
  type DuplicateInfo,
  type SimilarPair,
  type SimilarityAnalysis,
} from './assembly/index.js';

// Query Enhancement (Pre-retrieval query optimization)
export {
  // Classes
  BaseQueryEnhancer,
  QueryRewriter,
  HyDEEnhancer,
  MultiQueryExpander,
  QueryEnhancementError,
  // Types
  type QueryEnhancer,
  type EnhancementResult,
  type EnhancementMetadata,
  type EnhanceOptions,
  type EnhancementStrategy,
  type BaseEnhancerConfig,
  type QueryRewriterConfig,
  type HyDEConfig,
  type MultiQueryConfig,
  type QueryEnhancementErrorCode,
  type QueryEnhancementErrorDetails,
} from './query-enhancement/index.js';

// RAG Engine (High-level orchestrator)
export {
  // Classes
  RAGEngineImpl,
  RAGEngineError,
  // Types
  type RAGEngine,
  type RAGEngineConfig,
  type RAGSearchOptions,
  type RAGSearchDefaults,
  type RAGResult,
  type RAGSearchMetadata,
  type RAGTimings,
  type RAGEngineErrorCode,
  type RAGEngineErrorDetails,
} from './engine/index.js';

// Adaptive RAG (Query classification and adaptive retrieval)
export {
  // Classes
  QueryClassifier,
  AdaptiveRAG,
  AdaptiveRAGError,
  // Types
  type QueryType,
  type QueryFeatures,
  type ClassificationResult,
  type PipelineRecommendation,
  type ClassificationThresholds,
  type QueryClassifierConfig,
  type AdaptiveRAGConfig,
  type SkipRetrievalOptions,
  type AdaptiveSearchOptions,
  type ConversationMessage,
  type AdaptiveRAGResult,
  type IQueryClassifier,
  type IAdaptiveRAG,
  type AdaptiveRAGErrorCode,
  type AdaptiveRAGErrorDetails,
} from './adaptive/index.js';

// Memory Management (Budget enforcement and efficient storage)
export {
  // Classes
  MemoryBudget,
  // Functions
  getMemoryStats,
  formatMemoryStats,
  estimateSize,
  estimateEmbeddingMemory,
  formatBytes,
  toFloat32Array,
  toNumberArray,
  // Constants
  BYTES_PER_FLOAT64,
  BYTES_PER_FLOAT32,
  COMMON_DIMENSIONS,
  // Types
  type MemoryStats,
  type MemoryCallback,
  type MemoryBudgetConfig,
  type MemoryBudgetStatus,
  type SizeEstimationOptions,
  type EmbeddingStorageFormat,
} from './memory/index.js';

// Knowledge Graph (Graph-based knowledge storage and traversal)
export {
  // Error class
  GraphStoreError,
  // Zod Schemas
  GraphNodeTypeSchema,
  GraphNodePropertiesSchema,
  GraphNodeInputSchema,
  GraphNodeSchema,
  GraphEdgeTypeSchema,
  GraphEdgePropertiesSchema,
  GraphEdgeInputSchema,
  GraphEdgeSchema,
  TraversalDirectionSchema,
  GetNeighborsOptionsSchema,
  GraphQueryOptionsSchema,
  GraphStoreConfigSchema,
  // Types
  type GraphNodeType,
  type GraphNodeProperties,
  type GraphNode,
  type GraphNodeInput,
  type GraphEdgeType,
  type GraphEdgeProperties,
  type GraphEdge,
  type GraphEdgeInput,
  type TraversalDirection,
  type GetNeighborsOptions,
  type NeighborResult,
  type GraphQueryOptions,
  type GraphQueryResult,
  type GraphStoreConfig,
  type GraphStore,
  type GraphStoreErrorCode,
  type GraphStoreErrorDetails,
  type ValidatedGraphNodeInput,
  type ValidatedGraphEdgeInput,
  type ValidatedGetNeighborsOptions,
  type ValidatedGraphQueryOptions,
  type ValidatedGraphStoreConfig,
} from './knowledge-graph/index.js';
