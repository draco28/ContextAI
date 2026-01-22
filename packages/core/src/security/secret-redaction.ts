/**
 * Secret Redaction Utilities
 *
 * Provides comprehensive secret redaction to ensure the SDK never logs sensitive
 * information including API keys, authorization headers, user credentials, or PII.
 *
 * Implements NFR-301: SDK shall never log API keys, Authorization headers,
 * User credentials, or PII from documents.
 *
 * @example
 * ```typescript
 * import { redactObject, createSafeLogger, consoleLogger } from '@contextai/core';
 *
 * // Redact secrets from an object
 * const result = redactObject({
 *   password: 'secret123',
 *   apiKey: 'sk-1234567890abcdef',
 * });
 * // result.data = { password: '[REDACTED]', apiKey: '[REDACTED]' }
 *
 * // Create a safe logger that auto-redacts
 * const logger = createSafeLogger(consoleLogger);
 * logger.info('User login', { password: 'secret' });
 * // Logs: "User login" { password: '[REDACTED]' }
 * ```
 */

import type { Logger } from '../agent/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Pattern for detecting secrets.
 *
 * Can match against key names, values, or both.
 */
export interface SecretPattern {
  /** Unique name for this pattern (for debugging/logging) */
  name: string;

  /** Match against key names (case-insensitive by default) */
  keyPattern?: RegExp;

  /** Match against values */
  valuePattern?: RegExp;

  /** If true, BOTH key AND value must match. If false (default), either matches */
  requireBoth?: boolean;
}

/**
 * Configuration for secret redaction behavior.
 */
export interface RedactionConfig {
  /** Replacement string for redacted values (default: '[REDACTED]') */
  replacement?: string;

  /** Custom patterns to detect as secrets (in addition to built-in patterns) */
  customPatterns?: SecretPattern[];

  /** Additional keys to always redact regardless of value (case-insensitive) */
  sensitiveKeys?: string[];

  /** Keys to never redact (case-insensitive, useful for allowing specific fields) */
  allowedKeys?: string[];

  /** Maximum object depth for recursive redaction (default: 10) */
  maxDepth?: number;

  /** Whether to redact values that look like secrets even without key hints (default: true) */
  redactByValue?: boolean;

  /** Minimum length for value-based detection (default: 8) */
  minSecretLength?: number;
}

/**
 * Result of a redaction operation.
 */
export interface RedactionResult<T> {
  /** The redacted data (same structure as input) */
  data: T;

