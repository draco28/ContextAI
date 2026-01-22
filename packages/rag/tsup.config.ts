import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main entry point - everything
    index: 'src/index.ts',

    // Sub-entry points for lazy loading / tree-shaking
    // Users can import specifically what they need:
    //   import { RAGEngineImpl } from '@contextai/rag/engine'
    //   import { DenseRetriever } from '@contextai/rag/retrieval'
    'cache/index': 'src/cache/index.ts',
    'loaders/index': 'src/loaders/index.ts',
    'embeddings/index': 'src/embeddings/index.ts',
    'vector-store/index': 'src/vector-store/index.ts',
    'chunking/index': 'src/chunking/index.ts',
    'retrieval/index': 'src/retrieval/index.ts',
    'reranker/index': 'src/reranker/index.ts',
    'assembly/index': 'src/assembly/index.ts',
    'query-enhancement/index': 'src/query-enhancement/index.ts',
    'engine/index': 'src/engine/index.ts',
    'adaptive/index': 'src/adaptive/index.ts',
    'memory/index': 'src/memory/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: 'external',
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: true,
  external: ['@contextai/core'],
});
