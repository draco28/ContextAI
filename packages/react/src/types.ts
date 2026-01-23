/**
 * Types for @contextaisdk/react components
 */

/**
 * Message role - subset of @contextaisdk/core MessageRole for UI purposes
 * Excludes 'tool' as it's not typically displayed in chat UI
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message structure for chat components
 * Simplified from ChatMessage for UI rendering
 */
export interface Message {
  /** Unique identifier for React keys */
  id?: string;
  /** Message role */
  role: MessageRole;
  /** Message content (text only for UI) */
  content: string;
}

/**
 * Generate a unique message ID for React keys
 *
 * Uses timestamp + random suffix for uniqueness without external deps
 *
 * @returns A unique message ID string
 *
 * @example
 * ```ts
 * const message: Message = {
 *   id: generateMessageId(),
 *   role: 'user',
 *   content: 'Hello!'
 * };
 * ```
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
