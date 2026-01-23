/**
 * Startup Time Benchmarks (NFR-104)
 *
 * Measures cold-start performance of ContextAI SDK packages.
 * Target: Agent initialization <500ms (excluding model loading)
 *
 * Run with: pnpm --filter @contextaisdk/core exec vitest bench
 */

import { bench, describe } from 'vitest';
import { Agent } from '@contextaisdk/core';

// Mock LLM provider for testing (no actual API calls)
const mockLLM = {
  chat: async () => ({
    content: 'mock response',
    usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  }),
  streamChat: async function* () {
    yield { content: 'mock', done: false };
    yield { content: ' response', done: true };
  },
};

describe('Package Import Time', () => {
  /**
   * Measures the time to import @contextaisdk/core.
   * Note: After first import, this measures cached module access.
   * For true cold-start measurement, see standalone-cold-start.ts
   */
  bench(
    '@contextaisdk/core import (cached)',
    async () => {
      const { Agent } = await import('@contextaisdk/core');
      void Agent;
    },
    {
      warmupIterations: 5,
      iterations: 100,
    }
  );
});

describe('Agent Initialization Time', () => {
  /**
   * Measures time to instantiate a minimal Agent.
   * This is the core metric for NFR-104.
   *
   * NFR-104 Target: <500ms for Agent initialization
   */
  bench(
    'new Agent() - minimal config',
    () => {
      const agent = new Agent({
        name: 'benchmark-agent',
        llm: mockLLM as never,
        systemPrompt: 'You are a helpful assistant.',
      });
      void agent;
    },
    {
      warmupIterations: 10,
      iterations: 1000,
    }
  );

  /**
   * Measures time to instantiate an Agent with tools.
   * Tools are stored by reference, so this should be fast.
   */
  bench(
    'new Agent() - with 10 tools',
    () => {
      const tools = Array.from({ length: 10 }, (_, i) => ({
        name: `tool_${i}`,
        description: `Test tool ${i}`,
        parameters: { type: 'object' as const, properties: {} },
        execute: async () => `result_${i}`,
      }));

      const agent = new Agent({
        name: 'benchmark-agent',
        llm: mockLLM as never,
        systemPrompt: 'You are a helpful assistant.',
        tools,
      });
      void agent;
    },
    {
      warmupIterations: 10,
      iterations: 1000,
    }
  );

  /**
   * Measures Agent initialization with conversation context.
   * Context management adds a small overhead.
   */
  bench(
    'new Agent() - with context',
    () => {
      const agent = new Agent({
        name: 'benchmark-agent',
        llm: mockLLM as never,
        systemPrompt: 'You are a helpful assistant.',
        maxContextTokens: 4096,
        context: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      });
      void agent;
    },
    {
      warmupIterations: 10,
      iterations: 1000,
    }
  );
});

describe('Cold Start Simulation', () => {
  /**
   * Simulates a "cold start" by measuring everything from import to ready.
   * This is the end-to-end metric users will experience.
   */
  bench(
    'cold start: import + Agent creation',
    async () => {
      const { Agent: AgentClass } = await import('@contextaisdk/core');

      const agent = new AgentClass({
        name: 'cold-start-agent',
        llm: mockLLM as never,
        systemPrompt: 'Test',
      });

      void agent;
    },
    {
      warmupIterations: 3,
      iterations: 50,
    }
  );
});
