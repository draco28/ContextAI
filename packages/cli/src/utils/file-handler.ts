import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs-extra';
import ejs from 'ejs';
import type { TemplateContext, ScaffoldResult, PackageType } from '../types.js';

/**
 * Get the templates directory path
 */
function getTemplatesDir(): string {
  // When running from built CLI, __dirname will be in dist/
  // Templates are bundled, so we use string templates instead
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  // Go up from utils/ to src/, then to templates/
  return join(currentDir, '..', 'templates');
}

/**
 * Get the monorepo packages directory
 */
function getPackagesDir(): string {
  // Assume we're running from within a monorepo
  // Go up until we find packages/ directory
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(join(dir, 'packages')) && fs.existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return join(dir, 'packages');
    }
    dir = dirname(dir);
  }
  // If not in a monorepo, use current directory
  return process.cwd();
}

/**
 * Scaffolds a new package based on type and context
 */
export async function scaffoldPackage(context: TemplateContext): Promise<ScaffoldResult> {
  const packagesDir = getPackagesDir();
  const packagePath = join(packagesDir, context.dirName || context.name);
  const files: string[] = [];
  const warnings: string[] = [];

  // Check if package already exists
  if (fs.existsSync(packagePath)) {
    throw new Error(`Package directory already exists: ${packagePath}`);
  }

  // Create package directory
  await fs.ensureDir(packagePath);
  await fs.ensureDir(join(packagePath, 'src'));
  await fs.ensureDir(join(packagePath, 'test'));

  // Generate files based on package type
  const templates = getTemplatesForType(context.type);

  for (const template of templates) {
    const content = renderTemplate(template.template, context);
    const filePath = join(packagePath, template.path);

    await fs.ensureDir(dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    files.push(template.path);
  }

  return {
    packagePath,
    files,
    warnings,
  };
}

interface TemplateFile {
  path: string;
  template: string;
}

/**
 * Get templates for a specific package type
 */
function getTemplatesForType(type: PackageType): TemplateFile[] {
  const baseTemplates: TemplateFile[] = [
    { path: 'package.json', template: getPackageJsonTemplate(type) },
    { path: 'tsconfig.json', template: TSCONFIG_TEMPLATE },
    { path: 'tsup.config.ts', template: getTsupConfigTemplate(type) },
    { path: 'vitest.config.ts', template: VITEST_CONFIG_TEMPLATE },
    { path: 'README.md', template: getReadmeTemplate(type) },
  ];

  switch (type) {
    case 'provider':
      return [
        ...baseTemplates,
        { path: 'src/index.ts', template: PROVIDER_INDEX_TEMPLATE },
        { path: 'src/provider.ts', template: PROVIDER_CLASS_TEMPLATE },
        { path: 'src/errors.ts', template: PROVIDER_ERRORS_TEMPLATE },
        { path: 'src/types.ts', template: PROVIDER_TYPES_TEMPLATE },
        { path: 'test/provider.test.ts', template: PROVIDER_TEST_TEMPLATE },
      ];
    case 'agent':
      return [
        ...baseTemplates,
        { path: 'src/index.ts', template: AGENT_INDEX_TEMPLATE },
        { path: 'src/agent.ts', template: AGENT_CLASS_TEMPLATE },
        { path: 'src/types.ts', template: AGENT_TYPES_TEMPLATE },
        { path: 'test/agent.test.ts', template: AGENT_TEST_TEMPLATE },
      ];
    case 'component':
      return [
        ...baseTemplates,
        { path: 'src/index.ts', template: COMPONENT_INDEX_TEMPLATE },
        { path: 'src/component.tsx', template: COMPONENT_TSX_TEMPLATE },
        { path: 'src/hooks.ts', template: COMPONENT_HOOKS_TEMPLATE },
        { path: 'src/types.ts', template: COMPONENT_TYPES_TEMPLATE },
        { path: 'test/component.test.tsx', template: COMPONENT_TEST_TEMPLATE },
      ];
    case 'library':
      return [
        ...baseTemplates,
        { path: 'src/index.ts', template: LIBRARY_INDEX_TEMPLATE },
        { path: 'src/utils.ts', template: LIBRARY_UTILS_TEMPLATE },
        { path: 'src/types.ts', template: LIBRARY_TYPES_TEMPLATE },
        { path: 'test/utils.test.ts', template: LIBRARY_TEST_TEMPLATE },
      ];
    default:
      return baseTemplates;
  }
}

/**
 * Renders an EJS template with the given context
 */
function renderTemplate(template: string, context: TemplateContext): string {
  return ejs.render(template, context, { async: false });
}

// ============================================================================
// Base Templates
// ============================================================================

function getPackageJsonTemplate(type: PackageType): string {
  const peerDeps = type === 'component'
    ? `"peerDependencies": {
    "react": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": false }
  },`
    : '';

  const extraDeps = type === 'component'
    ? `"react": "^18.3.1",`
    : '';

  const extraDevDeps = type === 'component'
    ? `"@types/react": "^18.3.0",
    "@testing-library/react": "^16.0.0",`
    : '';

  return `{
  "name": "<%= packageName %>",
  "version": "0.0.1",
  "description": "<%= description %>",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@contextaisdk/core": "workspace:*"${extraDeps ? ',\n    ' + extraDeps : ''}
  },
  "devDependencies": {
    "@contextaisdk/tsconfig": "workspace:*",
    ${extraDevDeps}"@types/node": "^20.11.0",
    "tsup": "^8.3.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.0"
  },
  ${peerDeps}
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`;
}

const TSCONFIG_TEMPLATE = `{
  "extends": "@contextaisdk/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["dist", "node_modules", "test"]
}
`;

function getTsupConfigTemplate(type: PackageType): string {
  const entry = type === 'component'
    ? `['src/index.ts', 'src/component.tsx']`
    : `['src/index.ts']`;

  const external = type === 'component'
    ? `['@contextaisdk/core', 'react', 'react-dom']`
    : `['@contextaisdk/core']`;

  return `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ${entry},
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: 'external',
  target: 'es2022',
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  minify: true,
  external: ${external},
});
`;
}

const VITEST_CONFIG_TEMPLATE = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/index.ts'],
    },
  },
});
`;

function getReadmeTemplate(type: PackageType): string {
  return `# <%= packageName %>

