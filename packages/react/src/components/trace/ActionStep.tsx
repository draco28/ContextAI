/**
 * ActionStep - Renders agent's tool invocation decision
 *
 * Displays when the agent decides to use a tool, including
 * the tool name and input parameters.
 */

import React from 'react';
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
  index: _index,
  defaultCollapsed = false,
  'data-testid': dataTestId,
}: ActionStepProps) {
  // Format input as pretty JSON for readability
  const inputStr = step.input ? JSON.stringify(step.input, null, 2) : '';

  return (
    <details
      open={!defaultCollapsed}
      data-type="action"
      data-testid={dataTestId}
    >
      <summary data-testid={dataTestId ? `${dataTestId}-summary` : undefined}>
        <span data-step-type="action">Action</span>
        <span data-tool-name>{step.tool}</span>
        <time dateTime={new Date(step.timestamp).toISOString()}>
          {formatTime(step.timestamp)}
        </time>
      </summary>
      <div data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
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
  );
});
