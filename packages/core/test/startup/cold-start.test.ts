/**
 * Cold Start Time Tests (NFR-104)
 *
 * Measures actual cold-start performance by using performance.now().
 * This provides real-world timing data for Agent initialization.
 *
 * NFR-104 Target: Agent initialization <500ms (excluding model loading)
 */

import { describe, it, expect } from 'vitest';

// Mock LLM provider for testing (no actual API calls)
const mockLLM = {
  name: 'mock',
  model: 'mock-model',
  chat: async () => ({
    content: 'mock response',
    usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  }),
  streamChat: async function* () {
    yield { type: 'text' as const, content: 'mock response' };
    yield { type: 'done' as const };
  },
  isAvailable: async () => true,
};

describe('NFR-104: Startup Time', () => {
  it('should profile sub-entry point import times', async () => {
    const components = [
      '@contextai/core', // Full package
      '@contextai/core/agent', // Just agent
      '@contextai/core/security', // Just security utilities
      '@contextai/core/tool', // Just tool framework
      '@contextai/core/errors', // Just errors
    ];

    console.log('\n--- Core Sub-Entry Point Import Times ---');

    for (const component of components) {
      const start = performance.now();
      await import(component);
      const elapsed = performance.now() - start;
      console.log(`${component}: ${elapsed.toFixed(3)}ms`);
    }

    console.log('-----------------------------------------\n');
  });

  it('should initialize Agent in under 500ms', async () => {
    // Import and measure
    const importStart = performance.now();
    const { Agent } = await import('@contextai/core');
    const importTime = performance.now() - importStart;

    // Create agent and measure
    const initStart = performance.now();
    const agent = new Agent({
      name: 'benchmark-agent',
      llm: mockLLM as never,
      systemPrompt: 'You are a helpful assistant.',
    });
    const initTime = performance.now() - initStart;

    // Total time
    const totalTime = importTime + initTime;

    // Log results for visibility
    console.log('\n--- NFR-104 Startup Time Results ---');
    console.log(`Import time (cached):  ${importTime.toFixed(3)}ms`);
    console.log(`Agent init time:       ${initTime.toFixed(3)}ms`);
    console.log(`Total time:            ${totalTime.toFixed(3)}ms`);
    console.log('------------------------------------\n');

    // Assert NFR-104 requirement
    expect(initTime).toBeLessThan(500);

    // Cleanup
    void agent;
  });

  it('should initialize Agent with 10 tools in under 500ms', async () => {
    const { Agent } = await import('@contextai/core');

    const tools = Array.from({ length: 10 }, (_, i) => ({
      name: `tool_${i}`,
      description: `Test tool ${i}`,
      parameters: { type: 'object' as const, properties: {} },
      execute: async () => `result_${i}`,
    }));

    const start = performance.now();
    const agent = new Agent({
      name: 'benchmark-agent',
      llm: mockLLM as never,
      systemPrompt: 'You are a helpful assistant.',
      tools,
    });
    const elapsed = performance.now() - start;

    console.log(`Agent with 10 tools: ${elapsed.toFixed(3)}ms`);
    expect(elapsed).toBeLessThan(500);

    void agent;
  });

  it('should initialize Agent with context in under 500ms', async () => {
    const { Agent } = await import('@contextai/core');

    const start = performance.now();
    const agent = new Agent({
      name: 'benchmark-agent',
      llm: mockLLM as never,
      systemPrompt: 'You are a helpful assistant.',
      maxContextTokens: 4096,
      context: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help you today?' },
      ],
    });
    const elapsed = performance.now() - start;

    console.log(`Agent with context: ${elapsed.toFixed(3)}ms`);
    expect(elapsed).toBeLessThan(500);

    void agent;
  });

  it('should measure multiple initialization cycles', async () => {
    const { Agent } = await import('@contextai/core');

    const times: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const agent = new Agent({
        name: `agent-${i}`,
        llm: mockLLM as never,
        systemPrompt: 'Test',
      });
      times.push(performance.now() - start);
      void agent;
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p99 = times.sort((a, b) => a - b)[Math.floor(iterations * 0.99)];

    console.log('\n--- Agent Init Statistics (100 iterations) ---');
    console.log(`Average: ${avg.toFixed(3)}ms`);
    console.log(`Min:     ${min.toFixed(3)}ms`);
    console.log(`Max:     ${max.toFixed(3)}ms`);
    console.log(`P99:     ${p99.toFixed(3)}ms`);
    console.log('----------------------------------------------\n');

    // P99 should still be under target
    expect(p99).toBeLessThan(500);
  });
});
