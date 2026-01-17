import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../src/agent/circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('closed state (normal operation)', () => {
    it('should allow requests when closed', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      const fn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      // Two failures
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(2);

      // One success resets count
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getFailureCount()).toBe(0);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should track consecutive failures', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      await expect(
        breaker.execute(() => Promise.reject(new Error('1')))
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(1);

      await expect(
        breaker.execute(() => Promise.reject(new Error('2')))
      ).rejects.toThrow();
      expect(breaker.getFailureCount()).toBe(2);

      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('state transitions', () => {
    it('should open after reaching failure threshold', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      // Three consecutive failures
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(() => Promise.reject(new Error(`fail ${i}`)))
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reject immediately when open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 10000,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('1')))
      ).rejects.toThrow();
      await expect(
        breaker.execute(() => Promise.reject(new Error('2')))
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Should reject with CircuitOpenError
      const fn = vi.fn().mockResolvedValue('success');
      await expect(breaker.execute(fn)).rejects.toThrow(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled(); // Function never called
    });

    it('should include remaining time in CircuitOpenError', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 10000,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();

      // Advance time by 3 seconds
      vi.advanceTimersByTime(3000);

      try {
        await breaker.execute(() => Promise.resolve('success'));
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenError);
        expect((error as CircuitOpenError).remainingMs).toBeCloseTo(7000, -2);
      }
    });

    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 5000,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Advance past timeout
      vi.advanceTimersByTime(5001);

      // Next request triggers transition to HALF_OPEN
      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      expect(fn).toHaveBeenCalled();
      expect(breaker.getState()).toBe('CLOSED'); // Success closes it
    });

    it('should close after successful half-open request', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        halfOpenRequests: 1,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();

      // Wait for half-open
      vi.advanceTimersByTime(1001);

      // Success in half-open should close
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
    });

    it('should re-open on failure in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        halfOpenRequests: 1,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();

      // Wait for half-open
      vi.advanceTimersByTime(1001);

      // Failure in half-open should re-open
      await expect(
        breaker.execute(() => Promise.reject(new Error('still failing')))
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('half-open behavior', () => {
    it('should require multiple successes when halfOpenRequests > 1', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        halfOpenRequests: 3,
      });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      vi.advanceTimersByTime(1001);

      // First success - still half-open
      await breaker.execute(() => Promise.resolve('1'));
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Second success - still half-open
      await breaker.execute(() => Promise.resolve('2'));
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Third success - now closed
      await breaker.execute(() => Promise.resolve('3'));
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('manual controls', () => {
    it('should reset to closed state', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });

      // Open the circuit
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Manual reset
      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);

      // Should accept requests again
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should manually trip open', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 5 });
      expect(breaker.getState()).toBe('CLOSED');

      breaker.trip();
      expect(breaker.getState()).toBe('OPEN');
    });
  });
});
