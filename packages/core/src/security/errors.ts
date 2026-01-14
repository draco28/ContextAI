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
