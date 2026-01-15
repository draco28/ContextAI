import { ContextAIError } from '../errors';

/**
 * SQL safety errors
 *
 * Thrown when:
 * - Invalid SQL identifier detected (injection attempt)
 * - Query builder used incorrectly
 * - Unsafe input detected during validation
 */
export class SQLSafetyError extends ContextAIError {
  /** The unsafe input that triggered this error */
  readonly unsafeInput?: string;

  constructor(message: string, unsafeInput?: string) {
    super(message, 'SQL_SAFETY_ERROR');
    this.name = 'SQLSafetyError';
    this.unsafeInput = unsafeInput;
  }
}

/**
 * Path traversal/security errors
 *
 * Thrown when:
 * - Path contains traversal sequences (../)
 * - Path resolves outside allowed directories
 * - Symlink points outside allowed directories
 * - Path exceeds maximum length
 * - Path contains null bytes or invalid characters
 */
export class PathTraversalError extends ContextAIError {
  /** The unsafe path that triggered this error */
  readonly unsafePath: string;
  /** Reason the path was blocked */
  readonly blockedReason:
    | 'traversal'
    | 'symlink'
    | 'outside_allowed'
    | 'too_long'
    | 'null_byte'
    | 'invalid';

  constructor(
    message: string,
    unsafePath: string,
    blockedReason: PathTraversalError['blockedReason']
  ) {
    super(message, 'PATH_TRAVERSAL_ERROR');
    this.name = 'PathTraversalError';
    this.unsafePath = unsafePath;
    this.blockedReason = blockedReason;
  }
}
