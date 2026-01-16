import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent, ConversationContext, InMemoryProvider } from '../src';
import type {
  LLMProvider,
  ChatResponse,
  ChatMessage,
  MemoryProvider,
  TokenCounter,
} from '../src';

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

      if (response.content) {
        yield { type: 'text' as const, content: response.content };
      }
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

// ============================================
// ConversationContext Tests
// ============================================

describe('ConversationContext', () => {
  describe('basic operations', () => {
    it('should initialize with empty messages', () => {
      const context = new ConversationContext();
      expect(context.getMessages()).toEqual([]);
      expect(context.length).toBe(0);
    });

    it('should initialize with initial messages', () => {
      const initialMessages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const context = new ConversationContext({ initialMessages });
      expect(context.getMessages()).toEqual(initialMessages);
      expect(context.length).toBe(2);
    });

    it('should add a single message', () => {
      const context = new ConversationContext();
      context.addMessage({ role: 'user', content: 'Hello' });

      expect(context.length).toBe(1);
      expect(context.getMessages()[0]).toEqual({
        role: 'user',
        content: 'Hello',
      });
    });

    it('should add multiple messages', () => {
      const context = new ConversationContext();
      context.addMessages([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ]);

      expect(context.length).toBe(2);
    });

    it('should clear all messages', () => {
      const context = new ConversationContext({
        initialMessages: [{ role: 'user', content: 'Hello' }],
      });

      expect(context.length).toBe(1);
      context.clear();
      expect(context.length).toBe(0);
      expect(context.getMessages()).toEqual([]);
    });

    it('should return defensive copy from getMessages', () => {
      const context = new ConversationContext();
      context.addMessage({ role: 'user', content: 'Hello' });

      const messages = context.getMessages();
      messages.push({ role: 'assistant', content: 'Injected!' });

      // Original context should not be modified
      expect(context.length).toBe(1);
    });
  });

  describe('token counting', () => {
    it('should estimate tokens using default counter', async () => {
      const context = new ConversationContext();
      context.addMessage({ role: 'user', content: 'Hello world' }); // ~11 chars + 40 overhead

      const tokens = await context.countTokens();
      expect(tokens).toBeGreaterThan(0);
    });

    it('should use custom token counter when provided', async () => {
      const customCounter: TokenCounter = vi.fn().mockResolvedValue(42);

      const context = new ConversationContext({ tokenCounter: customCounter });
      context.addMessage({ role: 'user', content: 'Hello' });

      const tokens = await context.countTokens();
      expect(tokens).toBe(42);
      expect(customCounter).toHaveBeenCalled();
    });
  });

  describe('truncation', () => {
    it('should not truncate when maxTokens is not set', async () => {
      const context = new ConversationContext();
      context.addMessages([
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
      ]);

      const removed = await context.truncate();
      expect(removed).toBe(0);
      expect(context.length).toBe(3);
    });

    it('should truncate oldest non-system messages when over limit', async () => {
      // Use a very small token limit to force truncation
      const context = new ConversationContext({
        maxTokens: 50,
        initialMessages: [
          { role: 'system', content: 'You are helpful.' },
          {
            role: 'user',
            content: 'First message with lots of content to exceed token limit',
          },
          { role: 'assistant', content: 'First response with lots of content' },
          { role: 'user', content: 'Second message' },
        ],
      });

      const removed = await context.truncate();
      expect(removed).toBeGreaterThan(0);
    });

    it('should preserve system messages during truncation', async () => {
      const context = new ConversationContext({
        maxTokens: 30,
        initialMessages: [
          { role: 'system', content: 'System' },
          {
            role: 'user',
            content: 'Long user message that exceeds the token limit',
          },
        ],
      });

      await context.truncate();

      const messages = context.getMessages();
      const systemMessages = messages.filter((m) => m.role === 'system');
      expect(systemMessages.length).toBe(1);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const context = new ConversationContext({
        maxTokens: 1000,
        initialMessages: [{ role: 'user', content: 'Hello' }],
      });

      const json = context.toJSON();
      expect(json.messages).toEqual([{ role: 'user', content: 'Hello' }]);
      expect(json.maxTokens).toBe(1000);
    });

    it('should deserialize from JSON', () => {
      const data = {
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi!' },
        ],
        maxTokens: 500,
      };

      const context = ConversationContext.fromJSON(data);
      expect(context.getMessages()).toEqual(data.messages);
      expect(context.length).toBe(2);
    });

    it('should accept custom token counter in fromJSON', () => {
      const customCounter: TokenCounter = vi.fn().mockResolvedValue(100);
      const data = { messages: [], maxTokens: 500 };

      const context = ConversationContext.fromJSON(data, customCounter);
      context.countTokens();

      expect(customCounter).toHaveBeenCalled();
    });
  });
});

// ============================================
// InMemoryProvider Tests
// ============================================

