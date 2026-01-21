import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgentStream } from '../../src/hooks/useAgentStream.js';
import type { Agent, AgentResponse, StreamingAgentEvent } from '@contextai/core';

/**
 * Create a mock async generator for streaming
 */
async function* createMockStream(
  events: StreamingAgentEvent[]
): AsyncGenerator<StreamingAgentEvent, void, unknown> {
  for (const event of events) {
    yield event;
  }
}

/**
 * Create a mock Agent for testing
 */
function createMockAgent(
  overrides: Partial<{
    run: ReturnType<typeof vi.fn>;
    stream: ReturnType<typeof vi.fn>;
  }> = {}
): Agent {
  return {
    name: 'test-agent',
    run: overrides.run ?? vi.fn(),
    stream: overrides.stream ?? vi.fn(),
  } as unknown as Agent;
}

/**
 * Create a successful AgentResponse
 */
function createSuccessResponse(output: string): AgentResponse {
  return {
    output,
    trace: {
      steps: [],
      iterations: 1,
      totalTokens: 100,
      durationMs: 500,
    },
    success: true,
  };
}

/**
 * Create a failed AgentResponse
 */
function createErrorResponse(error: string): AgentResponse {
  return {
    output: '',
    trace: {
      steps: [],
      iterations: 0,
      totalTokens: 0,
      durationMs: 0,
    },
    success: false,
    error,
  };
}

