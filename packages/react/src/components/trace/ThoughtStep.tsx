/**
 * ThoughtStep - Renders agent's internal reasoning
 *
 * Displays the "thinking" phase of the ReAct loop where
 * the agent reasons about what to do next.
 */

import React, { useState, useId } from 'react';
import type { ReasoningStep } from '../../hooks/types.js';

/**
 * Props for ThoughtStep component
 */
export interface ThoughtStepProps {
  /** The reasoning step to render */
  step: ReasoningStep;
  /** Step index in the trace */
  index: number;
  /** Whether this step starts collapsed */
  defaultCollapsed?: boolean;
  /** Custom data-testid for testing */
  'data-testid'?: string;
}

/**
 * Format timestamp to locale time string
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * ThoughtStep - Visualizes agent thinking
 *
 * Uses native HTML `<details>` for collapse behavior -
 * this is semantic, accessible, and requires no JavaScript state.
 *
 * @example
 * ```tsx
 * <ThoughtStep
 *   step={{ type: 'thought', content: 'I need to search...', timestamp: Date.now() }}
 *   index={0}
 * />
 * ```
 */
export const ThoughtStep = React.memo(function ThoughtStep({
  step,
  index,
  defaultCollapsed = false,
  'data-testid': dataTestId,
}: ThoughtStepProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const contentId = useId();

  return (
    <div
      role="listitem"
      data-type="thought"
      data-testid={dataTestId}
      aria-label={`Step ${index + 1}: Thought at ${formatTime(step.timestamp)}`}
    >
      <details open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
        <summary
          data-testid={dataTestId ? `${dataTestId}-summary` : undefined}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span data-step-type="thought">Thought</span>
          <time dateTime={new Date(step.timestamp).toISOString()}>
            {formatTime(step.timestamp)}
          </time>
        </summary>
        <div
          id={contentId}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          {step.content}
        </div>
      </details>
    </div>
  );
});
