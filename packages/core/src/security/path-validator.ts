/**
 * Path Traversal Prevention Utilities
 *
 * Provides secure path validation to prevent directory traversal attacks.
 * Used by document loaders and any file-handling operations.
 *
 * @example
 * const validator = new PathValidator({
 *   allowedDirectories: ['/app/uploads', '/app/public'],
 * });
 *
 * const result = await validator.validate(userProvidedPath);
 * if (!result.valid) {
 *   throw new PathTraversalError(result.error!, userProvidedPath, result.blockedReason!);
 * }
 *
 * @module
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { PathTraversalError } from './errors';

// ============================================================================
// Types
// ============================================================================

/** Reason a path was blocked */
export type BlockedReason =
  | 'traversal'
  | 'symlink'
  | 'outside_allowed'
  | 'too_long'
  | 'null_byte'
  | 'invalid';

/** Configuration options for path validation */
export interface PathValidatorOptions {
  /** Whitelist of allowed base directories (must be absolute paths) */
  allowedDirectories: string[];
  /** Whether to follow and validate symlinks (default: false) */
  followSymlinks?: boolean;
  /** Maximum allowed path length (default: 4096) */
  maxPathLength?: number;
}

/** Result of path validation */
export interface ValidationResult {
  /** Whether the path is valid and safe */
  valid: boolean;
  /** The normalized, resolved path (only if valid) */
  normalizedPath?: string;
  /** Human-readable error message (only if invalid) */
  error?: string;
  /** Machine-readable reason for blocking (only if invalid) */
  blockedReason?: BlockedReason;
}

// ============================================================================
// Constants
// ============================================================================

/** Default maximum path length (Linux PATH_MAX) */
const DEFAULT_MAX_PATH_LENGTH = 4096;

// ============================================================================
// PathValidator Class
// ============================================================================

/**
 * Validates file paths to prevent directory traversal attacks.
 *
 * This class enforces path safety by:
 * 1. Blocking ".." traversal sequences
 * 2. Resolving symlinks (optional) and verifying targets
 * 3. Ensuring paths stay within allowed directories
 * 4. Checking path length limits
 * 5. Detecting null bytes and other attack vectors
 *
 * @example
 * const validator = new PathValidator({
 *   allowedDirectories: ['/app/uploads', '/app/public'],
 *   followSymlinks: true,
 *   maxPathLength: 1024,
 * });
 *
 * const result = await validator.validate('/app/uploads/user-file.txt');
 * if (result.valid) {
 *   // Safe to use result.normalizedPath
 * }
 */
export class PathValidator {
  private readonly allowedDirectories: string[];
  private readonly followSymlinks: boolean;
  private readonly maxPathLength: number;

  constructor(options: PathValidatorOptions) {
    if (
      !options.allowedDirectories ||
      options.allowedDirectories.length === 0
    ) {
      throw new PathTraversalError(
        'At least one allowed directory must be specified',
        '',
        'invalid'
      );
    }

    // Normalize all allowed directories to absolute paths with trailing separator
    this.allowedDirectories = options.allowedDirectories.map((dir) => {
      const normalized = path.resolve(dir);
      return normalized.endsWith(path.sep) ? normalized : normalized + path.sep;
    });

    this.followSymlinks = options.followSymlinks ?? false;
    this.maxPathLength = options.maxPathLength ?? DEFAULT_MAX_PATH_LENGTH;
  }

  /**
   * Normalize a path without validation.
   * Resolves to absolute and removes redundant segments.
   */
  normalize = (inputPath: string): string => {
    // Unicode normalization for consistent comparison
    const normalized = inputPath.normalize('NFC');
    return path.resolve(normalized);
  };

  /**
   * Quick sync check if path MIGHT be allowed (no symlink resolution).
   * Use validate() for complete validation including symlinks.
   */
  isAllowed = (inputPath: string): boolean => {
    try {
      const result = this.validateSync(inputPath);
      return result.valid;
    } catch {
      return false;
    }
  };

  /**
   * Get the allowed base directory that contains this path, or null.
   */
  getBasePath = (inputPath: string): string | null => {
    const normalized = this.normalize(inputPath);
    const normalizedWithSep = normalized + path.sep;

    for (const allowedDir of this.allowedDirectories) {
      if (
        normalizedWithSep.startsWith(allowedDir) ||
        normalized + path.sep === allowedDir
      ) {
        // Return without trailing separator
        return allowedDir.slice(0, -1);
      }
    }
    return null;
  };

