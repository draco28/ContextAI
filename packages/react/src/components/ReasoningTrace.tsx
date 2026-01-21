/**
 * ReasoningTrace - Headless reasoning chain visualization
 *
 * Displays the agent's ReAct thought process:
 * - Thoughts: Internal reasoning
 * - Actions: Tool call decisions
 * - Observations: Tool execution results
 *
 * This is a headless component - it provides structure and behavior
 * but no styling. Style via CSS targeting data attributes.
 */

import { useCallback, type ReactNode } from 'react';
import { formatTrace, formatTraceJSON, getTraceStats } from '@contextai/core';
import type { ReActTrace, TraceStats } from '@contextai/core';
import type { ReasoningStep } from '../hooks/types.js';
import { TraceStep } from './trace/index.js';

/**
 * Props for ReasoningTrace component
 */
export interface ReasoningTraceProps {
  // ===== DATA =====
  /** Reasoning steps to display (from useAgentStream) */
  steps: ReasoningStep[];

  /** Complete trace for statistics (optional, from useAgentStream) */
  trace?: ReActTrace | null;

  /** Whether streaming is in progress */
  isStreaming?: boolean;

  // ===== COLLAPSE BEHAVIOR =====
  /** Whether steps start collapsed (default: false) */
  defaultCollapsed?: boolean;

  // ===== TRUNCATION =====
  /** Max characters before truncating results (default: 200) */
  maxResultLength?: number;

  /** Whether to show "Show more/less" button (default: true) */
  showExpandable?: boolean;

  // ===== COPY FUNCTIONALITY =====
  /** Whether to show copy buttons (default: true) */
  showCopyButtons?: boolean;

  /** Called after copy attempt */
  onCopy?: (format: 'text' | 'json', success: boolean) => void;

  // ===== STATISTICS =====
  /** Whether to show trace statistics (default: true when trace provided) */
  showStats?: boolean;

  // ===== CUSTOM RENDERING =====
  /** Custom render for individual steps */
  renderStep?: (step: ReasoningStep, index: number) => ReactNode;

  /** Custom render for thought steps */
  renderThought?: (step: ReasoningStep, index: number) => ReactNode;

  /** Custom render for action steps */
  renderAction?: (step: ReasoningStep, index: number) => ReactNode;

  /** Custom render for observation steps */
  renderObservation?: (step: ReasoningStep, index: number) => ReactNode;

  /** Custom render for statistics section */
  renderStats?: (stats: TraceStats) => ReactNode;

  /** Children (fully custom layout) */
  children?: ReactNode;

  // ===== STYLING HOOKS =====
  /** Additional CSS class */
  className?: string;

  /** Custom data-testid for testing */
  'data-testid'?: string;
}

/**
 * Generate stable key for step rendering
 */
function stepKey(step: ReasoningStep, index: number): string {
  return `${index}-${step.type}-${step.timestamp}`;
}

/**
 * ReasoningTrace - Main visualization component
 *
 * @example Basic usage
 * ```tsx
 * const { reasoning, trace } = useAgentStream(agent);
 *
 * <ReasoningTrace steps={reasoning} trace={trace} />
 * ```
 *
 * @example With streaming indicator
 * ```tsx
 * <ReasoningTrace
 *   steps={reasoning}
 *   trace={trace}
 *   isStreaming={isLoading}
 * />
 * ```
 *
 * @example Custom styling via CSS
 * ```css
 * [data-type="thought"] { background: #e3f2fd; }
 * [data-type="action"] { background: #fff3e0; }
 * [data-type="observation"] { background: #e8f5e9; }
 * [data-success="false"] { background: #ffebee; }
 * ```
 *
 * @example Custom step rendering
 * ```tsx
 * <ReasoningTrace
 *   steps={reasoning}
 *   renderThought={(step) => (
 *     <div className="thought-bubble">{step.content}</div>
 *   )}
 * />
 * ```
 */
