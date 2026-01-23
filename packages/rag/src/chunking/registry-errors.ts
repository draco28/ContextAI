/**
 * Registry Errors
 *
 * Errors thrown during registry operations like registering,
 * unregistering, or looking up chunkers.
 */

import { ContextAIError } from '@contextaisdk/core';

// ============================================================================
// Types
// ============================================================================

/**
 * Error codes for registry operations.
 */
export type RegistryErrorCode = 'ALREADY_REGISTERED' | 'NOT_FOUND';

// ============================================================================
// RegistryError Class
// ============================================================================

/**
 * Error thrown when registry operations fail.
 *
 * Common scenarios:
 * - Registering an item with a name that's already taken
 * - Looking up an item that doesn't exist
 *
 * @example
 * ```typescript
 * // Duplicate registration
 * registry.register(chunker);
 * registry.register(chunker); // throws RegistryError.alreadyRegistered(chunker.name)
 *
 * // Item not found
 * registry.get('unknown'); // throws RegistryError.notFound('unknown', availableNames)
 * ```
 */
export class RegistryError extends ContextAIError {
  override readonly code: RegistryErrorCode;

  /** Name of the item that caused the error */
  readonly itemName: string;

  /** Available items in the registry (for NOT_FOUND errors) */
  readonly availableItems?: string[];

  constructor(
    message: string,
    code: RegistryErrorCode,
    itemName: string,
    availableItems?: string[]
  ) {
    super(message, `REGISTRY_${code}`, { severity: 'error' });
    this.name = 'RegistryError';
    this.code = code;
    this.itemName = itemName;
    this.availableItems = availableItems;
  }

  /**
   * Provide actionable troubleshooting hints for registry errors.
   */
  override get troubleshootingHint(): string | null {
    switch (this.code) {
      case 'ALREADY_REGISTERED':
        return (
          `"${this.itemName}" is already registered. ` +
          `Call unregister("${this.itemName}") first if you want to replace it.`
        );

      case 'NOT_FOUND':
        if (this.availableItems && this.availableItems.length > 0) {
          return (
            `"${this.itemName}" not found in registry. ` +
            `Available items: ${this.availableItems.join(', ')}`
          );
        }
        return (
          `"${this.itemName}" not found in registry. ` +
          `No items are currently registered.`
        );

      default:
        return null;
    }
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create an error for duplicate registration.
   *
   * @param name - Name of the item that's already registered
   *
   * @example
   * ```typescript
   * if (this.items.has(item.name)) {
   *   throw RegistryError.alreadyRegistered(item.name);
   * }
   * ```
   */
  static alreadyRegistered(name: string): RegistryError {
    return new RegistryError(
      `"${name}" is already registered. Use unregister() first to replace it.`,
      'ALREADY_REGISTERED',
      name
    );
  }

  /**
   * Create an error for item not found.
   *
   * @param name - Name of the item that wasn't found
   * @param available - List of available item names (for helpful error message)
   *
   * @example
   * ```typescript
   * const item = this.items.get(name);
   * if (!item) {
   *   throw RegistryError.notFound(name, Array.from(this.items.keys()));
   * }
   * ```
   */
  static notFound(name: string, available: string[]): RegistryError {
    const availableStr = available.length > 0
      ? `Available: ${available.join(', ')}`
      : 'No items registered';

    return new RegistryError(
      `"${name}" not found. ${availableStr}`,
      'NOT_FOUND',
      name,
      available
    );
  }
}