  /**
   * Synchronous validation (no symlink resolution).
   * Use this for fast checks when symlink verification isn't needed.
   */
  validateSync = (inputPath: string): ValidationResult => {
    // Type check
    if (typeof inputPath !== 'string') {
      return {
        valid: false,
        error: 'Path must be a string',
        blockedReason: 'invalid',
      };
    }

    // Empty check
    if (!inputPath || inputPath.trim() === '') {
      return {
        valid: false,
        error: 'Path cannot be empty',
        blockedReason: 'invalid',
      };
    }

    // Null byte check (common attack vector)
    if (inputPath.includes('\0')) {
      return {
        valid: false,
        error: 'Path contains null byte',
        blockedReason: 'null_byte',
      };
    }

    // Length check (before normalization to catch attacks)
    if (inputPath.length > this.maxPathLength) {
      return {
        valid: false,
        error: `Path exceeds maximum length of ${this.maxPathLength}`,
        blockedReason: 'too_long',
      };
    }

    // Check for traversal BEFORE normalization (catch attempted attacks)
    if (this.containsTraversal(inputPath)) {
      return {
        valid: false,
        error: 'Path contains directory traversal sequence',
        blockedReason: 'traversal',
      };
    }

    // Normalize and resolve
    const normalized = this.normalize(inputPath);

    // Length check after normalization
    if (normalized.length > this.maxPathLength) {
      return {
        valid: false,
        error: `Resolved path exceeds maximum length of ${this.maxPathLength}`,
        blockedReason: 'too_long',
      };
    }

    // Check if within allowed directories
    if (!this.isWithinAllowed(normalized)) {
      return {
        valid: false,
        error: 'Path is outside allowed directories',
        blockedReason: 'outside_allowed',
      };
    }

    return {
      valid: true,
      normalizedPath: normalized,
    };
  };

  /**
   * Full async validation including symlink resolution.
   */
  validate = async (inputPath: string): Promise<ValidationResult> => {
    // First do sync validation
    const syncResult = this.validateSync(inputPath);
    if (!syncResult.valid) {
      return syncResult;
    }

    // If symlink following is disabled, we're done
    if (!this.followSymlinks) {
      return syncResult;
    }

    // Resolve symlinks and validate the real path
    try {
      const realPath = await fs.realpath(syncResult.normalizedPath!);

      // Check if the real path is within allowed directories
      if (!this.isWithinAllowed(realPath)) {
        return {
          valid: false,
          error: 'Symlink target is outside allowed directories',
          blockedReason: 'symlink',
        };
      }

      return {
        valid: true,
        normalizedPath: realPath,
      };
    } catch (error) {
      // File doesn't exist yet - that's OK for write operations
      // Return the normalized path (sync validation already passed)
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return syncResult;
      }

      // Other errors (permission denied, etc.)
      return {
        valid: false,
        error: `Failed to resolve path: ${(error as Error).message}`,
        blockedReason: 'invalid',
      };
    }
  };

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  private containsTraversal(inputPath: string): boolean {
    // Check for .. in path segments (both / and \ separators)
    const segments = inputPath.split(/[/\\]/);
    return segments.some((segment) => segment === '..');
  }

  private isWithinAllowed(normalizedPath: string): boolean {
    const pathWithSep = normalizedPath + path.sep;
    return this.allowedDirectories.some(
      (allowedDir) =>
        pathWithSep.startsWith(allowedDir) ||
        normalizedPath + path.sep === allowedDir
    );
  }
}

// ============================================================================
// Standalone Functions
// ============================================================================

/**
 * Validate a path against the given options.
 * Convenience function for one-off validation.
 *
 * @example
 * const result = await validatePath('/uploads/file.txt', {
 *   allowedDirectories: ['/uploads'],
 * });
 */
export async function validatePath(
  inputPath: string,
  options: PathValidatorOptions
): Promise<ValidationResult> {
  const validator = new PathValidator(options);
  return validator.validate(inputPath);
}

/**
 * Synchronous path validation (no symlink resolution).
 * Convenience function for one-off validation.
 */
export function validatePathSync(
  inputPath: string,
  options: PathValidatorOptions
): ValidationResult {
  const validator = new PathValidator(options);
  return validator.validateSync(inputPath);
}
