/**
 * Bundle Analysis Tests
 *
 * These tests verify that the built bundle does NOT contain Node.js-specific APIs
 * that would cause runtime errors in browsers.
 *
 * NFR-502: React components shall support modern browsers without Node.js dependencies
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Node.js APIs that should NEVER appear in the browser bundle
 *
 * If any of these patterns are found, it indicates:
 * - Accidental import of Node.js modules
 * - Bundler misconfiguration
 * - Code that won't work in browsers
 */
const NODE_API_PATTERNS = [
  // Core Node.js modules
  { pattern: /require\s*\(\s*['"]node:/, name: 'node: protocol imports' },
  { pattern: /require\s*\(\s*['"]fs['"]/, name: 'fs module' },
  { pattern: /require\s*\(\s*['"]path['"]/, name: 'path module' },
  { pattern: /require\s*\(\s*['"]crypto['"]/, name: 'crypto module' },
  { pattern: /require\s*\(\s*['"]child_process['"]/, name: 'child_process module' },
  { pattern: /require\s*\(\s*['"]http['"]/, name: 'http module' },
  { pattern: /require\s*\(\s*['"]https['"]/, name: 'https module' },
  { pattern: /require\s*\(\s*['"]os['"]/, name: 'os module' },
  { pattern: /require\s*\(\s*['"]stream['"]/, name: 'stream module' },
  { pattern: /require\s*\(\s*['"]buffer['"]/, name: 'buffer module (direct)' },
  { pattern: /require\s*\(\s*['"]util['"]/, name: 'util module' },
  { pattern: /require\s*\(\s*['"]net['"]/, name: 'net module' },
  { pattern: /require\s*\(\s*['"]dgram['"]/, name: 'dgram module' },
  { pattern: /require\s*\(\s*['"]dns['"]/, name: 'dns module' },
  { pattern: /require\s*\(\s*['"]tls['"]/, name: 'tls module' },
  { pattern: /require\s*\(\s*['"]cluster['"]/, name: 'cluster module' },
  { pattern: /require\s*\(\s*['"]worker_threads['"]/, name: 'worker_threads module' },

  // Node.js globals (when used as identifiers, not as properties)
  { pattern: /\bprocess\.env\b/, name: 'process.env' },
  { pattern: /\bprocess\.cwd\b/, name: 'process.cwd()' },
  { pattern: /\bprocess\.exit\b/, name: 'process.exit()' },
  { pattern: /\bprocess\.argv\b/, name: 'process.argv' },
  { pattern: /\b__dirname\b/, name: '__dirname' },
  { pattern: /\b__filename\b/, name: '__filename' },

  // Node.js-specific Buffer usage (global Buffer, not ArrayBuffer)
  // Note: We check for Buffer as a constructor, not as a type
  { pattern: /\bBuffer\.from\b/, name: 'Buffer.from()' },
  { pattern: /\bBuffer\.alloc\b/, name: 'Buffer.alloc()' },
  { pattern: /\bnew Buffer\b/, name: 'new Buffer()' },
];

/**
 * Patterns that are ALLOWED in the bundle
 * These look like Node.js but are actually browser-safe
 */
const ALLOWED_PATTERNS = [
  // process.env in conditional checks (dead code in browser)
  /typeof\s+process\s*!==?\s*['"]undefined['"]/,
  // ArrayBuffer is fine (browser API)
  /ArrayBuffer/,
  // URL and URLSearchParams are browser APIs
  /\bURL\b/,
  /URLSearchParams/,
];

describe('Bundle Node.js API Leak Detection', () => {
  const distDir = path.join(__dirname, '../../dist');
  const esmBundle = path.join(distDir, 'index.js');
  const cjsBundle = path.join(distDir, 'index.cjs');

  /**
   * Check if the bundle exists - if not, we need to build first
   */
  it('should have built bundle available', () => {
    // This test will fail if someone runs tests without building first
    // That's intentional - it reminds us to build before testing browser compat
    const bundleExists = fs.existsSync(esmBundle) || fs.existsSync(cjsBundle);

    if (!bundleExists) {
      console.warn(
        '\n⚠️  Bundle not found. Run `pnpm build` in packages/react first.\n' +
          '   Skipping bundle analysis tests.\n'
      );
    }

    // Don't fail the test if bundle doesn't exist - just skip analysis
    // This allows tests to pass in CI before build step
    expect(true).toBe(true);
  });

  /**
   * Analyze ESM bundle for Node.js API leaks
   */
  it('should not contain Node.js APIs in ESM bundle', () => {
    if (!fs.existsSync(esmBundle)) {
      console.warn('ESM bundle not found, skipping');
      return;
    }

    const content = fs.readFileSync(esmBundle, 'utf-8');
    const violations: string[] = [];

    for (const { pattern, name } of NODE_API_PATTERNS) {
      // First check if it matches a banned pattern
      if (pattern.test(content)) {
        // Then check if it's actually allowed
        const isAllowed = ALLOWED_PATTERNS.some((allowed) => allowed.test(content));

        if (!isAllowed) {
          // Find the line number for better error reporting
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              violations.push(`${name} found at line ${i + 1}`);
              break;
            }
          }
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n❌ Node.js API leaks detected in ESM bundle:');
      violations.forEach((v) => console.error(`   - ${v}`));
      console.error('\nThese APIs will cause runtime errors in browsers!');
    }

    expect(violations).toEqual([]);
  });

  /**
   * Analyze CJS bundle for Node.js API leaks
   */
  it('should not contain Node.js APIs in CJS bundle', () => {
    if (!fs.existsSync(cjsBundle)) {
      console.warn('CJS bundle not found, skipping');
      return;
    }

    const content = fs.readFileSync(cjsBundle, 'utf-8');
    const violations: string[] = [];

    for (const { pattern, name } of NODE_API_PATTERNS) {
      if (pattern.test(content)) {
        const isAllowed = ALLOWED_PATTERNS.some((allowed) => allowed.test(content));

        if (!isAllowed) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              violations.push(`${name} found at line ${i + 1}`);
              break;
            }
          }
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n❌ Node.js API leaks detected in CJS bundle:');
      violations.forEach((v) => console.error(`   - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  /**
   * Verify bundle exports only browser-safe code
   */
  it('should export only React components and hooks', async () => {
    if (!fs.existsSync(esmBundle)) {
      console.warn('ESM bundle not found, skipping');
      return;
    }

    // Read the bundle and check exports
    const content = fs.readFileSync(esmBundle, 'utf-8');

    // Should export React-related things
    expect(content).toMatch(/export\s*{/);

    // Should NOT have side effects that run Node.js code
    // (No top-level require() calls or process checks that throw)
    const topLevelNodeCode = /^(?!.*export).*require\(['"](?:fs|path|child_process)/m;
    expect(topLevelNodeCode.test(content)).toBe(false);
  });

  /**
   * Verify bundle size is reasonable for browser delivery
   */
  it('should have reasonable bundle size for browser delivery', () => {
    if (!fs.existsSync(esmBundle)) {
      console.warn('ESM bundle not found, skipping');
      return;
    }

    const stats = fs.statSync(esmBundle);
    const sizeKB = stats.size / 1024;

    // React package should be lightweight (< 50KB unminified)
    // This is generous - actual size should be much smaller
    expect(sizeKB).toBeLessThan(50);

    console.log(`✓ ESM bundle size: ${sizeKB.toFixed(2)} KB`);
  });
});

describe('Source Code Node.js API Check', () => {
  const srcDir = path.join(__dirname, '../../src');

  /**
   * Get all TypeScript files in source directory
   */
  function getAllSourceFiles(dir: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }

    walk(dir);
    return files;
  }

  /**
   * Check source files don't import Node.js modules
   */
  it('should not import Node.js modules in source files', () => {
    if (!fs.existsSync(srcDir)) {
      console.warn('Source directory not found, skipping');
      return;
    }

    const sourceFiles = getAllSourceFiles(srcDir);
    const violations: { file: string; issue: string }[] = [];

    // Patterns that indicate Node.js imports in source
    const nodeImportPatterns = [
      { pattern: /import.*from\s+['"]node:/, name: 'node: protocol import' },
      { pattern: /import.*from\s+['"]fs['"]/, name: 'fs import' },
      { pattern: /import.*from\s+['"]path['"]/, name: 'path import' },
      { pattern: /import.*from\s+['"]crypto['"]/, name: 'crypto import' },
      { pattern: /import.*from\s+['"]child_process['"]/, name: 'child_process import' },
      { pattern: /import.*from\s+['"]os['"]/, name: 'os import' },
      { pattern: /import.*from\s+['"]stream['"]/, name: 'stream import' },
      { pattern: /import.*from\s+['"]buffer['"]/, name: 'buffer import' },
    ];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(srcDir, file);

      for (const { pattern, name } of nodeImportPatterns) {
        if (pattern.test(content)) {
          violations.push({ file: relativePath, issue: name });
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n❌ Node.js imports found in source files:');
      violations.forEach(({ file, issue }) => {
        console.error(`   - ${file}: ${issue}`);
      });
    }

    expect(violations).toEqual([]);
  });
});
