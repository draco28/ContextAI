import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineTool, ToolTimeoutError } from '../src';
import { z } from 'zod';

describe('Tool Timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use default 30s timeout', async () => {
    const tool = defineTool({
      name: 'slowTool',
      description: 'Takes forever',
      parameters: z.object({}),
      execute: async () => {
        // This would take 60 seconds - longer than default timeout
        await new Promise((resolve) => setTimeout(resolve, 60_000));
        return { success: true, data: 'done' };
      },
    });

    const promise = tool.execute({});

    // Advance time past the 30s default timeout
    vi.advanceTimersByTime(30_001);

    await expect(promise).rejects.toThrow(ToolTimeoutError);
    await expect(promise).rejects.toMatchObject({
      timeoutMs: 30_000,
      toolName: 'slowTool',
    });
  });

  it('should use custom timeout from config', async () => {
    const tool = defineTool({
      name: 'quickTool',
      description: 'Quick timeout',
      parameters: z.object({}),
      timeout: 5_000, // 5 second timeout
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return { success: true, data: 'done' };
      },
    });

    const promise = tool.execute({});
    vi.advanceTimersByTime(5_001);

    await expect(promise).rejects.toThrow(ToolTimeoutError);
    await expect(promise).rejects.toMatchObject({ timeoutMs: 5_000 });
  });

  it('should allow runtime timeout override', async () => {
    const tool = defineTool({
      name: 'tool',
      description: 'Tool',
      parameters: z.object({}),
      timeout: 30_000, // 30s default
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return { success: true, data: 'done' };
      },
    });

    // Override to 2s at runtime
    const promise = tool.execute({}, { timeout: 2_000 });
    vi.advanceTimersByTime(2_001);

    await expect(promise).rejects.toMatchObject({ timeoutMs: 2_000 });
  });

  it('should complete before timeout', async () => {
    const tool = defineTool({
      name: 'fastTool',
      description: 'Fast',
      parameters: z.object({}),
      timeout: 5_000,
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, data: 'fast result' };
      },
    });

    const promise = tool.execute({});
    vi.advanceTimersByTime(101);

    const result = await promise;
    expect(result.success).toBe(true);
    expect(result.data).toBe('fast result');
  });

  it('should pass abort signal to tool on timeout', async () => {
    let receivedSignal: AbortSignal | undefined;

    const tool = defineTool({
      name: 'signalTool',
      description: 'Checks signal',
      parameters: z.object({}),
      timeout: 1_000,
      execute: async (_, context) => {
        receivedSignal = context.signal;
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        return { success: true, data: 'done' };
      },
    });

    const promise = tool.execute({});
    vi.advanceTimersByTime(1_001);

    await expect(promise).rejects.toThrow(ToolTimeoutError);
    expect(receivedSignal?.aborted).toBe(true);
  });

  it('should cleanup timer after successful execution', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const tool = defineTool({
      name: 'tool',
      description: 'Tool',
      parameters: z.object({}),
      timeout: 5_000,
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, data: 'done' };
      },
    });

    const promise = tool.execute({});
    vi.advanceTimersByTime(101);
    await promise;

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
