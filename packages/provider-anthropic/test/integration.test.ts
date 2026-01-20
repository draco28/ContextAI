/**
 * Integration Tests for AnthropicProvider
 *
 * These tests hit the real Anthropic API.
 * They are skipped unless ANTHROPIC_API_KEY is set.
 *
 * Run with: pnpm test:integration --filter=@contextai/provider-anthropic
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AnthropicProvider } from '../src/anthropic-provider.js';

// Skip all tests if no API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const describeIntegration = ANTHROPIC_API_KEY ? describe : describe.skip;

describeIntegration('AnthropicProvider Integration', () => {
  let provider: AnthropicProvider;

  beforeAll(() => {
    provider = new AnthropicProvider({
      apiKey: ANTHROPIC_API_KEY!,
      model: 'claude-3-5-haiku-20241022', // Use Haiku for faster/cheaper tests
    });
  });

  // ==========================================================================
  // Basic Chat
  // ==========================================================================

  describe('chat', () => {
    it('should complete a simple chat request', async () => {
      const response = await provider.chat(
        [{ role: 'user', content: 'Reply with exactly: "Hello, World!"' }],
        { temperature: 0, maxTokens: 50 }
      );

      expect(response.content).toContain('Hello');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.totalTokens).toBeGreaterThan(0);
      expect(response.metadata?.requestId).toBeDefined();
    }, 30000);

    it('should handle system message', async () => {
      const response = await provider.chat(
        [
          { role: 'system', content: 'You are a pirate. Reply in pirate speak.' },
          { role: 'user', content: 'Hello!' },
        ],
        { temperature: 0.7, maxTokens: 100 }
      );

      expect(response.content.length).toBeGreaterThan(0);
      expect(response.finishReason).toBe('stop');
    }, 30000);

    it('should handle multi-turn conversation', async () => {
      const response = await provider.chat(
        [
          { role: 'user', content: 'My name is Alice.' },
          { role: 'assistant', content: 'Nice to meet you, Alice!' },
          { role: 'user', content: 'What is my name?' },
        ],
        { temperature: 0, maxTokens: 50 }
      );

      expect(response.content.toLowerCase()).toContain('alice');
    }, 30000);
  });

  // ==========================================================================
  // Streaming
  // ==========================================================================

  describe('streamChat', () => {
    it('should stream text response', async () => {
      const chunks: string[] = [];

      for await (const chunk of provider.streamChat(
        [{ role: 'user', content: 'Count from 1 to 5.' }],
        { temperature: 0, maxTokens: 100 }
      )) {
        if (chunk.type === 'text' && chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullText = chunks.join('');
      expect(fullText.length).toBeGreaterThan(0);
      expect(fullText).toMatch(/[1-5]/); // Should contain numbers
    }, 30000);

    it('should emit usage chunk', async () => {
      let hasUsage = false;

      for await (const chunk of provider.streamChat(
        [{ role: 'user', content: 'Say hi.' }],
        { maxTokens: 20 }
      )) {
        if (chunk.type === 'usage') {
          hasUsage = true;
          expect(chunk.usage?.completionTokens).toBeGreaterThan(0);
        }
      }

      expect(hasUsage).toBe(true);
    }, 30000);

    it('should emit done chunk', async () => {
      let hasDone = false;

      for await (const chunk of provider.streamChat(
        [{ role: 'user', content: 'Hi' }],
        { maxTokens: 10 }
      )) {
        if (chunk.type === 'done') {
          hasDone = true;
          expect(chunk.metadata?.requestId).toBeDefined();
        }
      }

      expect(hasDone).toBe(true);
    }, 30000);
  });

  // ==========================================================================
  // Tool Calling
  // ==========================================================================

  describe('tool calling', () => {
    const calculatorTool = {
      name: 'calculator',
      description: 'Performs basic arithmetic calculations',
      parameters: {
        type: 'object' as const,
        properties: {
          expression: {
            type: 'string',
            description: 'Math expression to evaluate',
          },
        },
        required: ['expression'],
      },
    };

    it('should request tool call', async () => {
      const response = await provider.chat(
        [{ role: 'user', content: 'What is 15 * 7? Use the calculator.' }],
        {
          tools: [calculatorTool],
          temperature: 0,
          maxTokens: 200,
        }
      );

      expect(response.finishReason).toBe('tool_calls');
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls!.length).toBeGreaterThan(0);
      expect(response.toolCalls![0].name).toBe('calculator');
      expect(response.toolCalls![0].arguments).toHaveProperty('expression');
    }, 30000);

    it('should handle tool result in conversation', async () => {
      // First request - model asks for tool
      const firstResponse = await provider.chat(
        [{ role: 'user', content: 'What is 123 + 456? Use calculator.' }],
        { tools: [calculatorTool], temperature: 0, maxTokens: 200 }
      );

      expect(firstResponse.toolCalls).toBeDefined();
      const toolCall = firstResponse.toolCalls![0];

      // Second request - provide tool result
      const secondResponse = await provider.chat(
        [
          { role: 'user', content: 'What is 123 + 456? Use calculator.' },
          {
            role: 'assistant',
            content: firstResponse.content,
            // Note: In a real scenario, you'd include toolCalls here
          } as any,
          {
            role: 'tool',
            content: '579',
            toolCallId: toolCall.id,
          },
        ],
        { tools: [calculatorTool], temperature: 0, maxTokens: 200 }
      );

      expect(secondResponse.content).toContain('579');
      expect(secondResponse.finishReason).toBe('stop');
    }, 60000);

    it('should stream tool calls', async () => {
      const toolCallChunks: Array<{ name?: string; arguments?: unknown }> = [];

      for await (const chunk of provider.streamChat(
        [{ role: 'user', content: 'Calculate 99 * 11 with calculator' }],
        { tools: [calculatorTool], temperature: 0, maxTokens: 200 }
      )) {
        if (chunk.type === 'tool_call' && chunk.toolCall) {
          toolCallChunks.push(chunk.toolCall);
        }
      }

      expect(toolCallChunks.length).toBeGreaterThan(0);
      // Last chunk should have the tool name
      const finalChunk = toolCallChunks[toolCallChunks.length - 1];
      expect(finalChunk.name).toBe('calculator');
    }, 30000);
  });

  // ==========================================================================
  // isAvailable
  // ==========================================================================

  describe('isAvailable', () => {
    it('should return true for valid credentials', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    }, 30000);

    it('should return false for invalid credentials', async () => {
      const badProvider = new AnthropicProvider({
        apiKey: 'invalid-key-12345',
        model: 'claude-3-5-haiku-20241022',
      });

      const available = await badProvider.isAvailable();
      expect(available).toBe(false);
    }, 30000);
  });

  // ==========================================================================
  // Rate Limits
  // ==========================================================================

  describe('getRateLimits', () => {
    it('should return rate limits after a request', async () => {
      // Make a request to populate rate limit data
      await provider.chat([{ role: 'user', content: 'Hi' }], { maxTokens: 5 });

      const limits = await provider.getRateLimits();

      // Rate limits may or may not be present depending on API response
      // Just verify the method doesn't throw
      if (limits) {
        expect(typeof limits.requestsRemaining).toBe('number');
      }
    }, 30000);
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('should handle invalid model gracefully', async () => {
      const badModelProvider = new AnthropicProvider({
        apiKey: ANTHROPIC_API_KEY!,
        model: 'invalid-model-name',
      });

      await expect(
        badModelProvider.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow();
    }, 30000);
  });
});
