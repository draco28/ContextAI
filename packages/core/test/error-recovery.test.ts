import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorRecovery } from '../src/agent/error-recovery';
import { RetryExhaustedError } from '../src/agent/retry';
import { CircuitOpenError } from '../src/agent/circuit-breaker';

describe('ErrorRecovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful execution', () => {
    it('should return success result on first try', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 3 },
      });

      const resultPromise = recovery.execute(() => Promise.resolve('data'));
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('data');
      expect(result.attempts).toBe(1);
      expect(result.usedFallback).toBe(false);
    });

    it('should succeed after retries', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 3, baseDelayMs: 10, jitter: false },
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resultPromise = recovery.execute(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(2);
    });
  });

  describe('fallback behavior', () => {
    it('should use fallback when all retries exhausted', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 2, baseDelayMs: 10, jitter: false },
        recovery: { fallbackResponse: 'fallback value' },
      });

      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const resultPromise = recovery.execute(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('fallback value');
      expect(result.usedFallback).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it('should return failure when no fallback configured', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 1, baseDelayMs: 10, jitter: false },
      });

      const fn = vi.fn().mockRejectedValue(new Error('permanent failure'));

      const resultPromise = recovery.execute(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('attempts failed');
      expect(result.usedFallback).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should invoke onError callback on final failure', async () => {
      const onError = vi.fn();
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 1, baseDelayMs: 10, jitter: false },
        recovery: { onError },
      });

      const fn = vi.fn().mockRejectedValue(new Error('test error'));

      const resultPromise = recovery.execute(fn, { toolName: 'testTool' });
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'testTool',
          attempt: 2,
          maxRetries: 1,
        })
      );
    });

    it('should include elapsed time in error context', async () => {
      const onError = vi.fn();
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 0 },
        recovery: { onError },
      });

      vi.advanceTimersByTime(1000); // Advance time before execution
      const startTime = Date.now();

      const resultPromise = recovery.execute(() =>
        Promise.reject(new Error('fail'))
      );
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          elapsedMs: expect.any(Number),
        })
      );
    });
  });

  describe('circuit breaker integration', () => {
    it('should use circuit breaker when configured', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 0 },
        circuitBreaker: { failureThreshold: 2, resetTimeoutMs: 5000 },
      });

      // First two failures open the circuit
      await recovery.execute(() => Promise.reject(new Error('fail 1')));
      await recovery.execute(() => Promise.reject(new Error('fail 2')));

      // Circuit should be open now
      const breaker = recovery.getCircuitBreaker();
      expect(breaker?.getState()).toBe('OPEN');

      // Next request should fail fast with CircuitOpenError
      const result = await recovery.execute(() =>
        Promise.resolve('should not run')
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(CircuitOpenError);
    });

    it('should recover after circuit breaker timeout', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 0 },
        circuitBreaker: {
          failureThreshold: 1,
          resetTimeoutMs: 1000,
          halfOpenRequests: 1,
        },
      });

      // Open the circuit
      await recovery.execute(() => Promise.reject(new Error('fail')));
      expect(recovery.getCircuitBreaker()?.getState()).toBe('OPEN');

      // Wait for reset timeout
      vi.advanceTimersByTime(1001);

      // Should allow request and close on success
      const result = await recovery.execute(() => Promise.resolve('recovered'));
      expect(result.success).toBe(true);
      expect(result.value).toBe('recovered');
      expect(recovery.getCircuitBreaker()?.getState()).toBe('CLOSED');
    });
  });

  describe('executeOrThrow', () => {
    it('should return value on success', async () => {
      const recovery = new ErrorRecovery();

      const result = await recovery.executeOrThrow(() =>
        Promise.resolve('data')
      );

      expect(result).toBe('data');
    });

    it('should throw on failure', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 0 },
      });

      await expect(
        recovery.executeOrThrow(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow(RetryExhaustedError);
    });
  });

  describe('wrap helper', () => {
    it('should create wrapped function with error recovery', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 1, baseDelayMs: 10, jitter: false },
      });

      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('first fail'))
        .mockResolvedValue('success');

      const wrappedFn = recovery.wrap(originalFn, { toolName: 'wrapped' });

      const resultPromise = wrappedFn('arg1', 'arg2');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('abort signal', () => {
    it('should respect abort signal', async () => {
      const recovery = new ErrorRecovery({
        retry: { maxRetries: 3, baseDelayMs: 1000 },
      });

      const controller = new AbortController();
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      const resultPromise = recovery.execute(fn, {}, controller.signal);

      // First attempt fails, then abort during delay
      await vi.advanceTimersByTimeAsync(1);
      controller.abort();
      await vi.advanceTimersByTimeAsync(1);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('aborted');
    });
  });
});
