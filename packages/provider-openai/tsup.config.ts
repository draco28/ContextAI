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
  external: ['@contextai/core', 'openai'],
});
