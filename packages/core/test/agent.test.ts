import { describe, it, expect, vi } from 'vitest';
import {
  Agent,
  defineTool,
  formatTrace,
  getTraceStats,
  formatTraceJSON,
} from '../src';
import type {
  LLMProvider,
  ChatResponse,
  ReActTrace,
  StreamingAgentEvent,
} from '../src';
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
      const response = responses[callIndex];
      if (!response) {
        throw new Error('No more mock responses');
      }
      callIndex++;

      // Yield text content as chunks
      if (response.content) {
        yield { type: 'text' as const, content: response.content };
      }

      // Yield tool calls as chunks
      if (response.toolCalls) {
        for (const toolCall of response.toolCalls) {
          yield {
            type: 'tool_call' as const,
            toolCall: {
              id: toolCall.id,
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.arguments),
            },
          };
        }
      }

      // Yield usage if present
      if (response.usage) {
        yield { type: 'usage' as const, usage: response.usage };
      }

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
          {
            id: 'call-1',
            name: 'calculator',
            arguments: { expression: '2+2' },
          },
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

describe('Event Callbacks', () => {
  it('should call onThought when thought is generated', async () => {
    const onThought = vi.fn();

    const mockProvider = createMockProvider([
      {
        content: 'I need to think about this.',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a test assistant.',
      llm: mockProvider,
      callbacks: { onThought },
    });

    await agent.run('Hello');

    expect(onThought).toHaveBeenCalled();
    expect(onThought.mock.calls[0][0]).toMatchObject({
      type: 'thought',
      content: 'I need to think about this.',
    });
    expect(onThought.mock.calls[0][0].iteration).toBe(1);
    expect(onThought.mock.calls[0][0].timestamp).toBeTypeOf('number');
  });

  it('should call onAction and onToolCall before tool execution', async () => {
    const onAction = vi.fn();
    const onToolCall = vi.fn();

    const calculatorTool = defineTool({
      name: 'calculator',
      description: 'Perform calculations',
      parameters: z.object({ expression: z.string() }),
      execute: async () => ({ success: true, data: 42 }),
    });

    const mockProvider = createMockProvider([
      {
        content: 'Let me calculate.',
        toolCalls: [
          {
            id: 'call-1',
            name: 'calculator',
            arguments: { expression: '2+2' },
          },
        ],
        finishReason: 'tool_calls',
      },
      {
        content: 'The answer is 42.',
        finishReason: 'stop',
      },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a calculator.',
      llm: mockProvider,
      tools: [calculatorTool],
      callbacks: { onAction, onToolCall },
    });

    await agent.run('Calculate 2+2');

    expect(onAction).toHaveBeenCalled();
    expect(onAction.mock.calls[0][0]).toMatchObject({
      type: 'action',
      tool: 'calculator',
      input: { expression: '2+2' },
    });

    expect(onToolCall).toHaveBeenCalled();
    expect(onToolCall.mock.calls[0][0]).toMatchObject({
      type: 'toolCall',
      tool: 'calculator',
      input: { expression: '2+2' },
    });
  });

  it('should call onObservation after tool execution with durationMs', async () => {
    const onObservation = vi.fn();

    const calculatorTool = defineTool({
      name: 'calculator',
      description: 'Perform calculations',
      parameters: z.object({ expression: z.string() }),
      execute: async () => ({ success: true, data: 42 }),
    });

    const mockProvider = createMockProvider([
      {
        content: 'Calculating...',
        toolCalls: [
          {
            id: 'call-1',
            name: 'calculator',
            arguments: { expression: '2+2' },
          },
        ],
        finishReason: 'tool_calls',
      },
      { content: 'Done.', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Calculator',
      llm: mockProvider,
      tools: [calculatorTool],
      callbacks: { onObservation },
    });

    await agent.run('Calculate');

    expect(onObservation).toHaveBeenCalled();
    const event = onObservation.mock.calls[0][0];
    expect(event.type).toBe('observation');
    expect(event.tool).toBe('calculator');
    expect(event.success).toBe(true);
    expect(event.durationMs).toBeTypeOf('number');
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should support async callbacks', async () => {
    const events: string[] = [];
    const onThought = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 1));
      events.push('thought');
    });

    const mockProvider = createMockProvider([
      { content: 'Thinking...', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      callbacks: { onThought },
    });

    await agent.run('Test');

    expect(events).toContain('thought');
  });

  it('should merge runtime callbacks with constructor callbacks', async () => {
    const constructorOnThought = vi.fn();
    const runtimeOnThought = vi.fn();

    const mockProvider = createMockProvider([
      { content: 'Test', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      callbacks: { onThought: constructorOnThought },
    });

    await agent.run('Test', {
      callbacks: { onThought: runtimeOnThought },
    });

    // Runtime callback should override constructor callback
    expect(constructorOnThought).not.toHaveBeenCalled();
    expect(runtimeOnThought).toHaveBeenCalled();
  });
});

