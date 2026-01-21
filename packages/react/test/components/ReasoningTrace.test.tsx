/**
 * ReasoningTrace component tests
 *
 * Tests the main ReasoningTrace component and all sub-components
 * for rendering, interaction, and customization.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReActTrace } from '@contextai/core';
import {
  ReasoningTrace,
  TraceStep,
  ThoughtStep,
  ActionStep,
  ObservationStep,
  type ReasoningStep,
} from '../../src/index.js';

// ===== TEST FIXTURES =====

const createMockSteps = (): ReasoningStep[] => [
  {
    type: 'thought',
    content: 'I need to search for information about TypeScript',
    timestamp: 1000,
  },
  {
    type: 'action',
    content: 'Using tool: search',
    tool: 'search',
    input: { query: 'TypeScript patterns' },
    timestamp: 2000,
  },
  {
    type: 'observation',
    content: 'Found 3 results',
    result: { items: ['result1', 'result2', 'result3'] },
    success: true,
    timestamp: 3000,
  },
];

const createMockTrace = (): ReActTrace => ({
  steps: [
    { type: 'thought', content: 'Analyzing the question', timestamp: 1000 },
    { type: 'action', tool: 'search', input: { query: 'test' }, timestamp: 2000 },
    { type: 'observation', result: { data: 'found' }, success: true, timestamp: 3000 },
  ],
  iterations: 1,
  totalTokens: 250,
  durationMs: 500,
});

// ===== MAIN COMPONENT TESTS =====

describe('ReasoningTrace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  describe('basic rendering', () => {
    it('renders all steps', () => {
      const steps = createMockSteps();
      render(<ReasoningTrace steps={steps} data-testid="trace" />);

      expect(screen.getByTestId('trace-step-0')).toBeInTheDocument();
      expect(screen.getByTestId('trace-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('trace-step-2')).toBeInTheDocument();
    });

    it('renders empty state with no steps', () => {
      render(<ReasoningTrace steps={[]} data-testid="trace" />);

      const stepsList = screen.getByTestId('trace-steps');
      expect(stepsList).toBeEmptyDOMElement();
    });

    it('applies className prop', () => {
      render(<ReasoningTrace steps={[]} className="my-trace" data-testid="trace" />);

      expect(screen.getByTestId('trace')).toHaveClass('my-trace');
    });

    it('sets aria-label for accessibility', () => {
      render(<ReasoningTrace steps={[]} data-testid="trace" />);

      expect(screen.getByTestId('trace')).toHaveAttribute(
        'aria-label',
        'Reasoning trace'
      );
    });
  });

  describe('collapse behavior', () => {
    it('steps are expanded by default', () => {
      const steps = createMockSteps();
      render(<ReasoningTrace steps={steps} data-testid="trace" />);

      const firstStep = screen.getByTestId('trace-step-0');
      expect(firstStep).toHaveAttribute('open');
    });

    it('respects defaultCollapsed prop', () => {
      const steps = createMockSteps();
      render(<ReasoningTrace steps={steps} defaultCollapsed data-testid="trace" />);

      const firstStep = screen.getByTestId('trace-step-0');
      expect(firstStep).not.toHaveAttribute('open');
    });
  });

  describe('copy functionality', () => {
    it('shows copy buttons when trace is provided', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(<ReasoningTrace steps={steps} trace={trace} data-testid="trace" />);

      expect(screen.getByTestId('trace-copy-text')).toBeInTheDocument();
      expect(screen.getByTestId('trace-copy-json')).toBeInTheDocument();
    });

    it('hides copy buttons when trace is null', () => {
      const steps = createMockSteps();

      render(<ReasoningTrace steps={steps} trace={null} data-testid="trace" />);

      expect(screen.queryByTestId('trace-copy-text')).not.toBeInTheDocument();
    });

    it('hides copy buttons when showCopyButtons is false', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          showCopyButtons={false}
          data-testid="trace"
        />
      );

      expect(screen.queryByTestId('trace-copy-text')).not.toBeInTheDocument();
    });

    it('calls onCopy with text format on success', async () => {
      const steps = createMockSteps();
      const trace = createMockTrace();
      const onCopy = vi.fn();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          onCopy={onCopy}
          data-testid="trace"
        />
      );

      fireEvent.click(screen.getByTestId('trace-copy-text'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('text', true);
      });
    });

    it('calls onCopy with json format on success', async () => {
      const steps = createMockSteps();
      const trace = createMockTrace();
      const onCopy = vi.fn();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          onCopy={onCopy}
          data-testid="trace"
        />
      );

      fireEvent.click(screen.getByTestId('trace-copy-json'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('json', true);
      });
    });

    it('handles clipboard errors gracefully', async () => {
      const steps = createMockSteps();
      const trace = createMockTrace();
      const onCopy = vi.fn();

      // Mock clipboard failure
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
        },
        configurable: true,
      });

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          onCopy={onCopy}
          data-testid="trace"
        />
      );

      fireEvent.click(screen.getByTestId('trace-copy-text'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('text', false);
      });
    });
  });

  describe('statistics', () => {
    it('shows stats when trace is provided', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(<ReasoningTrace steps={steps} trace={trace} data-testid="trace" />);

      expect(screen.getByTestId('trace-stats')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument(); // tokens
      expect(screen.getByText('500ms')).toBeInTheDocument(); // duration
    });

    it('hides stats when trace is null', () => {
      const steps = createMockSteps();

      render(<ReasoningTrace steps={steps} trace={null} data-testid="trace" />);

      expect(screen.queryByTestId('trace-stats')).not.toBeInTheDocument();
    });

    it('hides stats when showStats is false', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          showStats={false}
          data-testid="trace"
        />
      );

      expect(screen.queryByTestId('trace-stats')).not.toBeInTheDocument();
    });

    it('shows stats when showStats is true even without trace', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          showStats={true}
          data-testid="trace"
        />
      );

      expect(screen.getByTestId('trace-stats')).toBeInTheDocument();
    });
  });

  describe('streaming state', () => {
    it('shows streaming indicator when isStreaming is true', () => {
      render(<ReasoningTrace steps={[]} isStreaming data-testid="trace" />);

      expect(screen.getByTestId('trace-streaming')).toBeInTheDocument();
      expect(screen.getByTestId('trace-streaming')).toHaveAttribute(
        'aria-busy',
        'true'
      );
    });

    it('hides streaming indicator when isStreaming is false', () => {
      render(<ReasoningTrace steps={[]} isStreaming={false} data-testid="trace" />);

      expect(screen.queryByTestId('trace-streaming')).not.toBeInTheDocument();
    });

    it('applies data-streaming attribute to container', () => {
      render(<ReasoningTrace steps={[]} isStreaming data-testid="trace" />);

      expect(screen.getByTestId('trace')).toHaveAttribute('data-streaming');
    });
  });

  describe('custom rendering', () => {
    it('supports renderStep for all steps', () => {
      const steps = createMockSteps();

      render(
        <ReasoningTrace
          steps={steps}
          renderStep={(step, i) => (
            <div data-testid={`custom-${i}`}>{step.type}</div>
          )}
        />
      );

      expect(screen.getByTestId('custom-0')).toHaveTextContent('thought');
      expect(screen.getByTestId('custom-1')).toHaveTextContent('action');
      expect(screen.getByTestId('custom-2')).toHaveTextContent('observation');
    });

    it('supports renderThought for thought steps only', () => {
      const steps = createMockSteps();

      render(
        <ReasoningTrace
          steps={steps}
          renderThought={(step) => (
            <div data-testid="custom-thought">{step.content}</div>
          )}
          data-testid="trace"
        />
      );

      expect(screen.getByTestId('custom-thought')).toBeInTheDocument();
      // Action and observation use default renderers
      expect(screen.getByTestId('trace-step-1')).toHaveAttribute(
        'data-type',
        'action'
      );
      expect(screen.getByTestId('trace-step-2')).toHaveAttribute(
        'data-type',
        'observation'
      );
    });

    it('supports renderAction for action steps only', () => {
      const steps = createMockSteps();

      render(
        <ReasoningTrace
          steps={steps}
          renderAction={(step) => (
            <div data-testid="custom-action">Tool: {step.tool}</div>
          )}
          data-testid="trace"
        />
      );

      expect(screen.getByTestId('custom-action')).toHaveTextContent('Tool: search');
    });

    it('supports renderObservation for observation steps only', () => {
      const steps = createMockSteps();

      render(
        <ReasoningTrace
          steps={steps}
          renderObservation={(step) => (
            <div data-testid="custom-observation">
              {step.success ? 'OK' : 'FAIL'}
            </div>
          )}
          data-testid="trace"
        />
      );

      expect(screen.getByTestId('custom-observation')).toHaveTextContent('OK');
    });

    it('supports renderStats for custom statistics', () => {
      const steps = createMockSteps();
      const trace = createMockTrace();

      render(
        <ReasoningTrace
          steps={steps}
          trace={trace}
          renderStats={(stats) => (
            <div data-testid="custom-stats">
              Tools: {stats.successfulTools}/{stats.actionCount}
            </div>
          )}
        />
      );

      expect(screen.getByTestId('custom-stats')).toHaveTextContent('Tools: 1/1');
    });

    it('supports children for fully custom layout', () => {
      const steps = createMockSteps();

      render(
        <ReasoningTrace steps={steps} data-testid="trace">
          <div data-testid="custom-content">Fully Custom Layout</div>
        </ReasoningTrace>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.queryByTestId('trace-steps')).not.toBeInTheDocument();
    });
  });
});

// ===== SUB-COMPONENT TESTS =====

describe('ThoughtStep', () => {
  it('renders thought content', () => {
    const step: ReasoningStep = {
      type: 'thought',
      content: 'I need to analyze this problem',
      timestamp: Date.now(),
    };

    render(<ThoughtStep step={step} index={0} data-testid="thought" />);

    expect(screen.getByText('I need to analyze this problem')).toBeInTheDocument();
    expect(screen.getByTestId('thought')).toHaveAttribute('data-type', 'thought');
  });

  it('shows timestamp', () => {
    const timestamp = Date.now();
    const step: ReasoningStep = {
      type: 'thought',
      content: 'Test thought',
      timestamp,
    };

    render(<ThoughtStep step={step} index={0} data-testid="thought" />);

    const timeElement = screen.getByRole('time');
    expect(timeElement).toHaveAttribute(
      'datetime',
      new Date(timestamp).toISOString()
    );
  });

  it('respects defaultCollapsed', () => {
    const step: ReasoningStep = {
      type: 'thought',
      content: 'Test thought',
      timestamp: Date.now(),
    };

    render(<ThoughtStep step={step} index={0} defaultCollapsed data-testid="thought" />);

    expect(screen.getByTestId('thought')).not.toHaveAttribute('open');
  });
});

describe('ActionStep', () => {
  it('renders tool name and input', () => {
    const step: ReasoningStep = {
      type: 'action',
      content: 'Using search',
      tool: 'search',
      input: { query: 'test query', limit: 10 },
      timestamp: Date.now(),
    };

    render(<ActionStep step={step} index={0} data-testid="action" />);

    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText(/test query/)).toBeInTheDocument();
    expect(screen.getByTestId('action')).toHaveAttribute('data-type', 'action');
  });

  it('handles empty input gracefully', () => {
    const step: ReasoningStep = {
      type: 'action',
      content: 'Using tool',
      tool: 'no-args-tool',
      timestamp: Date.now(),
    };

    render(<ActionStep step={step} index={0} data-testid="action" />);

    expect(screen.getByTestId('action-tool')).toHaveTextContent('no-args-tool');
    expect(screen.queryByTestId('action-input')).not.toBeInTheDocument();
  });
});

describe('ObservationStep', () => {
  it('shows success indicator for successful results', () => {
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Success',
      result: { data: 'test' },
      success: true,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    expect(screen.getByTestId('obs')).toHaveAttribute('data-success', 'true');
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows failure indicator for failed results', () => {
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Failed',
      result: { error: 'Not found' },
      success: false,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    expect(screen.getByTestId('obs')).toHaveAttribute('data-success', 'false');
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('truncates long results by default', () => {
    const longResult = 'A'.repeat(500);
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: longResult,
      success: true,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    const result = screen.getByTestId('obs-result');
    expect(result.textContent).toHaveLength(203); // 200 + '...'
  });

  it('shows expand button for truncated content', () => {
    const longResult = 'A'.repeat(500);
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: longResult,
      success: true,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    expect(screen.getByTestId('obs-expand')).toBeInTheDocument();
    expect(screen.getByTestId('obs-expand')).toHaveTextContent('Show more');
  });

  it('expands to full content when clicking show more', () => {
    const longResult = 'A'.repeat(500);
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: longResult,
      success: true,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    fireEvent.click(screen.getByTestId('obs-expand'));

    const result = screen.getByTestId('obs-result');
    expect(result.textContent).toHaveLength(500);
    expect(screen.getByTestId('obs-expand')).toHaveTextContent('Show less');
  });

  it('respects custom maxResultLength', () => {
    const longResult = 'A'.repeat(100);
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: longResult,
      success: true,
      timestamp: Date.now(),
    };

    render(
      <ObservationStep step={step} index={0} maxResultLength={50} data-testid="obs" />
    );

    const result = screen.getByTestId('obs-result');
    expect(result.textContent).toHaveLength(53); // 50 + '...'
  });

  it('hides expand button when showExpandable is false', () => {
    const longResult = 'A'.repeat(500);
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: longResult,
      success: true,
      timestamp: Date.now(),
    };

    render(
      <ObservationStep
        step={step}
        index={0}
        showExpandable={false}
        data-testid="obs"
      />
    );

    expect(screen.queryByTestId('obs-expand')).not.toBeInTheDocument();
  });

  it('handles string results', () => {
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Result',
      result: 'Simple string result',
      success: true,
      timestamp: Date.now(),
    };

    render(<ObservationStep step={step} index={0} data-testid="obs" />);

    expect(screen.getByText('Simple string result')).toBeInTheDocument();
  });
});

describe('TraceStep', () => {
  it('routes to ThoughtStep for thought type', () => {
    const step: ReasoningStep = {
      type: 'thought',
      content: 'Test thought',
      timestamp: Date.now(),
    };

    render(<TraceStep step={step} index={0} data-testid="step" />);

    expect(screen.getByTestId('step')).toHaveAttribute('data-type', 'thought');
  });

  it('routes to ActionStep for action type', () => {
    const step: ReasoningStep = {
      type: 'action',
      content: 'Test action',
      tool: 'test-tool',
      input: {},
      timestamp: Date.now(),
    };

    render(<TraceStep step={step} index={0} data-testid="step" />);

    expect(screen.getByTestId('step')).toHaveAttribute('data-type', 'action');
  });

  it('routes to ObservationStep for observation type', () => {
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Test observation',
      result: {},
      success: true,
      timestamp: Date.now(),
    };

    render(<TraceStep step={step} index={0} data-testid="step" />);

    expect(screen.getByTestId('step')).toHaveAttribute('data-type', 'observation');
  });

  it('passes through props to child components', () => {
    const step: ReasoningStep = {
      type: 'observation',
      content: 'Test',
      result: 'A'.repeat(500),
      success: true,
      timestamp: Date.now(),
    };

    render(
      <TraceStep
        step={step}
        index={0}
        maxResultLength={50}
        showExpandable={true}
        defaultCollapsed={true}
        data-testid="step"
      />
    );

    // Check defaultCollapsed was passed
    expect(screen.getByTestId('step')).not.toHaveAttribute('open');

    // Check maxResultLength was passed (truncated to 50)
    const result = screen.getByTestId('step-result');
    expect(result.textContent).toHaveLength(53);
  });
});
