/**
 * Accessibility tests for ReasoningTrace component
 *
 * Tests WCAG 2.1 AA compliance using axe-core.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReasoningTrace } from '../../src/index.js';
import type { ReasoningStep } from '../../src/hooks/types.js';
import { expectNoA11yViolations } from './axe-setup.js';

describe('ReasoningTrace Accessibility', () => {
  const mockSteps: ReasoningStep[] = [
    {
      type: 'thought',
      content: 'I need to search for information about TypeScript.',
      timestamp: Date.now() - 3000,
    },
    {
      type: 'action',
      content: 'Using tool: search',
      tool: 'search',
      input: { query: 'TypeScript patterns' },
      timestamp: Date.now() - 2000,
    },
    {
      type: 'observation',
      content: 'Search completed successfully',
      result: { items: ['Result 1', 'Result 2'] },
      success: true,
      timestamp: Date.now() - 1000,
    },
  ];

  describe('axe-core validation', () => {
    it('has no violations with steps', async () => {
      const { container } = render(<ReasoningTrace steps={mockSteps} />);
      await expectNoA11yViolations(container);
    });

    it('has no violations with empty steps', async () => {
      const { container } = render(<ReasoningTrace steps={[]} />);
      await expectNoA11yViolations(container);
    });

    it('has no violations during streaming', async () => {
      const { container } = render(
        <ReasoningTrace steps={mockSteps} isStreaming />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations with collapsed steps', async () => {
      const { container } = render(
        <ReasoningTrace steps={mockSteps} defaultCollapsed />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations with failed observation', async () => {
      const stepsWithFailure: ReasoningStep[] = [
        ...mockSteps.slice(0, 2),
        {
          type: 'observation',
          content: 'Tool execution failed',
          result: { error: 'Connection timeout' },
          success: false,
          timestamp: Date.now(),
        },
      ];
      const { container } = render(<ReasoningTrace steps={stepsWithFailure} />);
      await expectNoA11yViolations(container);
    });
  });

  describe('ARIA attributes', () => {
    it('has correct aria-label on section', () => {
      render(<ReasoningTrace steps={mockSteps} />);
      expect(screen.getByRole('region', { name: 'Reasoning trace' })).toBeInTheDocument();
    });

    it('has role=list on steps container', () => {
      render(<ReasoningTrace steps={mockSteps} />);
      expect(screen.getByRole('list', { name: 'Reasoning steps' })).toBeInTheDocument();
    });

    it('has role=listitem on each step', () => {
      render(<ReasoningTrace steps={mockSteps} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('has aria-expanded on collapsible summaries', () => {
      render(<ReasoningTrace steps={mockSteps} />);
      const summaries = document.querySelectorAll('summary');
      summaries.forEach((summary) => {
        expect(summary).toHaveAttribute('aria-expanded');
      });
    });

    it('has role=status on streaming indicator', () => {
      render(<ReasoningTrace steps={mockSteps} isStreaming />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('summaries are keyboard accessible via native details/summary', () => {
      render(<ReasoningTrace steps={mockSteps} />);

      // All summaries should be focusable via native details/summary
      const summaries = document.querySelectorAll('summary');
      expect(summaries.length).toBe(3);

      // Verify ARIA attributes are present
      summaries.forEach((summary) => {
        expect(summary).toHaveAttribute('aria-expanded');
        expect(summary).toHaveAttribute('aria-controls');
      });
    });

    it('details elements are properly associated', () => {
      render(<ReasoningTrace steps={mockSteps} />);

      const details = document.querySelectorAll('details');
      expect(details.length).toBe(3);

      // Each details should have an open attribute (expanded by default)
      details.forEach((detail) => {
        expect(detail).toHaveAttribute('open');
      });
    });
  });

  describe('copy button accessibility', () => {
    const mockTrace = {
      iterations: 1,
      steps: [],
      totalTokens: 100,
      finalAnswer: 'Done',
    };

    it('copy buttons have aria-labels', () => {
      render(<ReasoningTrace steps={mockSteps} trace={mockTrace as unknown as Parameters<typeof ReasoningTrace>[0]['trace']} />);

      expect(
        screen.getByRole('button', { name: /copy reasoning trace as plain text/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /copy reasoning trace as json/i }),
      ).toBeInTheDocument();
    });

    it('copy buttons are grouped', () => {
      render(<ReasoningTrace steps={mockSteps} trace={mockTrace as unknown as Parameters<typeof ReasoningTrace>[0]['trace']} />);

      expect(screen.getByRole('group', { name: 'Copy options' })).toBeInTheDocument();
    });
  });

});
