/**
 * Types for @contextai/react components
 */

/**
 * Message role - subset of @contextai/core MessageRole for UI purposes
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