<%= description %>

## Installation

\`\`\`bash
npm install <%= packageName %>
# or
pnpm add <%= packageName %>
\`\`\`

## Usage

\`\`\`typescript
import { <%= pascalName %>${type === 'provider' ? 'Provider' : ''} } from '<%= packageName %>';

// TODO: Add usage example
\`\`\`

## API

### \`<%= pascalName %>${type === 'provider' ? 'Provider' : ''}\`

TODO: Document API

## License

MIT
`;
}

// ============================================================================
// Provider Templates
// ============================================================================

const PROVIDER_INDEX_TEMPLATE = `export { <%= pascalName %>Provider } from './provider.js';
export type { <%= pascalName %>ProviderConfig } from './types.js';
export { <%= pascalName %>ProviderError } from './errors.js';
`;

const PROVIDER_CLASS_TEMPLATE = `import type {
  LLMProvider,
  ChatMessage,
  ChatResponse,
  StreamChunk,
  GenerateOptions,
} from '@contextaisdk/core';
import type { <%= pascalName %>ProviderConfig } from './types.js';
import { <%= pascalName %>ProviderError } from './errors.js';

/**
 * <%= pascalName %> LLM Provider
 *
 * Implements the LLMProvider interface for <%= pascalName %>.
 */
export class <%= pascalName %>Provider implements LLMProvider {
  /** Provider identifier */
  readonly name = '<%= name %>';

  /** Model being used */
  readonly model: string;

  private readonly config: <%= pascalName %>ProviderConfig;

  constructor(config: <%= pascalName %>ProviderConfig) {
    if (!config.apiKey) {
      throw new <%= pascalName %>ProviderError('API key is required', '<%= name.toUpperCase() %>_AUTH_ERROR');
    }
    if (!config.model) {
      throw new <%= pascalName %>ProviderError('Model is required', '<%= name.toUpperCase() %>_INVALID_REQUEST');
    }
    this.config = config;
    this.model = config.model;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  chat = async (
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<ChatResponse> => {
    // TODO: Implement API call using this.config
    // Example: const response = await fetch(this.config.baseUrl + '/chat', { ... });
    void messages;
    void options;
    void this.config; // Acknowledge config exists (remove when implementing)
    throw new <%= pascalName %>ProviderError('chat() not implemented', '<%= name.toUpperCase() %>_NOT_IMPLEMENTED');
  };

  /**
   * Stream a chat completion
   *
   * @remarks
   * This is an async generator method, not an arrow function, because
   * JavaScript doesn't support arrow function generators.
   * Avoid passing this method as a callback without binding.
   */
  async *streamChat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // TODO: Implement streaming API call using this.config
    void messages;
    void options;
    throw new <%= pascalName %>ProviderError('streamChat() not implemented', '<%= name.toUpperCase() %>_NOT_IMPLEMENTED');
  }

  /**
   * Check if provider is configured and available
   */
  isAvailable = async (): Promise<boolean> => {
    // TODO: Implement health check using this.config.apiKey
    return Boolean(this.config.apiKey);
  };
}
`;

