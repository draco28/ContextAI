import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgent } from '../../src/hooks/useAgent.js';
import type { Agent, AgentResponse } from '@contextai/core';

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
      iterations: 1,
      totalTokens: 50,
      durationMs: 100,
    },
    success: false,
    error,
  };
}

describe('useAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty messages', () => {
      const agent = createMockAgent();
      const { result } = renderHook(() => useAgent(agent));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('starts with initial messages if provided', () => {
      const agent = createMockAgent();
      const initialMessages = [{ id: '1', role: 'user' as const, content: 'Hello' }];

      const { result } = renderHook(() =>
        useAgent(agent, { initialMessages })
      );

      expect(result.current.messages).toEqual(initialMessages);
    });
  });

  describe('sendMessage', () => {
    it('adds user message immediately (optimistic UI)', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      // Start sending (don't await yet)
      act(() => {
        result.current.sendMessage('Hello');
      });

      // User message should be added immediately
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.isLoading).toBe(true);
    });

    it('adds assistant message after successful response', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi there!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[1].content).toBe('Hi there!');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on agent error response', async () => {
      const runFn = vi.fn().mockResolvedValue(createErrorResponse('Agent failed'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Agent failed');
      expect(result.current.isLoading).toBe(false);
      // User message should still be there
      expect(result.current.messages).toHaveLength(1);
    });

    it('sets error state on thrown exception', async () => {
      const runFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('ignores empty messages', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('');
        await result.current.sendMessage('   ');
      });

      expect(runFn).not.toHaveBeenCalled();
      expect(result.current.messages).toHaveLength(0);
    });

    it('trims message content', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('  Hello world  ');
      });

      expect(runFn).toHaveBeenCalledWith('Hello world', expect.anything());
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('returns the response on success', async () => {
      const response = createSuccessResponse('Response!');
      const runFn = vi.fn().mockResolvedValue(response);
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      let returnValue: AgentResponse | undefined;
      await act(async () => {
        returnValue = await result.current.sendMessage('Hello');
      });

      expect(returnValue).toEqual(response);
    });

    it('returns undefined on error', async () => {
      const runFn = vi.fn().mockRejectedValue(new Error('Oops'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      let returnValue: AgentResponse | undefined;
      await act(async () => {
        returnValue = await result.current.sendMessage('Hello');
      });

      expect(returnValue).toBeUndefined();
    });
  });

  describe('callbacks', () => {
    it('calls onError callback on error', async () => {
      const onError = vi.fn();
      const runFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent, { onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toBe('Failed');
    });

    it('calls onToolCall callback when tool is called', async () => {
      const onToolCall = vi.fn();
      const runFn = vi.fn().mockImplementation(async (_input, options) => {
        // Simulate tool call callback
        options?.callbacks?.onToolCall?.({
          type: 'toolCall',
          tool: 'search',
          input: { query: 'test' },
          iteration: 1,
          timestamp: Date.now(),
        });
        return createSuccessResponse('Done');
      });
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent, { onToolCall }));

      await act(async () => {
        await result.current.sendMessage('Search for test');
      });

      expect(onToolCall).toHaveBeenCalledWith('search', { query: 'test' });
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      // Send a message
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('clears error state', async () => {
      const runFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('message IDs', () => {
    it('generates unique IDs for each message', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useAgent(agent));

      await act(async () => {
        await result.current.sendMessage('First');
      });

      await act(async () => {
        await result.current.sendMessage('Second');
      });

      const ids = result.current.messages.map(m => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(4); // 2 user + 2 assistant
      ids.forEach(id => {
        expect(id).toMatch(/^msg-\d+-[a-z0-9]+$/);
      });
    });
  });
});
