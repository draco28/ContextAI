import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main entry point - everything
    index: 'src/index.ts',

    // Sub-entry points for selective imports
    // Users can import specifically what they need:
    //   import { Agent } from '@contextai/core/agent'
    //   import { redactSecrets } from '@contextai/core/security'
    'agent/index': 'src/agent/index.ts',
    'tool/index': 'src/tool/index.ts',
    'provider/index': 'src/provider/index.ts',
    'errors/index': 'src/errors/index.ts',
    'security/index': 'src/security/index.ts',
    'tools/index': 'src/tools/index.ts',
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
  external: ['zod'],
});
