/**
 * Accessibility utilities for @contextai/react
 *
 * These utilities help build WCAG 2.1 AA compliant UI components.
 *
 * @packageDocumentation
 */

// Core accessibility utilities
export {
  srOnlyStyles,
  generateA11yId,
  getExpandableAriaProps,
  isActivationKey,
  A11Y_KEYS,
  type LiveRegionPoliteness,
  type ExpandableAriaProps,
} from './a11y.js';

// Focus management
export {
  useFocusTrap,
  useFocusReturn,
  useAutoFocus,
  getFocusableElements,
} from './focus-trap.js';

// Screen reader announcements
export {
  useAnnouncer,
  announceToScreenReader,
  type UseAnnouncerOptions,
  type UseAnnouncerReturn,
} from './announcer.js';
