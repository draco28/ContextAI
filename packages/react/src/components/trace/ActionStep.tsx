/**
 * ActionStep - Renders agent's tool invocation decision
 *
 * Displays when the agent decides to use a tool, including
 * the tool name and input parameters.
 */

import React, { useState, useId } from 'react';
import type { ReasoningStep } from '../../hooks/types.js';

/**
 * Props for ActionStep component
 */
export interface ActionStepProps {
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
 * ActionStep - Visualizes tool call decisions
 *
 * Shows:
 * - Tool name in the summary (for quick scanning)
 * - Full JSON input when expanded (for debugging)
 *
 * @example
 * ```tsx
 * <ActionStep
 *   step={{
 *     type: 'action',
 *     content: 'Using tool: search',
 *     tool: 'search',
 *     input: { query: 'typescript patterns' },
 *     timestamp: Date.now()
 *   }}
 *   index={1}
 * />
 * ```
 */
export const ActionStep = React.memo(function ActionStep({
  step,
  index,
  defaultCollapsed = false,
  'data-testid': dataTestId,
}: ActionStepProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const contentId = useId();

  // Format input as pretty JSON for readability
  const inputStr = step.input ? JSON.stringify(step.input, null, 2) : '';

  return (
    <div
      role="listitem"
      data-type="action"
      data-testid={dataTestId}
      aria-label={`Step ${index + 1}: Action - ${step.tool} at ${formatTime(step.timestamp)}`}
    >
      <details open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
        <summary
          data-testid={dataTestId ? `${dataTestId}-summary` : undefined}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span data-step-type="action">Action</span>
          <span data-tool-name>{step.tool}</span>
          <time dateTime={new Date(step.timestamp).toISOString()}>
            {formatTime(step.timestamp)}
          </time>
        </summary>
        <div
          id={contentId}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <div data-testid={dataTestId ? `${dataTestId}-tool` : undefined}>
            Tool: {step.tool}
          </div>
          {inputStr && (
            <pre data-testid={dataTestId ? `${dataTestId}-input` : undefined}>
              <code>{inputStr}</code>
            </pre>
          )}
        </div>
      </details>
    </div>
  );
});
