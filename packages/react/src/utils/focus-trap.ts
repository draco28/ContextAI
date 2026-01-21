/**
 * Focus management utilities for accessible modal dialogs and overlays.
 *
 * Focus trapping ensures keyboard users don't accidentally navigate
 * outside a modal dialog while it's open.
 */

import { useEffect, useRef, type RefObject } from 'react';
import { A11Y_KEYS } from './a11y.js';

/**
 * Selector for all focusable elements.
 * Covers buttons, links, inputs, and elements with explicit tabIndex.
 */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Get all focusable elements within a container.
 *
 * @param container - The container element to search within
 * @returns Array of focusable HTMLElements
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

/**
 * Hook that traps focus within a container element.
 *
 * When enabled, Tab and Shift+Tab cycle through focusable elements
 * within the container, preventing focus from escaping.
 *
 * @param containerRef - Ref to the container element
 * @param enabled - Whether the trap is active (default: true)
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   // Only trap focus when modal is open
 *   useFocusTrap(containerRef, isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       {children}
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useFocusTrap = (containerRef: RefObject<HTMLElement | null>, enabled = true): void => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== A11Y_KEYS.TAB) return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      // Shift+Tab on first element → go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element → go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
};

/**
 * Hook that saves and restores focus when a component mounts/unmounts.
 *
 * Useful for modals: saves focus on open, restores to original element on close.
 * This maintains the user's context after interacting with a modal.
 *
 * @param enabled - Whether to manage focus (typically tied to modal open state)
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, children }) {
 *   useFocusReturn(isOpen);
 *
 *   if (!isOpen) return null;
 *   return <div role="dialog">{children}</div>;
 * }
 * ```
 */
export const useFocusReturn = (enabled: boolean): void => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (enabled) {
      // Save current focus when enabled
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      // Restore focus when disabled
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [enabled]);

  // Restore focus on unmount if still enabled
  useEffect(() => {
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
};

/**
 * Hook that auto-focuses an element on mount.
 *
 * Useful for focusing the first interactive element in a modal
 * or the main content after navigation.
 *
 * @param elementRef - Ref to the element to focus
 * @param enabled - Whether to auto-focus (default: true)
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const closeButtonRef = useRef<HTMLButtonElement>(null);
 *   useAutoFocus(closeButtonRef, isOpen);
 *
 *   return (
 *     <div role="dialog">
 *       <button ref={closeButtonRef}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAutoFocus = (elementRef: RefObject<HTMLElement | null>, enabled = true): void => {
  useEffect(() => {
    if (enabled && elementRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        elementRef.current?.focus();
      });
    }
  }, [elementRef, enabled]);
};
