/**
 * Integration tests for OpenAI Provider.
 *
 * These tests hit the REAL OpenAI API and cost money.
 * Only run manually when you need to verify real-world behavior.
 *
 * Run with: OPENAI_API_KEY=sk-xxx pnpm vitest run test/integration.test.ts
 *
 * Skip in CI by checking for the API key.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAIProvider } from '../src/openai-provider.js';
import type { ChatMessage } from '@contextai/core';

// Configuration for different OpenAI-compatible providers
const CONFIG = {
  // Z.AI GLM Coding Plan (dedicated coding endpoint)
  zai: {
    apiKey: process.env.ZAI_API_KEY,
    baseURL: 'https://api.z.ai/api/coding/paas/v4/',
    model: 'glm-4.7',
  },
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: undefined, // Uses default
    model: 'gpt-4o-mini',
  },
};

// Use Z.AI if available, otherwise OpenAI
const activeConfig = CONFIG.zai.apiKey ? CONFIG.zai : CONFIG.openai;
const API_KEY = activeConfig.apiKey;
const describeIntegration = API_KEY ? describe : describe.skip;

describeIntegration('OpenAIProvider Integration', () => {
  let provider: OpenAIProvider;

  beforeAll(() => {
    provider = new OpenAIProvider({
      apiKey: API_KEY!,
      baseURL: activeConfig.baseURL,
      model: activeConfig.model,
    });
    console.log(`Testing with: ${activeConfig.model} at ${activeConfig.baseURL || 'OpenAI default'}`);
  });

  it('should complete a simple chat request', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Reply with exactly: "Hello, World!"' },
    ];

    const response = await provider.chat(messages, {
      temperature: 0, // Deterministic
      // Note: GLM reasoning models need higher maxTokens because they use tokens
      // for internal reasoning before generating visible content.
      maxTokens: 500,
    });

    expect(response.content).toContain('Hello');
    expect(response.finishReason).toBe('stop');
    expect(response.usage).toBeDefined();
    expect(response.usage?.totalTokens).toBeGreaterThan(0);
  }, 60000); // 60s timeout for GLM reasoning models

  it('should stream a response', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Count from 1 to 5, one number per line.' },
    ];

    const chunks: string[] = [];
    let gotDone = false;
    let gotUsage = false;

    for await (const chunk of provider.streamChat(messages, {
      temperature: 0,
      // GLM reasoning models need higher maxTokens for reasoning + content
      maxTokens: 500,
    })) {
      if (chunk.type === 'text' && chunk.content) {
        chunks.push(chunk.content);
      }
      if (chunk.type === 'done') {
        gotDone = true;
      }
      if (chunk.type === 'usage') {
        gotUsage = true;
      }
    }

    const fullResponse = chunks.join('');
    expect(fullResponse).toContain('1');
    expect(fullResponse).toContain('5');
    // Note: Some OpenAI-compatible providers (like GLM) send usage without done chunk.
    // Either done OR usage signals end-of-stream.
    expect(gotDone || gotUsage).toBe(true);
  }, 60000); // 60s timeout for GLM reasoning models

  it('should handle tool calls', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What is the weather in Tokyo?' },
    ];

    const response = await provider.chat(messages, {
      temperature: 0,
      maxTokens: 500, // GLM reasoning models need higher maxTokens
      tools: [
        {
          name: 'get_weather',
          description: 'Get the current weather in a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City name' },
            },
            required: ['location'],
          },
        },
      ],
    });

    expect(response.finishReason).toBe('tool_calls');
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls?.length).toBeGreaterThan(0);
    expect(response.toolCalls?.[0].name).toBe('get_weather');
    expect(response.toolCalls?.[0].arguments).toHaveProperty('location');
  }, 60000); // 60s timeout for GLM reasoning models

  it('should stream tool calls', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Calculate 2 + 2' },
    ];

    const toolCallChunks: Array<{ id?: string; name?: string; arguments?: unknown }> = [];

    for await (const chunk of provider.streamChat(messages, {
      temperature: 0,
      maxTokens: 500, // GLM reasoning models need higher maxTokens
      tools: [
        {
          name: 'calculator',
          description: 'Perform math calculations',
          parameters: {
            type: 'object',
            properties: {
              expression: { type: 'string' },
            },
            required: ['expression'],
          },
        },
      ],
    })) {
      if (chunk.type === 'tool_call' && chunk.toolCall) {
        toolCallChunks.push(chunk.toolCall);
      }
    }

    // Should have accumulated tool call data
    expect(toolCallChunks.length).toBeGreaterThan(0);

    // Last chunk should have complete data
    const lastChunk = toolCallChunks[toolCallChunks.length - 1];
    expect(lastChunk.id).toBeDefined();
    expect(lastChunk.name).toBe('calculator');
  }, 60000); // 60s timeout for GLM reasoning models

  it('should handle JSON mode', async () => {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Return a JSON object with name and age fields for a person named Alice who is 30.',
      },
    ];

    const response = await provider.chat(messages, {
      temperature: 0,
      // GLM reasoning models need higher maxTokens for reasoning + content
      maxTokens: 500,
      responseFormat: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.content);
    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('age');
  }, 60000); // 60s timeout for JSON mode which takes longer

  it('should verify availability', async () => {
    const isAvailable = await provider.isAvailable();
    expect(isAvailable).toBe(true);
  });

  it('should handle invalid API key gracefully', async () => {
    const badProvider = new OpenAIProvider({
      apiKey: 'invalid-key-12345',
      baseURL: activeConfig.baseURL,
      model: activeConfig.model,
    });

    const isAvailable = await badProvider.isAvailable();
    expect(isAvailable).toBe(false);
  });
});
