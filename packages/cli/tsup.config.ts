import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // CLI needs CommonJS for direct execution
  dts: true,
  clean: true,
  sourcemap: 'external',
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: false, // Keep readable for debugging
  banner: {
    // Shebang must be at the very top of the file
    js: '#!/usr/bin/env node',
  },
  // Bundle everything for standalone CLI
  noExternal: [/.*/],
  // But keep Node.js built-ins external
  external: ['node:*'],
});
