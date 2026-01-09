import type { ReActTrace, ReActStep } from './types';

/**
 * Format options for trace output
 */
export interface TraceFormatOptions {
  /** Include timestamps (default: true) */
  timestamps?: boolean;
  /** Include iteration numbers (default: true) */
  iterations?: boolean;
  /** Colorize output with ANSI codes (default: false) */
  colors?: boolean;
  /** Indent size in spaces (default: 2) */
  indent?: number;
  /** Max result length before truncation (default: 200) */
  maxResultLength?: number;
}

const DEFAULT_OPTIONS: Required<TraceFormatOptions> = {
  timestamps: true,
  iterations: true,
  colors: false,
  indent: 2,
  maxResultLength: 200,
};

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  thought: '\x1b[36m', // Cyan
  action: '\x1b[33m', // Yellow
  observation: '\x1b[32m', // Green
  error: '\x1b[31m', // Red
  dim: '\x1b[2m',
};

/**
 * Format a ReAct trace for human-readable output
 *
 * @example
 * ```typescript
 * const formatted = formatTrace(response.trace, { colors: true });
 * console.log(formatted);
 * ```
 */
export const formatTrace = (
  trace: ReActTrace,
  options: TraceFormatOptions = {}
): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  const indent = ' '.repeat(opts.indent);

  // Header
  lines.push('=== ReAct Trace ===');
  lines.push(`Iterations: ${trace.iterations}`);
  lines.push(`Total Tokens: ${trace.totalTokens}`);
  lines.push(`Duration: ${trace.durationMs}ms`);
  lines.push('');

  let currentIteration = 0;

  for (const step of trace.steps) {
    // Track iteration changes (thoughts mark new iterations)
    if (step.type === 'thought') {
      currentIteration++;
    }

    const line = formatStep(step, opts, indent, currentIteration);
    lines.push(line);
  }

  lines.push('');
  lines.push('=== End Trace ===');

  return lines.join('\n');
};

/**
 * Format a single step
 */
const formatStep = (
  step: ReActStep,
  opts: Required<TraceFormatOptions>,
  indent: string,
  iteration: number
): string => {
  const parts: string[] = [];
  const c = opts.colors
    ? COLORS
    : { reset: '', thought: '', action: '', observation: '', error: '', dim: '' };

  // Timestamp
  if (opts.timestamps) {
    const iso = new Date(step.timestamp).toISOString();
    const time = iso.split('T')[1]?.replace('Z', '') ?? iso;
    parts.push(`${c.dim}[${time}]${c.reset}`);
  }

  // Iteration
  if (opts.iterations) {
    parts.push(`${c.dim}#${iteration}${c.reset}`);
  }

  // Step content
  if (step.type === 'thought') {
    parts.push(`${c.thought}THOUGHT:${c.reset} ${step.content}`);
  } else if (step.type === 'action') {
    const inputStr = truncate(JSON.stringify(step.input), opts.maxResultLength);
    parts.push(`${c.action}ACTION:${c.reset} ${step.tool}(${inputStr})`);
  } else if (step.type === 'observation') {
    const resultStr = truncate(JSON.stringify(step.result), opts.maxResultLength);
    const status = step.success
      ? `${c.observation}SUCCESS${c.reset}`
      : `${c.error}FAILED${c.reset}`;
    parts.push(`${c.observation}OBSERVATION:${c.reset} [${status}] ${resultStr}`);
  }

  return indent + parts.join(' ');
};

/**
 * Truncate string with ellipsis
 */
const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Format trace as JSON (for structured logging)
 */
export const formatTraceJSON = (trace: ReActTrace): string => {
  return JSON.stringify(trace, null, 2);
};

/**
 * Trace statistics
 */
export interface TraceStats {
  /** Number of thought steps */
  thoughtCount: number;
  /** Number of action steps */
  actionCount: number;
  /** Number of observation steps */
  observationCount: number;
  /** Number of successful tool executions */
  successfulTools: number;
  /** Number of failed tool executions */
  failedTools: number;
  /** Average tokens per iteration */
  tokensPerIteration: number;
  /** Total duration in milliseconds */
  totalDurationMs: number;
}

/**
 * Calculate trace statistics
 *
 * @example
 * ```typescript
 * const stats = getTraceStats(response.trace);
 * console.log(`Tools: ${stats.successfulTools}/${stats.actionCount} succeeded`);
 * ```
 */
export const getTraceStats = (trace: ReActTrace): TraceStats => {
  let thoughtCount = 0;
  let actionCount = 0;
  let observationCount = 0;
  let successfulTools = 0;
  let failedTools = 0;

  for (const step of trace.steps) {
    if (step.type === 'thought') {
      thoughtCount++;
    } else if (step.type === 'action') {
      actionCount++;
    } else if (step.type === 'observation') {
      observationCount++;
      if (step.success) {
        successfulTools++;
      } else {
        failedTools++;
      }
    }
  }

  return {
    thoughtCount,
    actionCount,
    observationCount,
    successfulTools,
    failedTools,
    tokensPerIteration:
      trace.iterations > 0 ? Math.round(trace.totalTokens / trace.iterations) : 0,
    totalDurationMs: trace.durationMs,
  };
};
