import { describe, it, expect } from 'vitest';
import type {
  CacheInfo,
  ResponseMetadata,
  TokenUsage,
  ChatResponse,
  StreamChunk,
} from '../src/provider/types';

describe('Response Metadata Types', () => {
  describe('CacheInfo', () => {
    it('accepts minimal cache info', () => {
      const cache: CacheInfo = { hit: false };
      expect(cache.hit).toBe(false);
    });

    it('accepts full cache info', () => {
      const cache: CacheInfo = {
        hit: true,
        tokensSaved: 1500,
        ttlSeconds: 300,
      };
      expect(cache.hit).toBe(true);
      expect(cache.tokensSaved).toBe(1500);
      expect(cache.ttlSeconds).toBe(300);
    });
  });

  describe('ResponseMetadata', () => {
    it('accepts empty metadata', () => {
      const metadata: ResponseMetadata = {};
      expect(metadata).toEqual({});
    });

    it('accepts full metadata', () => {
      const metadata: ResponseMetadata = {
        requestId: 'req_abc123',
        modelVersion: '2024-01-01',
        modelId: 'gpt-4-turbo',
        cache: { hit: true, tokensSaved: 500 },
        latencyMs: 1234,
        systemFingerprint: 'fp_abc123',
      };
      expect(metadata.requestId).toBe('req_abc123');
      expect(metadata.cache?.hit).toBe(true);
    });
  });

  describe('TokenUsage', () => {
    it('accepts basic token usage', () => {
      const usage: TokenUsage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };
      expect(usage.totalTokens).toBe(150);
    });

    it('accepts extended token usage', () => {
      const usage: TokenUsage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        reasoningTokens: 25,
        cacheReadTokens: 80,
        cacheWriteTokens: 20,
      };
      expect(usage.reasoningTokens).toBe(25);
      expect(usage.cacheReadTokens).toBe(80);
    });
  });

  describe('ChatResponse with metadata', () => {
    it('accepts response without metadata (backward compat)', () => {
      const response: ChatResponse = {
        content: 'Hello!',
        finishReason: 'stop',
      };
      expect(response.metadata).toBeUndefined();
    });

    it('accepts response with metadata', () => {
      const response: ChatResponse = {
        content: 'Hello!',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        metadata: {
          requestId: 'req_123',
          latencyMs: 500,
        },
      };
      expect(response.metadata?.requestId).toBe('req_123');
    });
  });

  describe('StreamChunk with metadata', () => {
    it('accepts done chunk without metadata (backward compat)', () => {
      const chunk: StreamChunk = { type: 'done' };
      expect(chunk.metadata).toBeUndefined();
    });

    it('accepts done chunk with metadata', () => {
      const chunk: StreamChunk = {
        type: 'done',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          reasoningTokens: 20,
        },
        metadata: {
          requestId: 'req_456',
          cache: { hit: true, tokensSaved: 80 },
        },
      };
      expect(chunk.metadata?.cache?.hit).toBe(true);
      expect(chunk.usage?.reasoningTokens).toBe(20);
    });
  });
});
