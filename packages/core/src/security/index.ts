// Security module exports
export { SQLSafetyError, PathTraversalError } from './errors';
export {
  // Identifier safety
  isValidIdentifier,
  escapeIdentifier,
  // Query builder
  SafeQueryBuilder,
  // Types
  type WhereCondition,
  type WhereOperator,
  type OrderDirection,
  type QueryResult,
} from './sql-safety';

// Path validation
export {
  PathValidator,
  validatePath,
  validatePathSync,
  type PathValidatorOptions,
  type ValidationResult,
  type BlockedReason,
} from './path-validator';

// Secret redaction
export {
  // Core functions
  redactSecrets,
  redactObject,
  createSafeLogger,
  // Utility functions
  isSecretKey,
  isSecretValue,
  // Types
  type RedactionConfig,
  type SecretPattern,
  type RedactionResult,
} from './secret-redaction';
