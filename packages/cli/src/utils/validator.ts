import type { PackageType } from '../types.js';

/**
 * Result of package name validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a package name follows conventions
 *
 * Rules:
 * - Must be lowercase
 * - Must use hyphens (not underscores)
 * - Must not start with a number
 * - Must be at least 2 characters
 * - Must not contain special characters
 */
export function validatePackageName(name: string): ValidationResult {
  if (!name || name.length < 2) {
    return { valid: false, error: 'Package name must be at least 2 characters' };
  }

  if (name !== name.toLowerCase()) {
    return { valid: false, error: 'Package name must be lowercase' };
  }

  if (/^[0-9]/.test(name)) {
    return { valid: false, error: 'Package name cannot start with a number' };
  }

  if (/_/.test(name)) {
    return { valid: false, error: 'Use hyphens (-) instead of underscores (_)' };
  }

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return { valid: false, error: 'Package name can only contain lowercase letters, numbers, and hyphens' };
  }

  if (/--/.test(name)) {
    return { valid: false, error: 'Package name cannot contain consecutive hyphens' };
  }

  if (name.endsWith('-')) {
    return { valid: false, error: 'Package name cannot end with a hyphen' };
  }

  return { valid: true };
}

/**
 * Converts kebab-case to PascalCase
 * "my-provider" -> "MyProvider"
 */
export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Converts kebab-case to camelCase
 * "my-provider" -> "myProvider"
 */
export function toCamelCase(kebab: string): string {
  const pascal = toPascalCase(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Gets the full npm package name based on type and name
 */
export function getFullPackageName(name: string, type: PackageType): string {
  switch (type) {
    case 'provider':
      return `@contextaisdk/provider-${name}`;
    case 'agent':
      return `@contextaisdk/${name}`;
    case 'component':
      return `@contextaisdk/${name}`;
    case 'library':
      return `@contextaisdk/${name}`;
    default:
      return `@contextaisdk/${name}`;
  }
}

/**
 * Gets the directory name for a package based on type and name
 */
export function getPackageDirectory(name: string, type: PackageType): string {
  switch (type) {
    case 'provider':
      return `provider-${name}`;
    default:
      return name;
  }
}

/**
 * Get all name variants for template context
 */
export function getPackageNameVariants(name: string, type: PackageType) {
  const dirName = getPackageDirectory(name, type);

  return {
    pascalName: toPascalCase(name),
    camelName: toCamelCase(name),
    packageName: getFullPackageName(name, type),
    dirName,
  };
}
