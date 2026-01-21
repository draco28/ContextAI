import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChat } from '../../src/hooks/useChat.js';
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

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty messages and default state', () => {
      const agent = createMockAgent();
      const { result } = renderHook(() => useChat(agent));

      expect(result.current.messages).toEqual([]);
      expect(result.current.streamingContent).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('starts with initial messages if provided', () => {
      const agent = createMockAgent();
      const initialMessages = [{ id: '1', role: 'user' as const, content: 'Hello' }];

      const { result } = renderHook(() =>
        useChat(agent, { initialMessages })
      );

      expect(result.current.messages).toEqual(initialMessages);
    });
  });

  describe('sendMessage', () => {
    it('adds user message immediately (optimistic UI)', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      act(() => {
        result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.isLoading).toBe(true);
    });

    it('adds assistant message after successful response', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi there!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

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

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Agent failed');
    });

    it('sets error state on thrown exception', async () => {
      const runFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('ignores empty messages', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

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

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('  Hello world  ');
      });

      expect(runFn).toHaveBeenCalledWith('Hello world', expect.anything());
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('passes AbortSignal to agent.run', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(runFn).toHaveBeenCalledWith('Hello', {
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('abort', () => {
    it('does not set error state on abort', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      const runFn = vi.fn().mockRejectedValue(abortError);
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // AbortError should NOT set error state
      expect(result.current.error).toBeNull();
    });

    it('resets loading state when abort is called', async () => {
      // Use a never-resolving promise to simulate long request
      const runFn = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      // Start request (don't await)
      act(() => {
        result.current.sendMessage('Hello');
      });

      expect(result.current.isLoading).toBe(true);

      // Abort
      act(() => {
        result.current.abort();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.streamingContent).toBe('');
    });

    it('cancels previous request when sending new message', async () => {
      let abortSignals: AbortSignal[] = [];
      const runFn = vi.fn().mockImplementation((_input, options) => {
        abortSignals.push(options.signal);
        return new Promise((resolve) => {
          setTimeout(() => resolve(createSuccessResponse('Done')), 100);
        });
      });
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      // Start first request
      act(() => {
        result.current.sendMessage('First');
      });

      // Start second request (should abort first)
      act(() => {
        result.current.sendMessage('Second');
      });

      // First signal should be aborted
      expect(abortSignals[0].aborted).toBe(true);
      // Second signal should not be aborted
      expect(abortSignals[1].aborted).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('calls onError callback on error', async () => {
      const onError = vi.fn();
      const runFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent, { onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls onFinish callback on success', async () => {
      const onFinish = vi.fn();
      const response = createSuccessResponse('Done!');
      const runFn = vi.fn().mockResolvedValue(response);
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent, { onFinish }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onFinish).toHaveBeenCalledWith(response);
    });

    it('calls onStream callback with final content', async () => {
      const onStream = vi.fn();
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Response text'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent, { onStream }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onStream).toHaveBeenCalledWith('Response text');
    });

    it('does not call onError on abort', async () => {
      const onError = vi.fn();
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      const runFn = vi.fn().mockRejectedValue(abortError);
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent, { onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('setMessages', () => {
    it('allows setting messages externally', async () => {
      const agent = createMockAgent();
      const { result } = renderHook(() => useChat(agent));

      act(() => {
        result.current.setMessages([
          { id: '1', role: 'user', content: 'Loaded from storage' },
        ]);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Loaded from storage');
    });

    it('allows updating messages with function', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });
      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      act(() => {
        result.current.setMessages(prev => [
          ...prev,
          { id: 'custom', role: 'system' as const, content: 'System note' },
        ]);
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[2].content).toBe('System note');
    });
  });

  describe('clearMessages', () => {
    it('clears all messages and state', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.streamingContent).toBe('');
      expect(result.current.error).toBeNull();
    });
  });

  describe('message IDs', () => {
    it('generates unique IDs for each message', async () => {
      const runFn = vi.fn().mockResolvedValue(createSuccessResponse('Hi!'));
      const agent = createMockAgent({ run: runFn });

      const { result } = renderHook(() => useChat(agent));

      await act(async () => {
        await result.current.sendMessage('First');
      });

      await act(async () => {
        await result.current.sendMessage('Second');
      });

      const ids = result.current.messages.map(m => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(4);
      ids.forEach(id => {
        expect(id).toMatch(/^msg-\d+-[a-z0-9]+$/);
      });
    });
  });
});
