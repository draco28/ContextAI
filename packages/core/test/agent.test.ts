import { describe, it, expect, vi } from 'vitest';
import { Agent, defineTool } from '../src';
import type { LLMProvider, ChatResponse } from '../src';
import { z } from 'zod';

// Mock LLM Provider for testing
function createMockProvider(responses: ChatResponse[]): LLMProvider {
  let callIndex = 0;

  return {
    name: 'mock',
    model: 'mock-model',
    async chat() {
      const response = responses[callIndex];
      if (!response) {
        throw new Error('No more mock responses');
      }
      callIndex++;
      return response;
    },
    async *streamChat() {
      yield { type: 'text' as const, content: 'streamed' };
      yield { type: 'done' as const };
    },
    async isAvailable() {
      return true;
    },
  };
}

describe('Agent', () => {
  it('should create an agent with config', () => {
    const mockProvider = createMockProvider([]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a test assistant.',
      llm: mockProvider,
    });

    expect(agent.name).toBe('TestAgent');
  });

  it('should run and return a response', async () => {
    const mockProvider = createMockProvider([
      {
        content: 'Hello! I am a test response.',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a test assistant.',
      llm: mockProvider,
    });

    const response = await agent.run('Hello');

    expect(response.success).toBe(true);
    expect(response.output).toBe('Hello! I am a test response.');
    expect(response.trace.iterations).toBe(1);
    expect(response.trace.totalTokens).toBe(15);
  });

  it('should handle errors gracefully', async () => {
    const mockProvider: LLMProvider = {
      name: 'mock',
      model: 'mock-model',
      async chat() {
        throw new Error('API Error');
      },
      async *streamChat() {
        throw new Error('API Error');
      },
      async isAvailable() {
        return true;
      },
    };

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a test assistant.',
      llm: mockProvider,
    });

    const response = await agent.run('Hello');

    expect(response.success).toBe(false);
    expect(response.error).toContain('API Error');
  });

  it('should execute tools when called', async () => {
    const executeFn = vi.fn().mockResolvedValue({
      success: true,
      data: { result: 42 },
    });

    const calculatorTool = defineTool({
      name: 'calculator',
      description: 'Perform calculations',
      parameters: z.object({
        expression: z.string(),
      }),
      execute: executeFn,
    });

    const mockProvider = createMockProvider([
      // First response: tool call
      {
        content: 'Let me calculate that.',
        toolCalls: [
          { id: 'call-1', name: 'calculator', arguments: { expression: '2+2' } },
        ],
        finishReason: 'tool_calls',
      },
      // Second response: final answer
      {
        content: 'The result is 42.',
        finishReason: 'stop',
      },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a calculator assistant.',
      llm: mockProvider,
      tools: [calculatorTool],
    });

    const response = await agent.run('What is 2+2?');

    expect(response.success).toBe(true);
    expect(response.output).toBe('The result is 42.');
    expect(executeFn).toHaveBeenCalledWith(
      { expression: '2+2' },
      expect.any(Object)
    );

    // Check trace has the expected steps
    const steps = response.trace.steps;
    expect(steps.some((s) => s.type === 'thought')).toBe(true);
    expect(steps.some((s) => s.type === 'action')).toBe(true);
    expect(steps.some((s) => s.type === 'observation')).toBe(true);
  });
});

describe('defineTool', () => {
  it('should create a tool with validation', () => {
    const tool = defineTool({
      name: 'greet',
      description: 'Greet someone',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => ({
        success: true,
        data: `Hello, ${name}!`,
      }),
    });

    expect(tool.name).toBe('greet');
    expect(tool.description).toBe('Greet someone');
  });

  it('should validate input', async () => {
    const tool = defineTool({
      name: 'greet',
      description: 'Greet someone',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => ({
        success: true,
        data: `Hello, ${name}!`,
      }),
    });

    const validResult = tool.validate({ name: 'World' });
    expect(validResult.success).toBe(true);

    const invalidResult = tool.validate({ name: 123 });
    expect(invalidResult.success).toBe(false);
  });

  it('should execute with validated input', async () => {
    const tool = defineTool({
      name: 'greet',
      description: 'Greet someone',
      parameters: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => ({
        success: true,
        data: `Hello, ${name}!`,
      }),
    });

    const result = await tool.execute({ name: 'World' });
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello, World!');
  });

  it('should convert to JSON schema', () => {
    const tool = defineTool({
      name: 'search',
      description: 'Search for info',
      parameters: z.object({
        query: z.string(),
        limit: z.number().optional(),
      }),
      execute: async () => ({ success: true, data: [] }),
    });

    const json = tool.toJSON();
    expect(json.name).toBe('search');
    expect(json.description).toBe('Search for info');
    expect(json.parameters).toEqual({
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
      additionalProperties: false,
    });
  });
});