  /** Number of values that were redacted */
  redactedCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default replacement string */
const DEFAULT_REPLACEMENT = '[REDACTED]';

/** Marker for circular references */
const CIRCULAR_MARKER = '[CIRCULAR]';

/** Default maximum recursion depth */
const DEFAULT_MAX_DEPTH = 10;

/** Default minimum length for value-based secret detection */
const DEFAULT_MIN_SECRET_LENGTH = 8;

/**
 * Built-in patterns for detecting secrets by KEY name.
 * These match common sensitive field names regardless of value.
 */
const SENSITIVE_KEY_PATTERNS: SecretPattern[] = [
  // Passwords
  { name: 'password', keyPattern: /^(password|passwd|pwd)$/i },

  // Secrets
  { name: 'secret', keyPattern: /^(secret|client[_-]?secret|app[_-]?secret)$/i },

  // Tokens
  {
    name: 'token',
    keyPattern: /^(token|access[_-]?token|refresh[_-]?token|auth[_-]?token|id[_-]?token)$/i,
  },

  // API keys
  { name: 'api_key', keyPattern: /^(api[_-]?key|apikey|api[_-]?secret)$/i },

  // Authorization
  { name: 'authorization', keyPattern: /^(authorization|auth|bearer)$/i },

  // Private keys
  { name: 'private_key', keyPattern: /^(private[_-]?key|privatekey|signing[_-]?key)$/i },

  // Connection strings
  {
    name: 'connection_string',
    keyPattern: /^(connection[_-]?string|conn[_-]?str|database[_-]?url|db[_-]?url)$/i,
  },

  // Credentials
  { name: 'credentials', keyPattern: /^(credentials?|creds?)$/i },

  // Headers that commonly contain secrets
  { name: 'x_api_key', keyPattern: /^x[_-]api[_-]key$/i },
];

/**
 * Built-in patterns for detecting secrets by VALUE.
 * These match values that look like secrets regardless of their key name.
 */
const SENSITIVE_VALUE_PATTERNS: SecretPattern[] = [
  // API key prefixes (OpenAI sk-, Stripe sk_live_, pk_test_, etc.)
  // Allow alphanumeric and underscore after the prefix, minimum 16 chars total
  { name: 'sk_prefix', valuePattern: /^sk[_-][a-zA-Z0-9_-]{16,}/ },
  { name: 'pk_prefix', valuePattern: /^pk[_-][a-zA-Z0-9_-]{16,}/ },
  { name: 'ak_prefix', valuePattern: /^ak[_-][a-zA-Z0-9_-]{16,}/ },

  // Anthropic keys (sk-ant-api...)
  { name: 'sk_ant_prefix', valuePattern: /^sk-ant-[a-zA-Z0-9_-]{10,}/ },

  // Bearer tokens in values
  { name: 'bearer_token', valuePattern: /^Bearer\s+[a-zA-Z0-9\-_.]+/i },

  // Connection strings with credentials (user:pass@host pattern)
  { name: 'mongodb_uri', valuePattern: /^mongodb(\+srv)?:\/\/[^:]+:[^@]+@/ },
  { name: 'postgres_uri', valuePattern: /^postgres(ql)?:\/\/[^:]+:[^@]+@/ },
  { name: 'mysql_uri', valuePattern: /^mysql:\/\/[^:]+:[^@]+@/ },
  { name: 'redis_uri', valuePattern: /^rediss?:\/\/[^:]+:[^@]+@/ },

  // AWS-style credentials
  { name: 'aws_access_key', valuePattern: /^AKIA[A-Z0-9]{16}$/ },

  // JWT tokens (three base64url segments separated by dots)
  {
    name: 'jwt',
    valuePattern: /^eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/,
  },

  // Generic long hex/base64 strings that look like keys (40+ chars)
  { name: 'long_hex', valuePattern: /^[a-fA-F0-9]{40,}$/ },
];

// ============================================================================
// Internal State
// ============================================================================

/**
 * Internal state for tracking redaction traversal.
 */
interface RedactionState {
  depth: number;
  seen: WeakSet<object>;
  redactedCount: number;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if a key matches any sensitive key pattern.
 *
 * @param key - The key name to check
 * @param config - Optional redaction configuration
 * @returns true if the key should be redacted
 *
 * @example
 * ```typescript
 * isSecretKey('password');     // true
 * isSecretKey('api_key');      // true
 * isSecretKey('username');     // false
 * isSecretKey('myCustomKey', { sensitiveKeys: ['myCustomKey'] }); // true
 * ```
 */
export const isSecretKey = (key: string, config?: RedactionConfig): boolean => {
  const normalizedKey = key.toLowerCase();

  // Check allowedKeys first (bypass redaction)
  if (config?.allowedKeys?.some((k) => k.toLowerCase() === normalizedKey)) {
    return false;
  }

  // Check user-provided sensitiveKeys
  if (config?.sensitiveKeys?.some((k) => k.toLowerCase() === normalizedKey)) {
    return true;
  }

  // Check custom patterns (key patterns only)
  if (config?.customPatterns?.some((p) => p.keyPattern?.test(key))) {
    return true;
  }

  // Check built-in key patterns
  return SENSITIVE_KEY_PATTERNS.some((p) => p.keyPattern?.test(key));
};

/**
 * Check if a value looks like a secret.
 *
 * @param value - The string value to check
 * @param config - Optional redaction configuration
 * @returns true if the value appears to be a secret
 *
 * @example
 * ```typescript
 * isSecretValue('sk-1234567890abcdef1234567890');  // true (OpenAI key pattern)
 * isSecretValue('Bearer eyJhbGciOiJIUzI1NiJ9...'); // true (Bearer token)
 * isSecretValue('hello world');                    // false
 * ```
 */
export const isSecretValue = (value: string, config?: RedactionConfig): boolean => {
  const minLength = config?.minSecretLength ?? DEFAULT_MIN_SECRET_LENGTH;

  // Skip short strings - unlikely to be secrets
  if (value.length < minLength) {
    return false;
  }

  // Check custom patterns (value patterns only)
  if (config?.customPatterns?.some((p) => p.valuePattern?.test(value))) {
    return true;
  }

  // Check built-in value patterns
  return SENSITIVE_VALUE_PATTERNS.some((p) => p.valuePattern?.test(value));
};

/**
 * Redact secrets from a string value.
 *
 * Checks if the entire string matches a known secret pattern and replaces it
 * with the redaction placeholder.
 *
 * @param input - The string to check and potentially redact
 * @param config - Optional redaction configuration
 * @returns The redacted string, or original if no secret detected
 *
 * @example
 * ```typescript
 * redactSecrets('sk-1234567890abcdef'); // '[REDACTED]'
 * redactSecrets('Bearer token123');     // '[REDACTED]'
 * redactSecrets('hello world');         // 'hello world'
 * redactSecrets('sk-secret', { replacement: '***' }); // '***'
 * ```
 */
export const redactSecrets = (input: string, config?: RedactionConfig): string => {
  const replacement = config?.replacement ?? DEFAULT_REPLACEMENT;
  const shouldRedactByValue = config?.redactByValue ?? true;

  if (shouldRedactByValue && isSecretValue(input, config)) {
    return replacement;
  }

  return input;
};

/**
 * Recursively redact secrets from an object.
 *
 * Traverses the object tree, redacting values based on:
 * 1. Key names that match sensitive patterns (password, api_key, etc.)
 * 2. Values that look like secrets (API keys, tokens, connection strings)
 *
 * Handles circular references and deeply nested objects safely.
 *
 * @param obj - The object to redact (can be any type)
 * @param config - Optional redaction configuration
 * @returns Result with redacted data and count of redactions
 *
 * @example
 * ```typescript
 * const result = redactObject({
 *   username: 'john',
 *   password: 'secret123',
 *   settings: { apiKey: 'sk-abc123...' }
 * });
 *
 * // result.data = {
 * //   username: 'john',
 * //   password: '[REDACTED]',
 * //   settings: { apiKey: '[REDACTED]' }
 * // }
 * // result.redactedCount = 2
 * ```
 */
export const redactObject = <T>(obj: T, config?: RedactionConfig): RedactionResult<T> => {
  const state: RedactionState = {
    depth: 0,
    seen: new WeakSet(),
    redactedCount: 0,
  };

  const data = redactObjectInternal(obj, config ?? {}, state) as T;

  return {
    data,
    redactedCount: state.redactedCount,
  };
};

/**
 * Internal recursive implementation of object redaction.
 *
 * @param depth - Current recursion depth (passed separately to avoid mutating state)
 */
const redactObjectInternal = (
  obj: unknown,
  config: RedactionConfig,
  state: RedactionState,
  depth: number = 0
): unknown => {
  const replacement = config.replacement ?? DEFAULT_REPLACEMENT;
  const maxDepth = config.maxDepth ?? DEFAULT_MAX_DEPTH;
  const shouldRedactByValue = config.redactByValue ?? true;

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    // Check if string value looks like a secret
    if (typeof obj === 'string' && shouldRedactByValue && isSecretValue(obj, config)) {
      state.redactedCount++;
      return replacement;
    }
    return obj;
  }

