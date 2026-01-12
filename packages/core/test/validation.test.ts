import { describe, it, expect, vi } from 'vitest';
import { Agent, ValidationError } from '../src';
import type { LLMProvider, ChatMessage, ChatResponse, StreamChunk } from '../src';

// Create a minimal mock provider for testing
function createMockProvider(): LLMProvider {
  return {
    name: 'mock',
    model: 'test-model',
    chat: vi.fn().mockResolvedValue({
      content: 'Test response',
      finishReason: 'stop',
    } satisfies ChatResponse),
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { type: 'text', content: 'Test' } satisfies StreamChunk;
      yield { type: 'done' } satisfies StreamChunk;
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

describe('Input Validation', () => {
  describe('Agent constructor validation', () => {
    it('throws ValidationError for empty name', () => {
      expect(() => {
        new Agent({
          name: '',
          systemPrompt: 'You are a helpful assistant.',
          llm: createMockProvider(),
        });
      }).toThrow(ValidationError);

      try {
        new Agent({
          name: '',
          systemPrompt: 'You are a helpful assistant.',
          llm: createMockProvider(),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
        expect((error as ValidationError).message).toContain('Invalid Agent configuration');
      }
    });

    it('throws ValidationError for empty systemPrompt', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: '',
          llm: createMockProvider(),
        });
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for missing llm', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: 'You are helpful.',
          llm: undefined as unknown as LLMProvider,
        });
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid llm (missing methods)', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: 'You are helpful.',
          llm: { name: 'broken' } as unknown as LLMProvider,
        });
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for negative maxIterations', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: 'You are helpful.',
          llm: createMockProvider(),
          maxIterations: -5,
        });
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for maxIterations > 100', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: 'You are helpful.',
          llm: createMockProvider(),
          maxIterations: 150,
        });
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for non-integer maxIterations', () => {
      expect(() => {
        new Agent({
          name: 'TestAgent',
          systemPrompt: 'You are helpful.',
          llm: createMockProvider(),
          maxIterations: 5.5,
        });
      }).toThrow(ValidationError);
    });

    it('accepts valid configuration', () => {
      const agent = new Agent({
        name: 'TestAgent',
        systemPrompt: 'You are a helpful assistant.',
        llm: createMockProvider(),
        maxIterations: 10,
      });
      expect(agent.name).toBe('TestAgent');
    });

    it('accepts valid configuration with optional fields', () => {
      const agent = new Agent({
        name: 'TestAgent',
        systemPrompt: 'You are a helpful assistant.',
        llm: createMockProvider(),
        tools: [],
        callbacks: {},
      });
      expect(agent.name).toBe('TestAgent');
    });
  });

  describe('Agent.run() validation', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent({
        name: 'TestAgent',
        systemPrompt: 'You are helpful.',
        llm: createMockProvider(),
      });
    });

    it('throws ValidationError for empty input', async () => {
      await expect(agent.run('')).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for non-string input', async () => {
      await expect(agent.run(123 as unknown as string)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for null input', async () => {
      await expect(agent.run(null as unknown as string)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid options.maxIterations', async () => {
      await expect(
        agent.run('Hello', { maxIterations: -1 })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid options.context', async () => {
      await expect(
        agent.run('Hello', {
          context: [{ role: 'invalid' as ChatMessage['role'], content: 'test' }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('accepts valid input and options', async () => {
      const response = await agent.run('Hello, world!');
      expect(response.success).toBe(true);
    });

    it('accepts valid input with context', async () => {
      const response = await agent.run('Hello', {
        context: [{ role: 'user', content: 'Previous message' }],
      });
      expect(response.success).toBe(true);
    });
  });

  describe('Agent.stream() validation', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent({
        name: 'TestAgent',
        systemPrompt: 'You are helpful.',
        llm: createMockProvider(),
      });
    });

    it('throws ValidationError for empty input', async () => {
      const streamFn = async () => {
        for await (const _ of agent.stream('')) {
          // Should not reach here
        }
      };
      await expect(streamFn()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for non-string input', async () => {
      const streamFn = async () => {
        for await (const _ of agent.stream(null as unknown as string)) {
          // Should not reach here
        }
      };
      await expect(streamFn()).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for invalid options', async () => {
      const streamFn = async () => {
        for await (const _ of agent.stream('Hello', { maxIterations: -1 })) {
          // Should not reach here
        }
      };
      await expect(streamFn()).rejects.toThrow(ValidationError);
    });

    it('accepts valid input', async () => {
      const events = [];
      for await (const event of agent.stream('Hello')) {
        events.push(event);
      }
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('ValidationError formatting', () => {
    it('formatIssues returns human-readable string', () => {
      try {
        new Agent({
          name: '',
          systemPrompt: '',
          llm: createMockProvider(),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const formatted = (error as ValidationError).formatIssues();
        expect(formatted).toContain('name');
        expect(formatted).toContain('systemPrompt');
      }
    });
  });
});
