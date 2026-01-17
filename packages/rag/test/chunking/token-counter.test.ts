/**
 * Token Counter Tests
 */

import { describe, it, expect } from 'vitest';
import {
  CHARS_PER_TOKEN,
  estimateTokens,
  countCharacters,
  measureSize,
  convertSize,
  findSizeIndex,
  splitBySize,
} from '../../src/chunking/token-counter.js';

describe('Token Counter', () => {
  describe('CHARS_PER_TOKEN', () => {
    it('should be 4', () => {
      expect(CHARS_PER_TOKEN).toBe(4);
    });
  });

  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate tokens correctly', () => {
      // 12 chars / 4 = 3 tokens
      expect(estimateTokens('Hello World!')).toBe(3);
    });

    it('should round up partial tokens', () => {
      // 13 chars / 4 = 3.25, rounds up to 4
      expect(estimateTokens('Hello, World!')).toBe(4);
    });

    it('should handle single character', () => {
      expect(estimateTokens('a')).toBe(1);
    });
  });

  describe('countCharacters', () => {
    it('should return 0 for empty string', () => {
      expect(countCharacters('')).toBe(0);
    });

    it('should count characters correctly', () => {
      expect(countCharacters('Hello')).toBe(5);
    });

    it('should handle null/undefined safely', () => {
      expect(countCharacters(null as unknown as string)).toBe(0);
      expect(countCharacters(undefined as unknown as string)).toBe(0);
    });
  });

  describe('measureSize', () => {
    it('should measure in tokens', () => {
      expect(measureSize('Hello World!', 'tokens')).toBe(3);
    });

    it('should measure in characters', () => {
      expect(measureSize('Hello World!', 'characters')).toBe(12);
    });
  });

  describe('convertSize', () => {
    it('should return same value for same unit', () => {
      expect(convertSize(100, 'tokens', 'tokens')).toBe(100);
      expect(convertSize(100, 'characters', 'characters')).toBe(100);
    });

    it('should convert tokens to characters', () => {
      expect(convertSize(10, 'tokens', 'characters')).toBe(40);
    });

    it('should convert characters to tokens', () => {
      expect(convertSize(40, 'characters', 'tokens')).toBe(10);
    });

    it('should round up when converting to tokens', () => {
      expect(convertSize(41, 'characters', 'tokens')).toBe(11);
    });
  });

  describe('findSizeIndex', () => {
    it('should return 0 for empty text', () => {
      expect(findSizeIndex('', 10, 'tokens')).toBe(0);
    });

    it('should return 0 for zero target', () => {
      expect(findSizeIndex('Hello', 0, 'tokens')).toBe(0);
    });

    it('should find correct index for tokens', () => {
      // 10 tokens = 40 chars
      const text = 'a'.repeat(100);
      expect(findSizeIndex(text, 10, 'tokens')).toBe(40);
    });

    it('should find correct index for characters', () => {
      const text = 'a'.repeat(100);
      expect(findSizeIndex(text, 50, 'characters')).toBe(50);
    });

    it('should not exceed text length', () => {
      const text = 'Hello';
      expect(findSizeIndex(text, 1000, 'tokens')).toBe(5);
    });
  });

  describe('splitBySize', () => {
    it('should return empty array for empty text', () => {
      expect(splitBySize('', 10, 'tokens')).toEqual([]);
    });

    it('should return empty array for zero target', () => {
      expect(splitBySize('Hello', 0, 'tokens')).toEqual([]);
    });

    it('should split text correctly', () => {
      const text = 'a'.repeat(80); // 80 chars = 20 tokens
      const segments = splitBySize(text, 10, 'tokens'); // 10 tokens = 40 chars

      expect(segments).toHaveLength(2);
      expect(segments[0]).toHaveLength(40);
      expect(segments[1]).toHaveLength(40);
    });

    it('should handle overlap', () => {
      const text = 'a'.repeat(100);
      // 10 tokens = 40 chars, 2 token overlap = 8 chars
      // Step = 40 - 8 = 32 chars
      const segments = splitBySize(text, 10, 'tokens', 2);

      // Each segment is 40 chars, step is 32
      // Positions: 0, 32, 64, 96 -> 4 segments
      expect(segments.length).toBeGreaterThan(2);
    });

    it('should handle overlap >= targetSize safely', () => {
      const text = 'a'.repeat(50);
      // This would cause infinite loop without safety check
      const segments = splitBySize(text, 10, 'tokens', 10);

      expect(segments.length).toBeGreaterThan(0);
    });
  });
});