describe('True Streaming', () => {
  it('should yield events in order: thought -> text -> done', async () => {
    const mockProvider = createMockProvider([
      {
        content: 'Thinking about your question.',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are helpful.',
      llm: mockProvider,
    });

    const events: StreamingAgentEvent[] = [];
    for await (const event of agent.stream('Hello')) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].type).toBe('thought');
    expect(events[events.length - 1].type).toBe('done');

    // Check done event has response
    const doneEvent = events.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === 'done') {
      expect(doneEvent.response.success).toBe(true);
      expect(doneEvent.response.trace.iterations).toBe(1);
    }
  });

  it('should yield action and observation events for tool calls', async () => {
    const calculatorTool = defineTool({
      name: 'calculator',
      description: 'Calculate',
      parameters: z.object({ expression: z.string() }),
      execute: async () => ({ success: true, data: 42 }),
    });

    const mockProvider = createMockProvider([
      {
        content: 'Let me calculate.',
        toolCalls: [
          {
            id: 'call-1',
            name: 'calculator',
            arguments: { expression: '2+2' },
          },
        ],
        finishReason: 'tool_calls',
      },
      { content: 'The answer is 42.', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Calculator',
      llm: mockProvider,
      tools: [calculatorTool],
    });

    const events: StreamingAgentEvent[] = [];
    for await (const event of agent.stream('Calculate 2+2')) {
      events.push(event);
    }

    const actionEvent = events.find((e) => e.type === 'action');
    const observationEvent = events.find((e) => e.type === 'observation');

    expect(actionEvent).toBeDefined();
    expect(observationEvent).toBeDefined();

    if (actionEvent?.type === 'action') {
      expect(actionEvent.tool).toBe('calculator');
      expect(actionEvent.input).toEqual({ expression: '2+2' });
    }

    if (observationEvent?.type === 'observation') {
      expect(observationEvent.success).toBe(true);
    }
  });

  it('should return done event with error on failure', async () => {
    const mockProvider: LLMProvider = {
      name: 'mock',
      model: 'mock',
      async chat() {
        throw new Error('Stream error');
      },
      async *streamChat() {
        throw new Error('Stream error');
      },
      async isAvailable() {
        return true;
      },
    };

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
    });

    const events: StreamingAgentEvent[] = [];
    for await (const event of agent.stream('Hello')) {
      events.push(event);
    }

    const doneEvent = events.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === 'done') {
      expect(doneEvent.response.success).toBe(false);
      expect(doneEvent.response.error).toContain('Stream error');
    }
  });
});

describe('Logger Integration', () => {
  it('should use custom logger for debug messages', async () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const mockProvider = createMockProvider([
      { content: 'Hello', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      logger,
    });

    await agent.run('Test');

    // Logger should receive calls during execution
    expect(logger.debug).toHaveBeenCalled();
  });

  it('should work without logger (uses noopLogger)', async () => {
    const mockProvider = createMockProvider([
      { content: 'Hello', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      // No logger provided
    });

    // Should not throw
    const response = await agent.run('Test');
    expect(response.success).toBe(true);
  });
});

describe('Trace Formatter', () => {
  const sampleTrace: ReActTrace = {
    steps: [
      {
        type: 'thought',
        content: 'Thinking about the problem',
        timestamp: Date.now(),
      },
      {
        type: 'action',
        tool: 'calculator',
        input: { expression: '2+2' },
        timestamp: Date.now(),
      },
      { type: 'observation', result: 4, success: true, timestamp: Date.now() },
      { type: 'thought', content: 'Got the result', timestamp: Date.now() },
    ],
    iterations: 2,
    totalTokens: 100,
    durationMs: 500,
  };

  it('should format trace as human-readable string', () => {
    const formatted = formatTrace(sampleTrace);

    expect(formatted).toContain('ReAct Trace');
    expect(formatted).toContain('Iterations: 2');
    expect(formatted).toContain('Total Tokens: 100');
    expect(formatted).toContain('Duration: 500ms');
    expect(formatted).toContain('THOUGHT:');
    expect(formatted).toContain('ACTION:');
    expect(formatted).toContain('OBSERVATION:');
  });

  it('should respect format options', () => {
    const formatted = formatTrace(sampleTrace, {
      timestamps: false,
      iterations: false,
      maxResultLength: 10,
    });

    // Should not have timestamps or iteration prefixes
    expect(formatted).not.toMatch(/\[\d{2}:\d{2}:\d{2}/);
  });

  it('should truncate long results', () => {
    const traceWithLongResult: ReActTrace = {
      steps: [
        {
          type: 'observation',
          result: 'a'.repeat(300),
          success: true,
          timestamp: Date.now(),
        },
      ],
      iterations: 1,
      totalTokens: 50,
      durationMs: 100,
    };

    const formatted = formatTrace(traceWithLongResult, { maxResultLength: 50 });
    expect(formatted).toContain('...');
  });

  it('should format trace as JSON', () => {
    const json = formatTraceJSON(sampleTrace);
    const parsed = JSON.parse(json);

    expect(parsed.iterations).toBe(2);
    expect(parsed.totalTokens).toBe(100);
    expect(parsed.steps).toHaveLength(4);
  });

  it('should calculate trace statistics', () => {
    const stats = getTraceStats(sampleTrace);

    expect(stats.thoughtCount).toBe(2);
    expect(stats.actionCount).toBe(1);
    expect(stats.observationCount).toBe(1);
    expect(stats.successfulTools).toBe(1);
    expect(stats.failedTools).toBe(0);
    expect(stats.tokensPerIteration).toBe(50);
    expect(stats.totalDurationMs).toBe(500);
  });

  it('should count failed tools correctly', () => {
    const traceWithFailure: ReActTrace = {
      steps: [
        {
          type: 'observation',
          result: 'error',
          success: false,
          timestamp: Date.now(),
        },
        {
          type: 'observation',
          result: 'ok',
          success: true,
          timestamp: Date.now(),
        },
      ],
      iterations: 1,
      totalTokens: 50,
      durationMs: 100,
    };

    const stats = getTraceStats(traceWithFailure);
    expect(stats.successfulTools).toBe(1);
    expect(stats.failedTools).toBe(1);
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