  // Depth protection - redact entire subtree if too deep
  if (depth >= maxDepth) {
    state.redactedCount++;
    return replacement;
  }

  // Circular reference protection
  if (state.seen.has(obj as object)) {
    return CIRCULAR_MARKER;
  }
  state.seen.add(obj as object);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObjectInternal(item, config, state, depth + 1));
  }

  // Handle plain objects
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if key indicates a secret
    if (isSecretKey(key, config)) {
      result[key] = replacement;
      state.redactedCount++;
    } else {
      // Recursively process value
      result[key] = redactObjectInternal(value, config, state, depth + 1);
    }
  }

  return result;
};

/**
 * Create a logger wrapper that automatically redacts secrets from metadata.
 *
 * Wraps any Logger implementation to filter sensitive data before logging.
 * The message content is NOT redacted (only metadata).
 *
 * @param logger - The underlying logger to wrap
 * @param config - Optional redaction configuration
 * @returns A new Logger that redacts secrets from metadata
 *
 * @example
 * ```typescript
 * import { createSafeLogger, consoleLogger } from '@contextai/core';
 *
 * const safeLogger = createSafeLogger(consoleLogger);
 *
 * // Secrets in metadata are automatically redacted
 * safeLogger.info('User authenticated', {
 *   userId: '123',
 *   token: 'sk-secret-key-here'
 * });
 * // Output: "User authenticated" { userId: '123', token: '[REDACTED]' }
 * ```
 */
export const createSafeLogger = (logger: Logger, config?: RedactionConfig): Logger => {
  const redactMeta = (meta?: Record<string, unknown>): Record<string, unknown> | undefined => {
    if (!meta) return meta;
    return redactObject(meta, config).data;
  };

  return {
    debug: (message, meta) => logger.debug(message, redactMeta(meta)),
    info: (message, meta) => logger.info(message, redactMeta(meta)),
    warn: (message, meta) => logger.warn(message, redactMeta(meta)),
    error: (message, meta) => logger.error(message, redactMeta(meta)),
  };
};
