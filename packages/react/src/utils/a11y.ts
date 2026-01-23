/**
 * Core accessibility utilities for @contextaisdk/react
 *
 * These utilities help build accessible UI components following WCAG 2.1 AA standards.
 */

/**
 * CSS for screen-reader-only content.
 * Include this in your stylesheet to hide elements visually while keeping
 * them accessible to screen readers.
 *
 * @example
 * ```css
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   // ... rest of styles
 * }
 * ```
 */
export const srOnlyStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`.trim();

/**
 * Generate a unique ID for ARIA relationships.
 * Uses crypto.randomUUID when available, falls back to timestamp-based ID.
 *
 * @param prefix - Optional prefix for the ID (e.g., 'message', 'step')
 * @returns A unique string ID
 *
 * @example
 * ```tsx
 * const descriptionId = generateA11yId('error');
 * // Returns: "error-a1b2c3d4" or similar
 *
 * <span id={descriptionId}>Error message here</span>
 * <input aria-describedby={descriptionId} />
 * ```
 */
export const generateA11yId = (prefix = 'a11y'): string => {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
};

/**
 * ARIA live region politeness levels.
 * - 'polite': Waits for user to finish current task (use for most updates)
 * - 'assertive': Interrupts immediately (use sparingly, only for critical alerts)
 */
export type LiveRegionPoliteness = 'polite' | 'assertive';

/**
 * Props for accessible buttons that toggle expanded/collapsed states.
 * Use with collapsible sections, accordions, and disclosure patterns.
 */
export interface ExpandableAriaProps {
  'aria-expanded': boolean;
  'aria-controls': string;
}

/**
 * Generate ARIA props for an expandable trigger button.
 *
 * @param isExpanded - Whether the controlled region is currently expanded
 * @param controlsId - The ID of the element being controlled
 * @returns Object with aria-expanded and aria-controls
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const contentId = 'details-content';
 *
 * <button {...getExpandableAriaProps(open, contentId)} onClick={() => setOpen(!open)}>
 *   Toggle Details
 * </button>
 * <div id={contentId} hidden={!open}>
 *   Details content here
 * </div>
 * ```
 */
export const getExpandableAriaProps = (isExpanded: boolean, controlsId: string): ExpandableAriaProps => ({
  'aria-expanded': isExpanded,
  'aria-controls': controlsId,
});

/**
 * Common keyboard keys for accessibility interactions.
 * Use these constants instead of magic strings for maintainability.
 */
export const A11Y_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const;

/**
 * Check if a keyboard event matches common activation keys (Enter or Space).
 * Useful for making non-button elements keyboard-activatable.
 *
 * @param event - The keyboard event to check
 * @returns true if Enter or Space was pressed
 *
 * @example
 * ```tsx
 * <div
 *   role="button"
 *   tabIndex={0}
 *   onKeyDown={(e) => {
 *     if (isActivationKey(e)) {
 *       e.preventDefault();
 *       handleClick();
 *     }
 *   }}
 * >
 *   Custom Button
 * </div>
 * ```
 */
export const isActivationKey = (event: React.KeyboardEvent | KeyboardEvent): boolean =>
  event.key === A11Y_KEYS.ENTER || event.key === A11Y_KEYS.SPACE;
