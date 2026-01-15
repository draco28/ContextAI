import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  PathValidator,
  validatePath,
  validatePathSync,
  PathTraversalError,
} from '../src';

describe('PathValidator', () => {
  // ==========================================================================
  // Constructor
  // ==========================================================================
  describe('constructor', () => {
    it('accepts valid options with single directory', () => {
      const validator = new PathValidator({
        allowedDirectories: ['/app/uploads'],
      });
      expect(validator).toBeDefined();
    });

    it('accepts multiple allowed directories', () => {
      const validator = new PathValidator({
        allowedDirectories: ['/app/uploads', '/app/public', '/tmp'],
      });
      expect(validator).toBeDefined();
    });

    it('throws PathTraversalError for empty allowedDirectories', () => {
      expect(() => {
        new PathValidator({ allowedDirectories: [] });
      }).toThrow(PathTraversalError);
    });

    it('throws PathTraversalError for missing allowedDirectories', () => {
      expect(() => {
        new PathValidator({} as any);
      }).toThrow(PathTraversalError);
    });

    it('accepts optional followSymlinks and maxPathLength', () => {
      const validator = new PathValidator({
        allowedDirectories: ['/app'],
        followSymlinks: true,
        maxPathLength: 1024,
      });
      expect(validator).toBeDefined();
    });
  });

  // ==========================================================================
  // normalize()
  // ==========================================================================
  describe('normalize', () => {
    let validator: PathValidator;

    beforeEach(() => {
      validator = new PathValidator({
        allowedDirectories: ['/app'],
      });
    });

    it('converts relative path to absolute', () => {
      const result = validator.normalize('file.txt');
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('removes redundant segments', () => {
      const result = validator.normalize('/app/./uploads/../uploads/file.txt');
      expect(result).toBe('/app/uploads/file.txt');
    });

    it('handles unicode normalization consistently', () => {
      // café with combining acute accent vs precomposed
      const decomposed = 'cafe\u0301';
      const composed = 'caf\u00e9';
      const result1 = validator.normalize(`/app/${decomposed}`);
      const result2 = validator.normalize(`/app/${composed}`);
      expect(result1).toBe(result2);
    });
  });

  // ==========================================================================
  // isAllowed()
  // ==========================================================================
  describe('isAllowed', () => {
    let validator: PathValidator;

    beforeEach(() => {
      validator = new PathValidator({
        allowedDirectories: ['/app/uploads', '/app/public'],
      });
    });

    it('returns true for path within allowed directory', () => {
      expect(validator.isAllowed('/app/uploads/file.txt')).toBe(true);
      expect(validator.isAllowed('/app/public/index.html')).toBe(true);
    });

    it('returns false for path outside allowed directories', () => {
      expect(validator.isAllowed('/etc/passwd')).toBe(false);
      expect(validator.isAllowed('/app/private/secret.txt')).toBe(false);
    });

    it('returns false for traversal attempts', () => {
      expect(validator.isAllowed('/app/uploads/../private/secret.txt')).toBe(
        false
      );
    });

    it('returns false for invalid input types', () => {
      expect(validator.isAllowed(null as any)).toBe(false);
      expect(validator.isAllowed(123 as any)).toBe(false);
    });
  });

  // ==========================================================================
  // getBasePath()
  // ==========================================================================
  describe('getBasePath', () => {
    let validator: PathValidator;

    beforeEach(() => {
      validator = new PathValidator({
        allowedDirectories: ['/app/uploads', '/app/public'],
      });
    });

    it('returns the matching allowed directory', () => {
      expect(validator.getBasePath('/app/uploads/file.txt')).toBe(
        '/app/uploads'
      );
      expect(validator.getBasePath('/app/public/css/style.css')).toBe(
        '/app/public'
      );
    });

    it('returns null for paths outside allowed directories', () => {
      expect(validator.getBasePath('/etc/passwd')).toBeNull();
      expect(validator.getBasePath('/app/private/secret.txt')).toBeNull();
    });

    it('handles exact directory match', () => {
      expect(validator.getBasePath('/app/uploads')).toBe('/app/uploads');
    });
  });

  // ==========================================================================
  // validateSync()
  // ==========================================================================
  describe('validateSync', () => {
    let validator: PathValidator;

    beforeEach(() => {
      validator = new PathValidator({
        allowedDirectories: ['/app/uploads'],
        maxPathLength: 100,
      });
    });

    describe('valid paths', () => {
      it('accepts path within allowed directory', () => {
        const result = validator.validateSync('/app/uploads/file.txt');
        expect(result.valid).toBe(true);
        expect(result.normalizedPath).toBe('/app/uploads/file.txt');
        expect(result.error).toBeUndefined();
        expect(result.blockedReason).toBeUndefined();
      });

      it('accepts nested paths within allowed directory', () => {
        const result = validator.validateSync(
          '/app/uploads/subdir/deep/file.txt'
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('invalid paths - type errors', () => {
      it('rejects non-string input', () => {
        const result = validator.validateSync(123 as any);
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('invalid');
        expect(result.error).toContain('must be a string');
      });

      it('rejects null input', () => {
        const result = validator.validateSync(null as any);
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('invalid');
      });

      it('rejects empty string', () => {
        const result = validator.validateSync('');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('invalid');
        expect(result.error).toContain('cannot be empty');
      });

      it('rejects whitespace-only string', () => {
        const result = validator.validateSync('   ');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('invalid');
      });
    });

    describe('invalid paths - traversal attacks', () => {
      it('rejects simple ../ traversal', () => {
        const result = validator.validateSync('/app/uploads/../etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('traversal');
        expect(result.error).toContain('traversal');
      });

      it('rejects ..\\ Windows-style traversal', () => {
        const result = validator.validateSync('/app/uploads/..\\etc\\passwd');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('traversal');
      });

      it('rejects multiple traversal sequences', () => {
        const result = validator.validateSync('/app/uploads/../../etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('traversal');
      });

      it('rejects traversal at end of path', () => {
        const result = validator.validateSync('/app/uploads/subdir/..');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('traversal');
      });

      it('rejects mixed slash traversal', () => {
        const result = validator.validateSync('/app/uploads/..\\../etc');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('traversal');
      });
    });

    describe('invalid paths - outside allowed', () => {
      it('rejects path completely outside allowed directories', () => {
        const result = validator.validateSync('/etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('outside_allowed');
      });

      it('rejects sibling directory', () => {
        const result = validator.validateSync('/app/private/secret.txt');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('outside_allowed');
      });

      it('rejects prefix collision paths', () => {
        // /app/uploads-other should NOT match /app/uploads
        const result = validator.validateSync('/app/uploads-other/file.txt');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('outside_allowed');
      });
    });

    describe('invalid paths - length', () => {
      it('rejects path exceeding maxPathLength', () => {
        const longPath = '/app/uploads/' + 'a'.repeat(100);
        const result = validator.validateSync(longPath);
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('too_long');
      });
    });

    describe('invalid paths - null byte', () => {
      it('rejects path with null byte in middle', () => {
        const result = validator.validateSync('/app/uploads/file.txt\0.jpg');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('null_byte');
        expect(result.error).toContain('null byte');
      });

      it('rejects null byte at start', () => {
        const result = validator.validateSync('\0/app/uploads/file.txt');
        expect(result.valid).toBe(false);
        expect(result.blockedReason).toBe('null_byte');
      });
    });
  });

  // ==========================================================================
  // validate() - Async with symlinks
  // ==========================================================================
  describe('validate (async)', () => {
    let validator: PathValidator;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'path-validator-test-')
      );
      // Resolve to real path to handle macOS /var -> /private/var symlink
      tempDir = await fs.realpath(tempDir);
      validator = new PathValidator({
        allowedDirectories: [tempDir],
        followSymlinks: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('validates real file within allowed directory', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'test content');

      const result = await validator.validate(filePath);
      expect(result.valid).toBe(true);
      expect(result.normalizedPath).toBe(filePath);
    });

    it('accepts non-existent file (for write operations)', async () => {
      const filePath = path.join(tempDir, 'new-file.txt');
      const result = await validator.validate(filePath);
      expect(result.valid).toBe(true);
    });

    it('allows symlink to file within allowed directory', async () => {
      const realFile = path.join(tempDir, 'real.txt');
      const symlink = path.join(tempDir, 'link.txt');
      await fs.writeFile(realFile, 'test');
      await fs.symlink(realFile, symlink);

      const result = await validator.validate(symlink);
      expect(result.valid).toBe(true);
      expect(result.normalizedPath).toBe(realFile);
    });

    it('blocks symlink pointing outside allowed directory', async () => {
      const symlink = path.join(tempDir, 'malicious-link');

      try {
        await fs.symlink('/etc/passwd', symlink);
      } catch {
        // May fail on some systems - skip test
        return;
      }

      const result = await validator.validate(symlink);
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('symlink');
      expect(result.error).toContain('outside allowed');
    });

    describe('with followSymlinks: false', () => {
      beforeEach(() => {
        validator = new PathValidator({
          allowedDirectories: [tempDir],
          followSymlinks: false,
        });
      });

      it('skips symlink resolution when disabled', async () => {
        const filePath = path.join(tempDir, 'test.txt');
        await fs.writeFile(filePath, 'test');

        const result = await validator.validate(filePath);
        expect(result.valid).toBe(true);
        // Returns the input path, not resolved through realpath
        expect(result.normalizedPath).toBe(filePath);
      });
    });
  });

  // ==========================================================================
  // Standalone functions
  // ==========================================================================
  describe('validatePath (standalone async)', () => {
    it('validates path with given options', async () => {
      const result = await validatePath('/app/uploads/file.txt', {
        allowedDirectories: ['/app/uploads'],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects traversal attacks', async () => {
      const result = await validatePath('/app/uploads/../etc/passwd', {
        allowedDirectories: ['/app/uploads'],
      });
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('traversal');
    });
  });

  describe('validatePathSync (standalone sync)', () => {
    it('validates path synchronously', () => {
      const result = validatePathSync('/app/uploads/file.txt', {
        allowedDirectories: ['/app/uploads'],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects outside paths synchronously', () => {
      const result = validatePathSync('/etc/passwd', {
        allowedDirectories: ['/app/uploads'],
      });
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('outside_allowed');
    });
  });

  // ==========================================================================
  // PathTraversalError
  // ==========================================================================
  describe('PathTraversalError', () => {
    it('has correct properties', () => {
      const error = new PathTraversalError(
        'Path blocked',
        '/bad/path',
        'traversal'
      );
      expect(error.name).toBe('PathTraversalError');
      expect(error.message).toBe('Path blocked');
      expect(error.unsafePath).toBe('/bad/path');
      expect(error.blockedReason).toBe('traversal');
      expect(error.code).toBe('PATH_TRAVERSAL_ERROR');
    });

    it('is instanceof Error', () => {
      const error = new PathTraversalError('test', '/path', 'invalid');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