const PROVIDER_ERRORS_TEMPLATE = `/**
 * Error codes for <%= pascalName %> provider
 */
export type <%= pascalName %>ErrorCode =
  | '<%= name.toUpperCase() %>_AUTH_ERROR'
  | '<%= name.toUpperCase() %>_INVALID_REQUEST'
  | '<%= name.toUpperCase() %>_RATE_LIMIT'
  | '<%= name.toUpperCase() %>_API_ERROR'
  | '<%= name.toUpperCase() %>_NOT_IMPLEMENTED'
  | '<%= name.toUpperCase() %>_UNKNOWN_ERROR';

/**
 * Custom error class for <%= pascalName %> provider errors
 */
export class <%= pascalName %>ProviderError extends Error {
  readonly code: <%= pascalName %>ErrorCode;
  readonly cause?: Error;

  constructor(message: string, code: <%= pascalName %>ErrorCode, cause?: Error) {
    super(message);
    this.name = '<%= pascalName %>ProviderError';
    this.code = code;
    this.cause = cause;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}
`;

const PROVIDER_TYPES_TEMPLATE = `/**
 * Configuration for <%= pascalName %> provider
 */
export interface <%= pascalName %>ProviderConfig {
  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Model to use
   */
  model: string;

  /**
   * Base URL override (optional)
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 60000
   */
  timeout?: number;
}
`;

const PROVIDER_TEST_TEMPLATE = `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <%= pascalName %>Provider } from '../src/provider.js';
import { <%= pascalName %>ProviderError } from '../src/errors.js';

describe('<%= pascalName %>Provider', () => {
  const validConfig = {
    apiKey: 'test-key',
    model: 'test-model',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new <%= pascalName %>Provider({ apiKey: '', model: 'test' }))
        .toThrow(<%= pascalName %>ProviderError);
    });

    it('should throw if model is missing', () => {
      expect(() => new <%= pascalName %>Provider({ apiKey: 'test', model: '' }))
        .toThrow(<%= pascalName %>ProviderError);
    });

    it('should create instance with valid config', () => {
      const provider = new <%= pascalName %>Provider(validConfig);
      expect(provider).toBeInstanceOf(<%= pascalName %>Provider);
      expect(provider.name).toBe('<%= name %>');
      expect(provider.model).toBe('test-model');
    });
  });

  describe('chat', () => {
    it('should throw not implemented', async () => {
      const provider = new <%= pascalName %>Provider(validConfig);
      await expect(provider.chat([])).rejects.toThrow('not implemented');
    });
  });

  describe('streamChat', () => {
    it('should throw not implemented', async () => {
      const provider = new <%= pascalName %>Provider(validConfig);
      const generator = provider.streamChat([]);
      await expect(generator.next()).rejects.toThrow('not implemented');
    });
  });
});
`;

// ============================================================================
// Agent Templates (Feature Package)
// ============================================================================

const AGENT_INDEX_TEMPLATE = `export { <%= pascalName %> } from './agent.js';
export type { <%= pascalName %>Config, <%= pascalName %>Result } from './types.js';
`;

const AGENT_CLASS_TEMPLATE = `import type { Tool } from '@contextaisdk/core';
import type { <%= pascalName %>Config, <%= pascalName %>Result } from './types.js';

/**
 * <%= pascalName %> Feature
 *
 * This is a feature package that provides tools and utilities
 * for use with the ContextAI Agent.
 *
 * @example
 * \`\`\`typescript
 * import { Agent } from '@contextaisdk/core';
 * import { <%= pascalName %> } from '<%= packageName %>';
 *
 * const feature = new <%= pascalName %>({ ... });
 * const agent = new Agent({
 *   llm: provider,
 *   tools: feature.getTools(),
 * });
 * \`\`\`
 */
export class <%= pascalName %> {
  readonly name = '<%= name %>';

  private readonly config: <%= pascalName %>Config;

  constructor(config: <%= pascalName %>Config) {
    this.config = config;
  }

  /**
   * Get tools provided by this feature for use with Agent
   */
  getTools = (): Tool[] => {
    // TODO: Define tools that this feature provides
    // Example:
    // return [
    //   defineTool({
    //     name: 'my-tool',
    //     description: 'Does something useful',
    //     parameters: z.object({ query: z.string() }),
    //     execute: async ({ query }) => ({ result: query }),
    //   }),
    // ];
    return [];
  };

  /**
   * Process input and return a result
   */
  process = async (input: string): Promise<<%= pascalName %>Result> => {
    // TODO: Implement feature logic
    void this.config; // Use config for processing
    return {
      input,
      output: \`Processed: \${input}\`,
    };
  };
}
`;

