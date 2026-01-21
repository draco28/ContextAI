/**
 * ObservationStep - Renders tool execution results
 *
 * Displays the result of a tool call, including success/failure
 * status and support for truncating long results.
 */

import React, { useState, useCallback, useId } from 'react';
import type { ReasoningStep } from '../../hooks/types.js';

/**
 * Props for ObservationStep component
 */
export interface ObservationStepProps {
  /** The reasoning step to render */
  step: ReasoningStep;
  /** Step index in the trace */
  index: number;
  /** Whether this step starts collapsed */
  defaultCollapsed?: boolean;
  /** Max characters before truncating result (default: 200) */
  maxResultLength?: number;
  /** Whether to show "Show more/less" button (default: true) */
  showExpandable?: boolean;
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
 * ObservationStep - Visualizes tool results
 *
 * Features:
 * - Success/failure indicator via data-success attribute
 * - Long results are truncated by default
 * - "Show more/less" toggle for truncated content
 *
 * @example
 * ```tsx
 * <ObservationStep
 *   step={{
 *     type: 'observation',
 *     content: 'Found 3 results',
 *     result: { items: [...] },
 *     success: true,
 *     timestamp: Date.now()
 *   }}
 *   index={2}
 *   maxResultLength={200}
 * />
 * ```
 */
export const ObservationStep = React.memo(function ObservationStep({
  step,
  index,
  defaultCollapsed = false,
  maxResultLength = 200,
  showExpandable = true,
  'data-testid': dataTestId,
}: ObservationStepProps) {
  // Local state for expand/collapse of truncated content
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(!defaultCollapsed);
  const contentId = useId();

  // Format result - could be string or object
  const fullResult =
    typeof step.result === 'string'
      ? step.result
      : JSON.stringify(step.result, null, 2);

  // Determine if truncation is needed
  const isTruncatable = fullResult.length > maxResultLength;

  // Show truncated or full content based on state
  const displayResult =
    !isTruncatable || isExpanded
      ? fullResult
      : fullResult.slice(0, maxResultLength) + '...';

  // Toggle expand/collapse
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const statusText = step.success ? 'Success' : 'Failed';

  return (
    <div
      role="listitem"
      data-type="observation"
      data-success={step.success}
      data-testid={dataTestId}
      aria-label={`Step ${index + 1}: Observation - ${statusText} at ${formatTime(step.timestamp)}`}
    >
      <details open={isDetailsOpen} onToggle={(e) => setIsDetailsOpen(e.currentTarget.open)}>
        <summary
          data-testid={dataTestId ? `${dataTestId}-summary` : undefined}
          aria-expanded={isDetailsOpen}
          aria-controls={contentId}
        >
          <span data-step-type="observation">Observation</span>
          <span data-success={step.success}>{statusText}</span>
          <time dateTime={new Date(step.timestamp).toISOString()}>
            {formatTime(step.timestamp)}
          </time>
        </summary>
        <div
          id={contentId}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <pre data-testid={dataTestId ? `${dataTestId}-result` : undefined}>
            <code>{displayResult}</code>
          </pre>
          {showExpandable && isTruncatable && (
            <button
              type="button"
              onClick={handleToggleExpand}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Show less result content' : 'Show more result content'}
              data-testid={dataTestId ? `${dataTestId}-expand` : undefined}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </details>
    </div>
  );
});
