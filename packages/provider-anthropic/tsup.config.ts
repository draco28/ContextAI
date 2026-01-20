import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  // Don't bundle these - they're external dependencies
  external: ['@contextai/core', '@anthropic-ai/sdk'],
});
