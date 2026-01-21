import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryStrategy, RetryExhaustedError } from '../src/agent/retry';
import { ContextAIError } from '../src/errors/errors';

describe('RetryStrategy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful execution', () => {
    it('should return result on first try success', async () => {
      const retry = new RetryStrategy({ maxRetries: 3 });
      const fn = vi.fn().mockResolvedValue('success');

      const resultPromise = retry.execute(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should succeed after transient failures', async () => {
      const retry = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
      });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const resultPromise = retry.execute(fn);

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(1);
      // Wait for first retry delay (100ms)
      await vi.advanceTimersByTimeAsync(100);
      // Second attempt fails
      await vi.advanceTimersByTimeAsync(1);
      // Wait for second retry delay (200ms = 100 * 2^1)
      await vi.advanceTimersByTimeAsync(200);
      // Third attempt succeeds
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retry exhaustion', () => {
    it('should throw RetryExhaustedError after max retries', async () => {
      const retry = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 100,
        jitter: false,
      });
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const resultPromise = retry.execute(fn);

      // Attach handler BEFORE advancing timers to prevent unhandled rejection
      let caughtError: Error | undefined;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();

      expect(caughtError).toBeInstanceOf(RetryExhaustedError);
      expect((caughtError as RetryExhaustedError).attempts).toBe(3); // initial + 2 retries
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should include last error in RetryExhaustedError', async () => {
      const retry = new RetryStrategy({
        maxRetries: 1,
        baseDelayMs: 10,
        jitter: false,
      });
      const lastError = new Error('final error');
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('first error'))
        .mockRejectedValue(lastError);

      const resultPromise = retry.execute(fn);

      // Attach handler BEFORE advancing timers to prevent unhandled rejection
      let caughtError: Error | undefined;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();

      expect(caughtError).toBeInstanceOf(RetryExhaustedError);
      expect((caughtError as RetryExhaustedError).lastError.message).toBe(
        'final error'
      );
    });
  });

  describe('exponential backoff', () => {
    it('should calculate correct delays without jitter', () => {
      const retry = new RetryStrategy({
        baseDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        jitter: false,
      });

      expect(retry.calculateDelay(0)).toBe(1000); // 1000 * 2^0 = 1000
      expect(retry.calculateDelay(1)).toBe(2000); // 1000 * 2^1 = 2000
      expect(retry.calculateDelay(2)).toBe(4000); // 1000 * 2^2 = 4000
      expect(retry.calculateDelay(3)).toBe(8000); // 1000 * 2^3 = 8000
    });

    it('should cap delay at maxDelayMs', () => {
      const retry = new RetryStrategy({
        baseDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 5000,
        jitter: false,
      });

      expect(retry.calculateDelay(10)).toBe(5000); // Would be 1024000, capped at 5000
    });

    it('should apply jitter when enabled', () => {
      const retry = new RetryStrategy({
        baseDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000,
        jitter: true,
      });

      // With jitter, delay should be between 50% and 100% of calculated
      const delays = Array.from({ length: 100 }, () => retry.calculateDelay(0));
      const min = Math.min(...delays);
      const max = Math.max(...delays);

      expect(min).toBeGreaterThanOrEqual(500); // 1000 * 0.5
      expect(max).toBeLessThanOrEqual(1000); // 1000 * 1.0
    });
  });

  describe('retryable errors', () => {
    it('should retry all errors by default', async () => {
      const retry = new RetryStrategy({
        maxRetries: 1,
        baseDelayMs: 10,
        jitter: false,
      });
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('random error'))
        .mockResolvedValue('success');

      const resultPromise = retry.execute(fn);
      await vi.runAllTimersAsync();

      expect(await resultPromise).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should only retry specified error codes', async () => {
      const retry = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 10,
        jitter: false,
        retryableErrors: ['NETWORK_ERROR'],
      });

      const nonRetryableError = new ContextAIError(
        'Not retryable',
        'VALIDATION_ERROR'
      );
      const fn = vi.fn().mockRejectedValue(nonRetryableError);

      // Non-retryable errors reject immediately without delay
      await expect(retry.execute(fn)).rejects.toThrow('Not retryable');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry matching error codes', async () => {
      const retry = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 10,
        jitter: false,
        retryableErrors: ['NETWORK_ERROR'],
      });

      const retryableError = new ContextAIError(
        'Network failed',
        'NETWORK_ERROR'
      );
      const fn = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const resultPromise = retry.execute(fn);
      await vi.runAllTimersAsync();

      expect(await resultPromise).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('abort signal', () => {
    it('should abort before first attempt', async () => {
      const retry = new RetryStrategy({ maxRetries: 3 });
      const controller = new AbortController();
      controller.abort();

      const fn = vi.fn().mockResolvedValue('success');
      const resultPromise = retry.execute(fn, controller.signal);

      await expect(resultPromise).rejects.toThrow('Retry aborted');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should abort during delay', async () => {
      const retry = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1000,
        jitter: false,
      });
      const controller = new AbortController();
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      const resultPromise = retry.execute(fn, controller.signal);

      // First attempt fails, then enters delay
      await vi.advanceTimersByTimeAsync(1);
      // Abort during delay - the promise should reject
      controller.abort();

      // Now await the rejection
      await expect(resultPromise).rejects.toThrow('Retry aborted');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