const AGENT_TYPES_TEMPLATE = `/**
 * Configuration for <%= pascalName %>
 */
export interface <%= pascalName %>Config {
  /**
   * TODO: Define configuration options
   */
  [key: string]: unknown;
}

/**
 * Result from <%= pascalName %> processing
 */
export interface <%= pascalName %>Result {
  /** The original input */
  input: string;
  /** The processed output */
  output: string;
}
`;

const AGENT_TEST_TEMPLATE = `import { describe, it, expect } from 'vitest';
import { <%= pascalName %> } from '../src/agent.js';

describe('<%= pascalName %>', () => {
  it('should create instance', () => {
    const feature = new <%= pascalName %>({});
    expect(feature).toBeInstanceOf(<%= pascalName %>);
    expect(feature.name).toBe('<%= name %>');
  });

  it('should return tools array', () => {
    const feature = new <%= pascalName %>({});
    const tools = feature.getTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('should process input', async () => {
    const feature = new <%= pascalName %>({});
    const result = await feature.process('test input');
    expect(result.input).toBe('test input');
    expect(result.output).toContain('test input');
  });
});
`;

// ============================================================================
// Component Templates
// ============================================================================

const COMPONENT_INDEX_TEMPLATE = `export { <%= pascalName %> } from './component.js';
export { use<%= pascalName %> } from './hooks.js';
export type { <%= pascalName %>Props, Use<%= pascalName %>Options } from './types.js';
`;

const COMPONENT_TSX_TEMPLATE = `import React from 'react';
import { use<%= pascalName %> } from './hooks.js';
import type { <%= pascalName %>Props } from './types.js';

/**
 * <%= pascalName %> Component
 *
 * TODO: Describe what this component does
 */
export function <%= pascalName %>(props: <%= pascalName %>Props): React.ReactElement {
  const { className, children, ...rest } = props;
  const state = use<%= pascalName %>(rest);

  return (
    <div className={className} data-<%= name %>>
      {children}
    </div>
  );
}
`;

const COMPONENT_HOOKS_TEMPLATE = `import { useState, useCallback } from 'react';
import type { Use<%= pascalName %>Options } from './types.js';

/**
 * Hook for <%= pascalName %> functionality
 */
export function use<%= pascalName %>(options: Use<%= pascalName %>Options = {}) {
  const [state, setState] = useState<unknown>(null);

  const action = useCallback(() => {
    // TODO: Implement hook logic
  }, []);

  return {
    state,
    action,
  };
}
`;

const COMPONENT_TYPES_TEMPLATE = `import type { ReactNode } from 'react';

/**
 * Props for <%= pascalName %> component
 */
export interface <%= pascalName %>Props {
  /**
   * CSS class name
   */
  className?: string;

  /**
   * Children elements
   */
  children?: ReactNode;
}

/**
 * Options for use<%= pascalName %> hook
 */
export interface Use<%= pascalName %>Options {
  /**
   * TODO: Define hook options
   */
}
`;

const COMPONENT_TEST_TEMPLATE = `import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { use<%= pascalName %> } from '../src/hooks.js';

describe('use<%= pascalName %>', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => use<%= pascalName %>());
    expect(result.current.state).toBe(null);
    expect(typeof result.current.action).toBe('function');
  });
});
`;

// ============================================================================
// Library Templates
// ============================================================================

const LIBRARY_INDEX_TEMPLATE = `export * from './utils.js';
export type * from './types.js';
`;

const LIBRARY_UTILS_TEMPLATE = `/**
 * Example utility function
 *
 * TODO: Replace with actual implementation
 */
export function exampleUtil(input: string): string {
  return input.toUpperCase();
}
`;

const LIBRARY_TYPES_TEMPLATE = `/**
 * Example type
 *
 * TODO: Replace with actual types
 */
export interface ExampleType {
  value: string;
}
`;

const LIBRARY_TEST_TEMPLATE = `import { describe, it, expect } from 'vitest';
import { exampleUtil } from '../src/utils.js';

describe('exampleUtil', () => {
  it('should uppercase string', () => {
    expect(exampleUtil('hello')).toBe('HELLO');
  });
});
`;
