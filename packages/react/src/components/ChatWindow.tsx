/**
 * ChatWindow - Headless container component
 *
 * Composes MessageList and MessageInput with optional customization.
 * Supports render props for full control over sub-components.
 */

import type { ReactNode } from 'react';
import type { Message } from '../types.js';
import { MessageList, type MessageListProps } from './MessageList.js';
import { MessageInput, type MessageInputProps } from './MessageInput.js';

/**
 * Props for ChatWindow component
 */
export interface ChatWindowProps {
  /** Messages to display */
  messages: Message[];
  /** Currently streaming content (partial response) */
  streamingContent?: string;
  /** Loading state (e.g., waiting for response) */
  isLoading?: boolean;
  /** Error to display */
  error?: Error | null;
  /** Called when user sends a message */
  onSend: (content: string) => void;
  /** Custom render for message list */
  renderMessages?: (props: MessageListProps) => ReactNode;
  /** Custom render for input */
  renderInput?: (props: MessageInputProps) => ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Children (alternative to render props) */
  children?: ReactNode;
  /** Custom data attributes */
  'data-testid'?: string;
  /** Accessible label for the chat window (default: "Chat conversation") */
  'aria-label'?: string;
  /** Custom loading message for screen readers (default: "Assistant is thinking...") */
  loadingMessage?: string;
}

/**
 * Headless chat window container
 *
 * @example Basic usage
 * ```tsx
 * <ChatWindow
 *   messages={messages}
 *   onSend={handleSend}
 * />
 * ```
 *
 * @example With streaming and loading
 * ```tsx
 * <ChatWindow
 *   messages={messages}
 *   streamingContent={streaming}
 *   isLoading={isLoading}
 *   onSend={handleSend}
 * />
 * ```
 *
 * @example With error handling
 * ```tsx
 * <ChatWindow
 *   messages={messages}
 *   error={error}
 *   onSend={handleSend}
 * />
 * ```
 *
 * @example Custom rendering
 * ```tsx
 * <ChatWindow
 *   messages={messages}
 *   onSend={handleSend}
 *   renderMessages={(props) => (
 *     <div className="custom-messages">
 *       <MessageList {...props} renderMessage={customRenderer} />
 *     </div>
 *   )}
 *   renderInput={(props) => (
 *     <div className="custom-input">
 *       <MessageInput {...props} placeholder="Ask anything..." />
 *     </div>
 *   )}
 * />
 * ```
 *
 * @example With children (fully custom layout)
 * ```tsx
 * <ChatWindow messages={messages} onSend={handleSend}>
 *   <header>My Chat</header>
 *   <MessageList messages={messages} />
 *   <MessageInput onSubmit={handleSend} />
 * </ChatWindow>
 * ```
 */
export function ChatWindow({
  messages,
  streamingContent,
  isLoading = false,
  error,
  onSend,
  renderMessages,
  renderInput,
  className,
  children,
  'data-testid': dataTestId,
  'aria-label': ariaLabel = 'Chat conversation',
  loadingMessage = 'Assistant is thinking...',
}: ChatWindowProps) {
  // Props for MessageList
  const messageListProps: MessageListProps = {
    messages,
    streamingContent,
    'data-testid': dataTestId ? `${dataTestId}-messages` : undefined,
  };

  // Props for MessageInput
  const messageInputProps: MessageInputProps = {
    onSubmit: onSend,
    isDisabled: isLoading,
    'data-testid': dataTestId ? `${dataTestId}-input` : undefined,
  };

  // If children are provided, use them for fully custom layout
  if (children) {
    return (
      <section
        className={className}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-busy={isLoading}
      >
        {children}
      </section>
    );
  }

  return (
    <section
      className={className}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      {/* Error display - assertive live region for critical feedback */}
      {error && (
        <div
          data-testid={dataTestId ? `${dataTestId}-error` : 'chat-error'}
          role="alert"
          aria-live="assertive"
        >
          {error.message}
        </div>
      )}

      {/* Message list - use custom render or default */}
      {renderMessages ? (
        renderMessages(messageListProps)
      ) : (
        <MessageList {...messageListProps} />
      )}

      {/* Loading indicator - polite status for non-critical updates */}
      {isLoading && !streamingContent && (
        <div
          data-testid={dataTestId ? `${dataTestId}-loading` : 'chat-loading'}
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">{loadingMessage}</span>
          <span aria-hidden="true">Loading...</span>
        </div>
      )}

      {/* Input - use custom render or default */}
      {renderInput ? (
        renderInput(messageInputProps)
      ) : (
        <MessageInput {...messageInputProps} />
      )}
    </section>
  );
}
