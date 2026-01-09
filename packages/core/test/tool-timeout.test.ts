import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  defineTool,
  ToolTimeoutError,
  ToolOutputValidationError,
} from '../src';
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

describe('Output Validation', () => {
  it('should validate output against schema when provided', async () => {
    const tool = defineTool({
      name: 'typedTool',
      description: 'Returns typed data',
      parameters: z.object({}),
      outputSchema: z.object({
        id: z.number(),
        name: z.string(),
      }),
      execute: async () => {
        return { success: true, data: { id: 1, name: 'test' } };
      },
    });

    const result = await tool.execute({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: 'test' });
  });

  it('should throw ToolOutputValidationError on invalid output', async () => {
    const tool = defineTool({
      name: 'badOutputTool',
      description: 'Returns invalid data',
      parameters: z.object({}),
      outputSchema: z.object({
        id: z.number(),
        name: z.string(),
      }),
      execute: async () => {
        // Return wrong type - id should be number, not string
        return {
          success: true,
          data: { id: 'not-a-number', name: 123 } as any,
        };
      },
    });

    await expect(tool.execute({})).rejects.toThrow(ToolOutputValidationError);
    await expect(tool.execute({})).rejects.toMatchObject({
      toolName: 'badOutputTool',
      code: 'TOOL_OUTPUT_VALIDATION_ERROR',
    });
  });

  it('should skip output validation when no schema provided', async () => {
    const tool = defineTool({
      name: 'noSchemaTool',
      description: 'No output schema',
      parameters: z.object({}),
      // No outputSchema - any output is valid
      execute: async () => {
        return { success: true, data: { anything: 'goes' } };
      },
    });

    const result = await tool.execute({});
    expect(result.success).toBe(true);
  });

  it('should skip output validation on failed execution', async () => {
    const tool = defineTool({
      name: 'failingTool',
      description: 'Always fails',
      parameters: z.object({}),
      outputSchema: z.object({
        id: z.number(),
      }),
      execute: async () => {
        return { success: false, error: 'Something went wrong' };
      },
    });

    const result = await tool.execute({});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });

  it('should include validation issues in error', async () => {
    const tool = defineTool({
      name: 'issuesTool',
      description: 'Check issues',
      parameters: z.object({}),
      outputSchema: z.object({
        count: z.number().min(0),
        items: z.array(z.string()),
      }),
      execute: async () => {
        return {
          success: true,
          data: { count: -5, items: 'not-an-array' } as any,
        };
      },
    });

    try {
      await tool.execute({});
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ToolOutputValidationError);
      const validationError = error as ToolOutputValidationError;
      expect(validationError.issues.length).toBeGreaterThan(0);
      expect(validationError.issues.some((i) => i.path === 'count')).toBe(true);
      expect(validationError.issues.some((i) => i.path === 'items')).toBe(true);
    }
  });
});