describe('useAgentStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty state', () => {
      const agent = createMockAgent();
      const { result } = renderHook(() => useAgentStream(agent));

      expect(result.current.messages).toEqual([]);
      expect(result.current.streamingContent).toBe('');
      expect(result.current.reasoning).toEqual([]);
      expect(result.current.trace).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('starts with initial messages if provided', () => {
      const agent = createMockAgent();
      const initialMessages = [{ id: '1', role: 'user' as const, content: 'Hello' }];

      const { result } = renderHook(() =>
        useAgentStream(agent, { initialMessages })
      );

      expect(result.current.messages).toEqual(initialMessages);
    });
  });

  describe('sendMessage', () => {
    it('adds user message immediately (optimistic UI)', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'done', response: createSuccessResponse('Hi!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      act(() => {
        result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.isLoading).toBe(true);
    });

    it('processes thought events', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'thought', content: 'Let me think...' },
        { type: 'done', response: createSuccessResponse('Done!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.reasoning).toHaveLength(1);
      expect(result.current.reasoning[0].type).toBe('thought');
      expect(result.current.reasoning[0].content).toBe('Let me think...');
    });

    it('processes action events', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'action', tool: 'search', input: { query: 'test' } },
        { type: 'done', response: createSuccessResponse('Done!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.reasoning).toHaveLength(1);
      expect(result.current.reasoning[0].type).toBe('action');
      expect(result.current.reasoning[0].tool).toBe('search');
      expect(result.current.reasoning[0].input).toEqual({ query: 'test' });
    });

    it('processes observation events', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'observation', result: 'Found 5 results', success: true },
        { type: 'done', response: createSuccessResponse('Done!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.reasoning).toHaveLength(1);
      expect(result.current.reasoning[0].type).toBe('observation');
      expect(result.current.reasoning[0].result).toBe('Found 5 results');
      expect(result.current.reasoning[0].success).toBe(true);
    });

    it('processes text events', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'text', content: 'Final answer' },
        { type: 'done', response: createSuccessResponse('Final answer') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      // Check streaming content during stream (before done)
      let streamingContentDuringStream = '';
      const originalStream = streamFn;
      streamFn.mockImplementation(function* () {
        yield { type: 'text', content: 'Final answer' };
        // Capture streaming content here would require more complex setup
        yield { type: 'done', response: createSuccessResponse('Final answer') };
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // After completion, streaming content is cleared
      expect(result.current.streamingContent).toBe('');
    });

    it('adds assistant message on done event', async () => {
      const response = createSuccessResponse('Hi there!');
      const events: StreamingAgentEvent[] = [{ type: 'done', response }];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[1].content).toBe('Hi there!');
      expect(result.current.trace).toEqual(response.trace);
    });

    it('processes complete ReAct chain', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'thought', content: 'I need to search for information' },
        { type: 'action', tool: 'search', input: { query: 'test' } },
        { type: 'observation', result: 'Found: result1, result2', success: true },
        { type: 'thought', content: 'Now I can answer' },
        { type: 'text', content: 'Based on my search...' },
        { type: 'done', response: createSuccessResponse('Based on my search...') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Search for test');
      });

      expect(result.current.reasoning).toHaveLength(4);
      expect(result.current.reasoning[0].type).toBe('thought');
      expect(result.current.reasoning[1].type).toBe('action');
      expect(result.current.reasoning[2].type).toBe('observation');
      expect(result.current.reasoning[3].type).toBe('thought');
    });

    it('sets error state on agent error response', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'done', response: createErrorResponse('Agent failed') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Agent failed');
    });

    it('sets error state on thrown exception', async () => {
      const streamFn = vi.fn().mockImplementation(async function* () {
        throw new Error('Stream error');
      });
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Stream error');
    });

    it('ignores empty messages', async () => {
      const streamFn = vi.fn();
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('');
        await result.current.sendMessage('   ');
      });

      expect(streamFn).not.toHaveBeenCalled();
      expect(result.current.messages).toHaveLength(0);
    });

    it('passes AbortSignal to agent.stream', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'done', response: createSuccessResponse('Hi!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(streamFn).toHaveBeenCalledWith('Hello', {
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('abort', () => {
    it('does not set error state on abort', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      const streamFn = vi.fn().mockImplementation(async function* () {
        throw abortError;
      });
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeNull();
    });

    it('resets loading state when abort is called', () => {
      // Use a never-yielding generator
      const streamFn = vi.fn().mockImplementation(async function* () {
        await new Promise(() => {}); // Never resolves
      });
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      act(() => {
        result.current.sendMessage('Hello');
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.abort();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.streamingContent).toBe('');
    });
  });

  describe('callbacks', () => {
    it('calls onError callback on error', async () => {
      const onError = vi.fn();
      const streamFn = vi.fn().mockImplementation(async function* () {
        throw new Error('Failed');
      });
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent, { onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls onThought callback on thought event', async () => {
      const onThought = vi.fn();
      const events: StreamingAgentEvent[] = [
        { type: 'thought', content: 'Thinking...' },
        { type: 'done', response: createSuccessResponse('Done') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent, { onThought }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onThought).toHaveBeenCalledWith('Thinking...');
    });

    it('calls onToolCall callback on action event', async () => {
      const onToolCall = vi.fn();
      const events: StreamingAgentEvent[] = [
        { type: 'action', tool: 'search', input: { q: 'test' } },
        { type: 'done', response: createSuccessResponse('Done') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent, { onToolCall }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onToolCall).toHaveBeenCalledWith('search', { q: 'test' });
    });

    it('calls onReasoning callback for all reasoning steps', async () => {
      const onReasoning = vi.fn();
      const events: StreamingAgentEvent[] = [
        { type: 'thought', content: 'Thinking...' },
        { type: 'action', tool: 'search', input: {} },
        { type: 'observation', result: 'Found', success: true },
        { type: 'done', response: createSuccessResponse('Done') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent, { onReasoning }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onReasoning).toHaveBeenCalledTimes(3);
      expect(onReasoning.mock.calls[0][0].type).toBe('thought');
      expect(onReasoning.mock.calls[1][0].type).toBe('action');
      expect(onReasoning.mock.calls[2][0].type).toBe('observation');
    });

    it('does not call onError on abort', async () => {
      const onError = vi.fn();
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      const streamFn = vi.fn().mockImplementation(async function* () {
        throw abortError;
      });
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent, { onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('clearMessages', () => {
    it('clears all state', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'thought', content: 'Thinking' },
        { type: 'done', response: createSuccessResponse('Hi!') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.reasoning).toHaveLength(1);
      expect(result.current.trace).not.toBeNull();

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.reasoning).toHaveLength(0);
      expect(result.current.trace).toBeNull();
      expect(result.current.streamingContent).toBe('');
      expect(result.current.error).toBeNull();
    });
  });

  describe('observation content formatting', () => {
    it('truncates long observation results', async () => {
      const longResult = 'x'.repeat(200);
      const events: StreamingAgentEvent[] = [
        { type: 'observation', result: longResult, success: true },
        { type: 'done', response: createSuccessResponse('Done') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Content should be truncated to 100 chars + "..."
      expect(result.current.reasoning[0].content).toMatch(/Result: x{100}\.\.\.$/);
      // But full result should be available
      expect(result.current.reasoning[0].result).toBe(longResult);
    });

    it('formats failed observation correctly', async () => {
      const events: StreamingAgentEvent[] = [
        { type: 'observation', result: 'Tool crashed', success: false },
        { type: 'done', response: createSuccessResponse('Done') },
      ];
      const streamFn = vi.fn().mockReturnValue(createMockStream(events));
      const agent = createMockAgent({ stream: streamFn });

      const { result } = renderHook(() => useAgentStream(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.reasoning[0].content).toBe('Error: Tool crashed');
      expect(result.current.reasoning[0].success).toBe(false);
    });
  });
});
