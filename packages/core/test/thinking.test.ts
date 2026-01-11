import { describe, it, expect } from 'vitest';
import type {
  ThinkingConfig,
  GenerateOptions,
  ChatResponse,
  StreamChunk,
} from '../src/provider/types';

describe('Extended Thinking Types', () => {
  describe('ThinkingConfig', () => {
    it('accepts minimal config (enabled only)', () => {
      const config: ThinkingConfig = { enabled: true };
      expect(config.enabled).toBe(true);
      expect(config.budgetTokens).toBeUndefined();
    });

    it('accepts full config with budget', () => {
      const config: ThinkingConfig = {
        enabled: true,
        budgetTokens: 10000,
      };
      expect(config.enabled).toBe(true);
      expect(config.budgetTokens).toBe(10000);
    });

    it('accepts disabled config', () => {
      const config: ThinkingConfig = { enabled: false };
      expect(config.enabled).toBe(false);
    });
  });

  describe('GenerateOptions with thinking', () => {
    it('accepts thinking config', () => {
      const options: GenerateOptions = {
        thinking: { enabled: true, budgetTokens: 5000 },
      };
      expect(options.thinking?.enabled).toBe(true);
      expect(options.thinking?.budgetTokens).toBe(5000);
    });

    it('works without thinking (backward compat)', () => {
      const options: GenerateOptions = {
        temperature: 0.7,
        maxTokens: 1000,
      };
      expect(options.thinking).toBeUndefined();
    });
  });

  describe('ChatResponse with thinking', () => {
    it('accepts response with thinking content', () => {
      const response: ChatResponse = {
        content: 'The answer is 42.',
        finishReason: 'stop',
        thinking: 'Let me analyze this step by step...',
      };
      expect(response.thinking).toBe('Let me analyze this step by step...');
    });

    it('accepts content_filter finish reason', () => {
      const response: ChatResponse = {
        content: '',
        finishReason: 'content_filter',
      };
      expect(response.finishReason).toBe('content_filter');
    });

    it('works without thinking (backward compat)', () => {
      const response: ChatResponse = {
        content: 'Hello!',
        finishReason: 'stop',
      };
      expect(response.thinking).toBeUndefined();
    });
  });

  describe('StreamChunk with thinking', () => {
    it('accepts thinking chunk type', () => {
      const chunk: StreamChunk = {
        type: 'thinking',
        thinking: 'Analyzing the problem...',
      };
      expect(chunk.type).toBe('thinking');
      expect(chunk.thinking).toBe('Analyzing the problem...');
    });

    it('accepts done chunk with thinking', () => {
      const chunk: StreamChunk = {
        type: 'done',
        thinking: 'Full reasoning content here...',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          reasoningTokens: 30,
        },
      };
      expect(chunk.thinking).toBeDefined();
      expect(chunk.usage?.reasoningTokens).toBe(30);
    });

    it('works without thinking (backward compat)', () => {
      const chunk: StreamChunk = {
        type: 'text',
        content: 'Hello',
      };
      expect(chunk.thinking).toBeUndefined();
    });
  });
});
