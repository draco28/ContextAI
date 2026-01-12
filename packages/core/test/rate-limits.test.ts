import { describe, it, expect } from 'vitest';
import type {
  RateLimitInfo,
  ModelInfo,
  LLMProvider,
  LLMProviderConfig,
  StreamChunk,
  ChatMessage,
  ChatResponse,
} from '../src/provider/types';

describe('Rate Limits and Provider Config Types', () => {
  describe('RateLimitInfo', () => {
    it('accepts minimal rate limit info', () => {
      const info: RateLimitInfo = {};
      expect(info.requestsRemaining).toBeUndefined();
    });

    it('accepts full rate limit info', () => {
      const info: RateLimitInfo = {
        requestsRemaining: 100,
        tokensRemaining: 50000,
        resetAt: 1704067200,
        windowSeconds: 60,
      };
      expect(info.requestsRemaining).toBe(100);
      expect(info.resetAt).toBe(1704067200);
    });
  });

  describe('ModelInfo', () => {
    it('accepts minimal model info', () => {
      const info: ModelInfo = { id: 'gpt-4' };
      expect(info.id).toBe('gpt-4');
    });

    it('accepts full model info', () => {
      const info: ModelInfo = {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        contextLength: 200000,
      };
      expect(info.contextLength).toBe(200000);
    });
  });

  describe('LLMProvider optional methods', () => {
    it('accepts provider without optional methods (backward compat)', () => {
      // This is a compile-time test - if it compiles, backward compat is maintained
      const provider: LLMProvider = {
        name: 'test',
        model: 'test-model',
        chat: async () => ({ content: '', finishReason: 'stop' }),
        streamChat: async function* () {
          yield { type: 'done' };
        },
        isAvailable: async () => true,
      };
      expect(provider.getRateLimits).toBeUndefined();
      expect(provider.listModels).toBeUndefined();
      expect(provider.countTokens).toBeUndefined();
    });

    it('accepts provider with optional methods', () => {
      const provider: LLMProvider = {
        name: 'test',
        model: 'test-model',
        chat: async () => ({ content: '', finishReason: 'stop' }),
        streamChat: async function* () {
          yield { type: 'done' };
        },
        isAvailable: async () => true,
        getRateLimits: async () => ({ requestsRemaining: 100 }),
        listModels: async () => [{ id: 'model-1' }],
        countTokens: async () => 100,
      };
      expect(provider.getRateLimits).toBeDefined();
      expect(provider.listModels).toBeDefined();
      expect(provider.countTokens).toBeDefined();
    });
  });

  describe('LLMProviderConfig extensions', () => {
    it('accepts minimal config (backward compat)', () => {
      const config: LLMProviderConfig = { model: 'gpt-4' };
      expect(config.timeout).toBeUndefined();
    });

    it('accepts extended config', () => {
      const config: LLMProviderConfig = {
        apiKey: 'sk-xxx',
        baseURL: 'https://api.openai.com',
        model: 'gpt-4',
        timeout: 30000,
        maxRetries: 3,
        headers: { 'X-Custom': 'value' },
        organization: 'org-123',
      };
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.organization).toBe('org-123');
    });
  });

  describe('StreamChunk with error', () => {
    it('accepts chunk with error', () => {
      const chunk: StreamChunk = {
        type: 'done',
        error: {
          message: 'Rate limit exceeded',
          code: 'rate_limit_error',
        },
      };
      expect(chunk.error?.message).toBe('Rate limit exceeded');
      expect(chunk.error?.code).toBe('rate_limit_error');
    });

    it('accepts error without code', () => {
      const chunk: StreamChunk = {
        type: 'done',
        error: { message: 'Unknown error' },
      };
      expect(chunk.error?.code).toBeUndefined();
    });

    it('works without error (backward compat)', () => {
      const chunk: StreamChunk = { type: 'text', content: 'Hello' };
      expect(chunk.error).toBeUndefined();
    });
  });
});
