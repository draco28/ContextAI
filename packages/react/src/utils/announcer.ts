/**
 * Screen reader announcement utilities for dynamic content updates.
 *
 * ARIA live regions allow screen readers to announce changes without
 * requiring focus to move to the changed element.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { LiveRegionPoliteness } from './a11y.js';

/** ID for the global announcer element */
const ANNOUNCER_ID = 'contextai-sr-announcer';

/** Default delay before clearing announcements (ms) */
const DEFAULT_CLEAR_DELAY = 1000;

/**
 * Creates or retrieves the global screen reader announcer element.
 *
 * The announcer is a visually hidden live region that screen readers
 * monitor for changes.
 */
const getOrCreateAnnouncer = (): HTMLElement => {
  let announcer = document.getElementById(ANNOUNCER_ID);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = ANNOUNCER_ID;
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    // Visually hidden but accessible to screen readers
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  return announcer;
};

/**
 * Options for the useAnnouncer hook
 */
export interface UseAnnouncerOptions {
  /**
   * Default politeness level for announcements.
   * - 'polite': Waits for user to finish current task (default)
   * - 'assertive': Interrupts immediately (use sparingly)
   */
  defaultPoliteness?: LiveRegionPoliteness;
  /**
   * Delay in ms before clearing the announcement.
   * Clearing prevents repeated announcements on re-renders.
   * @default 1000
   */
  clearDelay?: number;
}

/**
 * Return type for useAnnouncer hook
 */
export interface UseAnnouncerReturn {
  /**
   * Announce a message to screen readers.
   *
   * @param message - The text to announce
   * @param politeness - Override the default politeness level
   */
  announce: (message: string, politeness?: LiveRegionPoliteness) => void;
  /**
   * Clear any pending announcement immediately.
   */
  clear: () => void;
}

/**
 * Hook for announcing dynamic content changes to screen readers.
 *
 * Creates a global live region that screen readers monitor. When you call
 * `announce()`, the message is injected into this region, causing screen
 * readers to speak it.
 *
 * @param options - Configuration options
 * @returns Object with announce and clear functions
 *
 * @example
 * ```tsx
 * function ChatWindow() {
 *   const { announce } = useAnnouncer();
 *   const [messages, setMessages] = useState([]);
 *
 *   const handleNewMessage = (message) => {
 *     setMessages(prev => [...prev, message]);
 *     // Announce to screen readers
 *     announce(`New message from ${message.role}: ${message.content.slice(0, 100)}`);
 *   };
 *
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // For critical errors, use assertive
 * function ErrorBoundary() {
 *   const { announce } = useAnnouncer({ defaultPoliteness: 'assertive' });
 *
 *   useEffect(() => {
 *     if (error) {
 *       announce(`Error: ${error.message}`);
 *     }
 *   }, [error]);
 * }
 * ```
 */
export const useAnnouncer = (options: UseAnnouncerOptions = {}): UseAnnouncerReturn => {
  const { defaultPoliteness = 'polite', clearDelay = DEFAULT_CLEAR_DELAY } = options;

  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    const announcer = document.getElementById(ANNOUNCER_ID);
    if (announcer) {
      announcer.textContent = '';
    }
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, []);

  const announce = useCallback(
    (message: string, politeness: LiveRegionPoliteness = defaultPoliteness) => {
      const announcer = getOrCreateAnnouncer();

      // Clear any pending clear timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      // Set politeness level
      announcer.setAttribute('aria-live', politeness);

      // Clear and set content (clearing ensures re-announcement of same text)
      announcer.textContent = '';

      // Use requestAnimationFrame to ensure the clear is processed first
      requestAnimationFrame(() => {
        announcer.textContent = message;

        // Schedule clearing the announcement
        clearTimeoutRef.current = setTimeout(() => {
          announcer.textContent = '';
          clearTimeoutRef.current = null;
        }, clearDelay);
      });
    },
    [defaultPoliteness, clearDelay],
  );

  return { announce, clear };
};

/**
 * Standalone function to make a one-off announcement.
 * Prefer useAnnouncer hook in React components for better lifecycle management.
 *
 * @param message - The text to announce
 * @param politeness - Politeness level (default: 'polite')
 *
 * @example
 * ```ts
 * // In a non-React context or event handler
 * announceToScreenReader('File uploaded successfully');
 * ```
 */
export const announceToScreenReader = (
  message: string,
  politeness: LiveRegionPoliteness = 'polite',
): void => {
  const announcer = getOrCreateAnnouncer();
  announcer.setAttribute('aria-live', politeness);
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = '';
    }, DEFAULT_CLEAR_DELAY);
  });
};
