/**
 * axe-core configuration for accessibility testing
 *
 * This module provides configured axe-core testing utilities
 * for WCAG 2.1 AA compliance validation.
 */

import { axe } from 'vitest-axe';
import { expect } from 'vitest';

// Note: Matchers are already extended in test/setup.ts

/**
 * Default axe configuration targeting WCAG 2.1 AA
 *
 * Rules enabled:
 * - Color contrast (4.5:1 for normal text)
 * - Form labels
 * - Button names
 * - Link names
 * - ARIA attributes
 */
export const axeConfig = {
  rules: {
    // WCAG 2.1 AA rules - Critical for compliance
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'button-name': { enabled: true },
    'link-name': { enabled: true },

    // ARIA rules
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-roles': { enabled: true },

    // Keyboard accessibility
    'tabindex': { enabled: true },
    'focus-order-semantics': { enabled: true },

    // Document structure
    'region': { enabled: false }, // Disabled - headless components don't define regions
    'landmark-one-main': { enabled: false }, // Disabled - components aren't full pages
    'page-has-heading-one': { enabled: false }, // Disabled - components aren't full pages
  },
};

/**
 * Run accessibility audit on a container element
 *
 * @param container - The DOM element to audit (usually from render().container)
 * @param options - Optional axe configuration overrides
 * @returns Promise resolving to axe results
 *
 * @example
 * ```tsx
 * const { container } = render(<ChatWindow {...props} />);
 * const results = await runAxe(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export const runAxe = async (
  container: Element,
  options?: Parameters<typeof axe>[1],
): ReturnType<typeof axe> => {
  return axe(container, {
    ...axeConfig,
    ...options,
  });
};

/**
 * Common test helper: assert no a11y violations
 *
 * @param container - The DOM element to audit
 *
 * @example
 * ```tsx
 * it('has no accessibility violations', async () => {
 *   const { container } = render(<Component />);
 *   await expectNoA11yViolations(container);
 * });
 * ```
 */
export const expectNoA11yViolations = async (container: Element): Promise<void> => {
  const results = await runAxe(container);
  expect(results).toHaveNoViolations();
};

// Re-export axe for advanced usage
export { axe };
