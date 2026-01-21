/**
 * MessageList - Headless message display component
 *
 * Renders a list of messages with optional streaming content.
 * Supports custom message rendering via render prop.
 */

import type { ReactNode } from 'react';
import type { Message } from '../types.js';

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  /** Messages to display */
  messages: Message[];
  /** Currently streaming content (partial assistant response) */
  streamingContent?: string;
  /** Custom render function for each message */
  renderMessage?: (message: Message, index: number) => ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Custom data attributes */
  'data-testid'?: string;
  /** Accessible label for the message list (default: "Chat messages") */
  'aria-label'?: string;
}

/**
 * Default message renderer
 * Simple unstyled rendering - consumers typically override this
 */
function DefaultMessage({ message, index }: { message: Message; index: number }) {
  return (
    <li
      key={message.id ?? index}
      aria-label={`${message.role} message`}
      data-role={message.role}
      data-testid={`message-${index}`}
    >
      <span data-testid={`message-${index}-role`}>{message.role}</span>
      <span data-testid={`message-${index}-content`}>{message.content}</span>
    </li>
  );
}

/**
 * Headless message list component
 *
 * Uses a wrapper pattern for accessibility:
 * - Outer div has role="log" for live region announcements
 * - Inner ul provides list semantics for li children
 *
 * @example Basic usage
 * ```tsx
 * <MessageList messages={messages} />
 * ```
 *
 * @example With streaming
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   streamingContent={streamingText}
 * />
 * ```
 *
 * @example Custom rendering
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   renderMessage={(msg, i) => (
 *     <div className={msg.role === 'user' ? 'user-msg' : 'assistant-msg'}>
 *       {msg.content}
 *     </div>
 *   )}
 * />
 * ```
 */
export function MessageList({
  messages,
  streamingContent,
  renderMessage,
  className,
  'data-testid': dataTestId,
  'aria-label': ariaLabel = 'Chat messages',
}: MessageListProps) {
  const isStreaming = Boolean(streamingContent);

  return (
    // Wrapper div provides live region semantics without breaking list structure
    <div
      role="log"
      aria-live="polite"
      aria-label={ariaLabel}
      aria-busy={isStreaming}
      className={className}
      data-testid={dataTestId}
    >
      {/* Inner ul provides proper list semantics for li children */}
      <ul>
        {messages.map((message, index) =>
          renderMessage ? (
            // Custom render - wrap in li for semantic list structure
            <li key={message.id ?? index} aria-label={`${message.role} message`}>
              {renderMessage(message, index)}
            </li>
          ) : (
            <DefaultMessage key={message.id ?? index} message={message} index={index} />
          )
        )}

        {/* Show streaming content as a partial assistant message */}
        {streamingContent && (
          <li
            aria-label="assistant message, streaming"
            data-role="assistant"
            data-streaming="true"
            data-testid="streaming-message"
          >
            <span data-testid="streaming-role">assistant</span>
            <span data-testid="streaming-content">{streamingContent}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
