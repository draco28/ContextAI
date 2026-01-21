/**
 * TraceStep - Polymorphic step renderer
 *
 * Routes to the appropriate step component based on step.type.
 * This is the main component used by ReasoningTrace to render steps.
 */

import React from 'react';
import type { ReasoningStep } from '../../hooks/types.js';
import { ThoughtStep } from './ThoughtStep.js';
import { ActionStep } from './ActionStep.js';
import { ObservationStep } from './ObservationStep.js';

/**
 * Props for TraceStep component
 */
export interface TraceStepProps {
  /** The reasoning step to render */
  step: ReasoningStep;
  /** Step index in the trace */
  index: number;
  /** Whether this step starts collapsed */
  defaultCollapsed?: boolean;
  /** Max result length for observation truncation */
  maxResultLength?: number;
  /** Whether to show expandable button for observations */
  showExpandable?: boolean;
  /** Custom data-testid for testing */
  'data-testid'?: string;
}

/**
 * TraceStep - Delegates to type-specific component
 *
 * This is a "polymorphic" component - it renders differently
 * based on the step.type discriminant. This pattern keeps
 * the parent component clean while allowing specialized
 * rendering for each step type.
 *
 * @example
 * ```tsx
 * // Automatically routes to ThoughtStep, ActionStep, or ObservationStep
 * <TraceStep step={step} index={0} />
 * ```
 */
export const TraceStep = React.memo(function TraceStep({
  step,
  index,
  defaultCollapsed = false,
  maxResultLength = 200,
  showExpandable = true,
  'data-testid': dataTestId,
}: TraceStepProps) {
  switch (step.type) {
    case 'thought':
      return (
        <ThoughtStep
          step={step}
          index={index}
          defaultCollapsed={defaultCollapsed}
          data-testid={dataTestId}
        />
      );

    case 'action':
      return (
        <ActionStep
          step={step}
          index={index}
          defaultCollapsed={defaultCollapsed}
          data-testid={dataTestId}
        />
      );

    case 'observation':
      return (
        <ObservationStep
          step={step}
          index={index}
          defaultCollapsed={defaultCollapsed}
          maxResultLength={maxResultLength}
          showExpandable={showExpandable}
          data-testid={dataTestId}
        />
      );

    default:
      // TypeScript exhaustiveness check - this should never happen
      // but provides safety if new step types are added
      return null;
  }
});