describe('InMemoryProvider', () => {
  let provider: InMemoryProvider;

  beforeEach(() => {
    provider = new InMemoryProvider();
  });

  it('should save and load messages', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ];

    await provider.save('session-1', messages);
    const loaded = await provider.load('session-1');

    expect(loaded).toEqual(messages);
  });

  it('should return empty array for non-existent session', async () => {
    const loaded = await provider.load('non-existent');
    expect(loaded).toEqual([]);
  });

  it('should clear a session', async () => {
    await provider.save('session-1', [{ role: 'user', content: 'Hello' }]);
    await provider.clear('session-1');

    const loaded = await provider.load('session-1');
    expect(loaded).toEqual([]);
  });

  it('should check if session exists', async () => {
    expect(provider.has('session-1')).toBe(false);

    await provider.save('session-1', [{ role: 'user', content: 'Hello' }]);
    expect(provider.has('session-1')).toBe(true);
  });

  it('should list all sessions', async () => {
    await provider.save('session-1', [{ role: 'user', content: 'Hello' }]);
    await provider.save('session-2', [{ role: 'user', content: 'World' }]);

    const sessions = provider.getSessions();
    expect(sessions).toContain('session-1');
    expect(sessions).toContain('session-2');
    expect(sessions.length).toBe(2);
  });

  it('should clear all sessions', async () => {
    await provider.save('session-1', [{ role: 'user', content: 'Hello' }]);
    await provider.save('session-2', [{ role: 'user', content: 'World' }]);

    provider.clearAll();

    expect(provider.getSessions()).toEqual([]);
    expect(provider.has('session-1')).toBe(false);
  });

  it('should store defensive copies', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    await provider.save('session-1', messages);

    // Modify original array
    messages.push({ role: 'assistant', content: 'Injected!' });

    // Stored data should not be affected
    const loaded = await provider.load('session-1');
    expect(loaded.length).toBe(1);
  });

  it('should return defensive copies on load', async () => {
    await provider.save('session-1', [{ role: 'user', content: 'Hello' }]);

    const loaded1 = await provider.load('session-1');
    loaded1.push({ role: 'assistant', content: 'Injected!' });

    const loaded2 = await provider.load('session-1');
    expect(loaded2.length).toBe(1);
  });
});

// ============================================
// Agent Context Integration Tests
// ============================================

describe('Agent with Context', () => {
  it('should preserve conversation context across multiple runs', async () => {
    const mockProvider = createMockProvider([
      { content: 'Hello! Nice to meet you.', finishReason: 'stop' },
      { content: 'Your name is Alice!', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a helpful assistant.',
      llm: mockProvider,
    });

    await agent.run('My name is Alice');
    await agent.run('What is my name?');

    // Context should have 4 messages (2 user + 2 assistant)
    const context = agent.getContext();
    expect(context.length).toBe(4);
  });

  it('should work with memory provider for persistence', async () => {
    const memory = new InMemoryProvider();
    const mockProvider = createMockProvider([
      { content: 'Hello!', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a helpful assistant.',
      llm: mockProvider,
      memory,
      sessionId: 'test-session',
    });

    await agent.run('Hello');

    // Memory should have the conversation
    const savedMessages = await memory.load('test-session');
    expect(savedMessages.length).toBe(2); // user + assistant
  });

  it('should load existing context from memory on first run', async () => {
    const memory = new InMemoryProvider();
    await memory.save('test-session', [
      { role: 'user', content: 'Previous message' },
      { role: 'assistant', content: 'Previous response' },
    ]);

    const mockProvider = createMockProvider([
      { content: 'Continuing conversation!', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a helpful assistant.',
      llm: mockProvider,
      memory,
      sessionId: 'test-session',
    });

    await agent.run('New message');

    // Should have 4 messages: 2 loaded + 2 new
    const context = agent.getContext();
    expect(context.length).toBe(4);
  });

  it('should require sessionId when memory is provided', () => {
    const memory = new InMemoryProvider();
    const mockProvider = createMockProvider([]);

    expect(() => {
      new Agent({
        name: 'TestAgent',
        systemPrompt: 'Test',
        llm: mockProvider,
        memory,
        // Missing sessionId!
      });
    }).toThrow('sessionId is required when memory is provided');
  });

  it('should work without memory (backward compatible)', async () => {
    const mockProvider = createMockProvider([
      { content: 'Hello!', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'You are a helpful assistant.',
      llm: mockProvider,
      // No memory, no sessionId
    });

    const response = await agent.run('Hello');
    expect(response.success).toBe(true);
    expect(response.output).toBe('Hello!');
  });

  it('should clear context without clearing memory', async () => {
    const memory = new InMemoryProvider();
    const mockProvider = createMockProvider([
      { content: 'Response', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      memory,
      sessionId: 'test-session',
    });

    await agent.run('Hello');
    await agent.clearContext(false);

    // Local context cleared
    expect(agent.getContext().length).toBe(0);

    // Memory still has data
    const savedMessages = await memory.load('test-session');
    expect(savedMessages.length).toBe(2);
  });

  it('should clear context and memory when requested', async () => {
    const memory = new InMemoryProvider();
    const mockProvider = createMockProvider([
      { content: 'Response', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      memory,
      sessionId: 'test-session',
    });

    await agent.run('Hello');
    await agent.clearContext(true);

    // Both cleared
    expect(agent.getContext().length).toBe(0);
    const savedMessages = await memory.load('test-session');
    expect(savedMessages.length).toBe(0);
  });

  it('should accept initial context in config', async () => {
    const mockProvider = createMockProvider([
      { content: 'I remember you!', finishReason: 'stop' },
    ]);

    const agent = new Agent({
      name: 'TestAgent',
      systemPrompt: 'Test',
      llm: mockProvider,
      context: [
        { role: 'user', content: 'My name is Bob' },
        { role: 'assistant', content: 'Nice to meet you, Bob!' },
      ],
    });

    await agent.run('Do you remember my name?');

    // Should have 4 messages: 2 initial + 2 new
    expect(agent.getContext().length).toBe(4);
  });
});