export function ReasoningTrace({
  steps,
  trace,
  isStreaming = false,
  defaultCollapsed = false,
  maxResultLength = 200,
  showExpandable = true,
  showCopyButtons = true,
  onCopy,
  showStats,
  renderStep,
  renderThought,
  renderAction,
  renderObservation,
  renderStats,
  children,
  className,
  'data-testid': dataTestId,
}: ReasoningTraceProps) {
  // Calculate stats from trace if available
  const stats = trace ? getTraceStats(trace) : null;

  // Default: show stats when trace is available
  const shouldShowStats = showStats ?? trace !== null;

  // Copy as human-readable text
  const handleCopyText = useCallback(async () => {
    if (!trace) return;
    try {
      const text = formatTrace(trace, { colors: false });
      await navigator.clipboard.writeText(text);
      onCopy?.('text', true);
    } catch {
      onCopy?.('text', false);
    }
  }, [trace, onCopy]);

  // Copy as JSON
  const handleCopyJSON = useCallback(async () => {
    if (!trace) return;
    try {
      const json = formatTraceJSON(trace);
      await navigator.clipboard.writeText(json);
      onCopy?.('json', true);
    } catch {
      onCopy?.('json', false);
    }
  }, [trace, onCopy]);

  // Determine which renderer to use for a step
  const getStepRenderer = (
    step: ReasoningStep,
    index: number
  ): ReactNode | null => {
    // Global custom render takes precedence
    if (renderStep) {
      return renderStep(step, index);
    }

    // Type-specific custom renders
    if (step.type === 'thought' && renderThought) {
      return renderThought(step, index);
    }
    if (step.type === 'action' && renderAction) {
      return renderAction(step, index);
    }
    if (step.type === 'observation' && renderObservation) {
      return renderObservation(step, index);
    }

    // No custom render - return null to use default
    return null;
  };

  // If children provided, use fully custom layout
  if (children) {
    return (
      <section
        className={className}
        data-testid={dataTestId}
        aria-label="Reasoning trace"
      >
        {children}
      </section>
    );
  }

  return (
    <section
      className={className}
      data-testid={dataTestId}
      aria-label="Reasoning trace"
      data-streaming={isStreaming || undefined}
    >
      {/* Copy buttons - only when trace is available */}
      {showCopyButtons && trace && (
        <div data-testid={dataTestId ? `${dataTestId}-actions` : undefined}>
          <button
            type="button"
            onClick={handleCopyText}
            data-testid={dataTestId ? `${dataTestId}-copy-text` : undefined}
          >
            Copy as Text
          </button>
          <button
            type="button"
            onClick={handleCopyJSON}
            data-testid={dataTestId ? `${dataTestId}-copy-json` : undefined}
          >
            Copy as JSON
          </button>
        </div>
      )}

      {/* Statistics section */}
      {shouldShowStats && stats && (
        <>
          {renderStats ? (
            renderStats(stats)
          ) : (
            <div
              data-testid={dataTestId ? `${dataTestId}-stats` : undefined}
              role="region"
              aria-label="Trace statistics"
            >
              <dl>
                <div>
                  <dt>Iterations</dt>
                  <dd>{trace?.iterations ?? 0}</dd>
                </div>
                <div>
                  <dt>Thoughts</dt>
                  <dd>{stats.thoughtCount}</dd>
                </div>
                <div>
                  <dt>Actions</dt>
                  <dd>{stats.actionCount}</dd>
                </div>
                <div>
                  <dt>Tool Success</dt>
                  <dd>
                    {stats.successfulTools}/{stats.actionCount}
                  </dd>
                </div>
                <div>
                  <dt>Tokens</dt>
                  <dd>{trace?.totalTokens ?? 0}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{stats.totalDurationMs}ms</dd>
                </div>
              </dl>
            </div>
          )}
        </>
      )}

      {/* Steps list */}
      <div
        role="list"
        aria-label="Reasoning steps"
        data-testid={dataTestId ? `${dataTestId}-steps` : undefined}
      >
        {steps.map((step, index) => {
          const customContent = getStepRenderer(step, index);

          // Custom render provided
          if (customContent !== null) {
            return (
              <div key={stepKey(step, index)} role="listitem">
                {customContent}
              </div>
            );
          }

          // Default rendering via TraceStep
          return (
            <TraceStep
              key={stepKey(step, index)}
              step={step}
              index={index}
              defaultCollapsed={defaultCollapsed}
              maxResultLength={maxResultLength}
              showExpandable={showExpandable}
              data-testid={dataTestId ? `${dataTestId}-step-${index}` : undefined}
            />
          );
        })}
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div
          aria-busy="true"
          data-testid={dataTestId ? `${dataTestId}-streaming` : undefined}
        >
          Processing...
        </div>
      )}
    </section>
  );
}
