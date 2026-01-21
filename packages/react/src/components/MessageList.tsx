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
}

/**
 * Default message renderer
 * Simple unstyled rendering - consumers typically override this
 */
function DefaultMessage({ message, index }: { message: Message; index: number }) {
  return (
    <div
      key={message.id ?? index}
      data-role={message.role}
      data-testid={`message-${index}`}
    >
      <span data-testid={`message-${index}-role`}>{message.role}</span>
      <span data-testid={`message-${index}-content`}>{message.content}</span>
    </div>
  );
}

/**
 * Headless message list component
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
}: MessageListProps) {
  return (
    <div className={className} data-testid={dataTestId}>
      {messages.map((message, index) =>
        renderMessage ? (
          // Use fragment with key when using custom render
          <div key={message.id ?? index}>{renderMessage(message, index)}</div>
        ) : (
          <DefaultMessage key={message.id ?? index} message={message} index={index} />
        )
      )}

      {/* Show streaming content as a partial assistant message */}
      {streamingContent && (
        <div data-role="assistant" data-streaming="true" data-testid="streaming-message">
          <span data-testid="streaming-role">assistant</span>
          <span data-testid="streaming-content">{streamingContent}</span>
        </div>
      )}
    </div>
  );
}
