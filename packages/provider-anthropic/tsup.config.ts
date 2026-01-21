import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: 'external',
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: true,
  // Don't bundle these - they're external dependencies
  external: ['@contextai/core', '@anthropic-ai/sdk'],
});
