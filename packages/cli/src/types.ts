/**
 * Package types supported by the CLI scaffolding
 */
export type PackageType = 'provider' | 'agent' | 'component' | 'library';

/**
 * Template context passed to EJS templates
 */
export interface TemplateContext {
  /** Package name in kebab-case (e.g., "my-provider") */
  name: string;
  /** Package name in PascalCase (e.g., "MyProvider") */
  pascalName: string;
  /** Package name in camelCase (e.g., "myProvider") */
  camelName: string;
  /** Full npm package name (e.g., "@contextai/provider-my") */
  packageName: string;
  /** Package description */
  description: string;
  /** Package type */
  type: PackageType;
  /** Author name (from git config or prompt) */
  author?: string;
}

/**
 * Options for the `new` command
 */
export interface NewCommandOptions {
  /** Skip interactive prompts, use defaults */
  yes?: boolean;
  /** Preview without creating files */
  dryRun?: boolean;
  /** Custom description */
  description?: string;
}

/**
 * Options for the `init` command
 */
export interface InitCommandOptions {
  /** Skip interactive prompts */
  yes?: boolean;
  /** Preview without creating files */
  dryRun?: boolean;
  /** Template to use (minimal, full) */
  template?: 'minimal' | 'full';
}

/**
 * Options for the `analyze` command
 */
export interface AnalyzeCommandOptions {
  /** Only analyze specific packages */
  filter?: string;
  /** Output format */
  format?: 'table' | 'json';
  /** Show detailed breakdown */
  detailed?: boolean;
}

/**
 * Result of scaffolding operation
 */
export interface ScaffoldResult {
  /** Path to created package */
  packagePath: string;
  /** List of created files */
  files: string[];
  /** Any warnings during creation */
  warnings: string[];
}
