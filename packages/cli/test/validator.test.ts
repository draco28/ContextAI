import { describe, it, expect } from 'vitest';
import {
  validatePackageName,
  toPascalCase,
  toCamelCase,
  getFullPackageName,
  getPackageDirectory,
  getPackageNameVariants,
} from '../src/utils/validator.js';

describe('validatePackageName', () => {
  it('should accept valid kebab-case names', () => {
    expect(validatePackageName('my-provider').valid).toBe(true);
    expect(validatePackageName('openai').valid).toBe(true);
    expect(validatePackageName('my-cool-agent').valid).toBe(true);
    expect(validatePackageName('a1').valid).toBe(true);
  });

  it('should reject names shorter than 2 characters', () => {
    const result = validatePackageName('a');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 2 characters');
  });

  it('should reject uppercase names', () => {
    const result = validatePackageName('MyProvider');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('should reject names starting with a number', () => {
    const result = validatePackageName('123provider');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot start with a number');
  });

  it('should reject names with underscores', () => {
    const result = validatePackageName('my_provider');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('hyphens');
  });

  it('should reject names with special characters', () => {
    expect(validatePackageName('my@provider').valid).toBe(false);
    expect(validatePackageName('my.provider').valid).toBe(false);
    expect(validatePackageName('my provider').valid).toBe(false);
  });

  it('should reject consecutive hyphens', () => {
    const result = validatePackageName('my--provider');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('consecutive hyphens');
  });

  it('should reject names ending with hyphen', () => {
    const result = validatePackageName('my-provider-');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('end with a hyphen');
  });
});

describe('toPascalCase', () => {
  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('my-provider')).toBe('MyProvider');
    expect(toPascalCase('openai')).toBe('Openai');
    expect(toPascalCase('my-cool-agent')).toBe('MyCoolAgent');
    expect(toPascalCase('a')).toBe('A');
  });
});

describe('toCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(toCamelCase('my-provider')).toBe('myProvider');
    expect(toCamelCase('openai')).toBe('openai');
    expect(toCamelCase('my-cool-agent')).toBe('myCoolAgent');
  });
});

describe('getFullPackageName', () => {
  it('should return correct package names for each type', () => {
    expect(getFullPackageName('openai', 'provider')).toBe('@contextaisdk/provider-openai');
    expect(getFullPackageName('my-agent', 'agent')).toBe('@contextaisdk/my-agent');
    expect(getFullPackageName('chat', 'component')).toBe('@contextaisdk/chat');
    expect(getFullPackageName('utils', 'library')).toBe('@contextaisdk/utils');
  });
});

describe('getPackageDirectory', () => {
  it('should return correct directory names', () => {
    expect(getPackageDirectory('openai', 'provider')).toBe('provider-openai');
    expect(getPackageDirectory('my-agent', 'agent')).toBe('my-agent');
    expect(getPackageDirectory('chat', 'component')).toBe('chat');
    expect(getPackageDirectory('utils', 'library')).toBe('utils');
  });
});

describe('getPackageNameVariants', () => {
  it('should return all name variants', () => {
    const variants = getPackageNameVariants('my-cool', 'provider');
    expect(variants.pascalName).toBe('MyCool');
    expect(variants.camelName).toBe('myCool');
    expect(variants.packageName).toBe('@contextaisdk/provider-my-cool');
    expect(variants.dirName).toBe('provider-my-cool');
  });
});
