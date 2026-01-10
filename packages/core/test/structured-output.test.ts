import { describe, it, expect } from 'vitest';
import type { ResponseFormat, GenerateOptions } from '../src/provider/types';

describe('Structured Output Types', () => {
  describe('ResponseFormat', () => {
    it('accepts text format', () => {
      const format: ResponseFormat = { type: 'text' };
      expect(format.type).toBe('text');
    });

    it('accepts json_object without schema', () => {
      const format: ResponseFormat = { type: 'json_object' };
      expect(format.type).toBe('json_object');
    });

    it('accepts json_object with schema', () => {
      const format: ResponseFormat = {
        type: 'json_object',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      expect(format.type).toBe('json_object');
      expect(format.schema).toBeDefined();
    });

    it('accepts json_schema with full config', () => {
      const format: ResponseFormat = {
        type: 'json_schema',
        jsonSchema: {
          name: 'user_response',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
            required: ['name'],
          },
          strict: true,
        },
      };
      expect(format.type).toBe('json_schema');
      expect(format.jsonSchema.name).toBe('user_response');
      expect(format.jsonSchema.strict).toBe(true);
    });
  });

  describe('GenerateOptions sampling parameters', () => {
    it('accepts all sampling options', () => {
      const options: GenerateOptions = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        topK: 40,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
        seed: 12345,
        user: 'user-123',
      };
      expect(options.topP).toBe(0.9);
      expect(options.topK).toBe(40);
      expect(options.seed).toBe(12345);
    });

    it('accepts responseFormat in options', () => {
      const options: GenerateOptions = {
        responseFormat: { type: 'json_object' },
      };
      expect(options.responseFormat?.type).toBe('json_object');
    });

    it('works without any new options (backward compat)', () => {
      const options: GenerateOptions = {
        temperature: 0.5,
        maxTokens: 100,
      };
      expect(options.responseFormat).toBeUndefined();
      expect(options.topP).toBeUndefined();
    });
  });
});
