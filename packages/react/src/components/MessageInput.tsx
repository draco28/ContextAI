/**
 * MessageInput - Headless user input component
 *
 * Supports both controlled and uncontrolled modes.
 * No styling - consumers provide their own CSS.
 */

import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

/**
 * Props for MessageInput component
 */
export interface MessageInputProps {
  /** Called when user submits a message */
  onSubmit: (content: string) => void;
  /** Disable input (e.g., while loading) */
  isDisabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value (optional) */
  value?: string;
  /** Change handler for controlled mode */
  onChange?: (value: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Headless message input component
 *
 * @example Uncontrolled mode (simplest)
 * ```tsx
 * <MessageInput
 *   onSubmit={(content) => sendMessage(content)}
 *   placeholder="Type a message..."
 * />
 * ```
 *
 * @example Controlled mode
 * ```tsx
 * const [input, setInput] = useState('');
 * <MessageInput
 *   value={input}
 *   onChange={setInput}
 *   onSubmit={(content) => {
 *     sendMessage(content);
 *     setInput('');
 *   }}
 * />
 * ```
 */
export function MessageInput({
  onSubmit,
  isDisabled = false,
  placeholder = 'Type a message...',
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  'data-testid': dataTestId,
}: MessageInputProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState('');

  // Determine if we're in controlled mode
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (isControlled && controlledOnChange) {
        controlledOnChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [isControlled, controlledOnChange]
  );

  const handleSubmit = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || isDisabled) return;

    onSubmit(trimmedValue);

    // Clear input in uncontrolled mode
    if (!isControlled) {
      setInternalValue('');
    }
  }, [value, isDisabled, onSubmit, isControlled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift for newlines)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className={className} data-testid={dataTestId}>
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        data-testid={dataTestId ? `${dataTestId}-textarea` : undefined}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isDisabled || !value.trim()}
        data-testid={dataTestId ? `${dataTestId}-button` : undefined}
      >
        Send
      </button>
    </div>
  );
}
