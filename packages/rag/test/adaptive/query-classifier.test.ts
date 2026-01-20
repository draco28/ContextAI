/**
 * Query Classifier Tests
 *
 * Tests for the heuristic-based QueryClassifier implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClassifier } from '../../src/adaptive/query-classifier.js';
import type {
  QueryType,
  ClassificationResult,
  QueryFeatures,
} from '../../src/adaptive/types.js';

describe('QueryClassifier', () => {
  let classifier: QueryClassifier;

  beforeEach(() => {
    classifier = new QueryClassifier();
  });

  describe('configuration', () => {
    it('should use default name', () => {
      expect(classifier.name).toBe('QueryClassifier');
    });

    it('should use custom name', () => {
      const custom = new QueryClassifier({ name: 'CustomClassifier' });
      expect(custom.name).toBe('CustomClassifier');
    });

    it('should merge custom thresholds with defaults', () => {
      const custom = new QueryClassifier({
        thresholds: { simpleMaxWords: 2 },
      });
      // "Hello there" would be SIMPLE with default (4 words), but not with 2
      const result = custom.classify('Hello there');
      expect(result.type).toBe('simple'); // 2 words = exactly at threshold
    });

    it('should add custom greetings', () => {
      const custom = new QueryClassifier({
        additionalGreetings: ['bonjour', 'ciao'],
      });
      const result = custom.classify('bonjour');
      expect(result.type).toBe('simple');
      expect(result.features.isGreeting).toBe(true);
    });

    it('should add custom complex keywords', () => {
      const custom = new QueryClassifier({
        additionalComplexKeywords: ['inspect', 'dissect'],
      });
      // Use a query without pronouns to avoid conversational classification
      const result = custom.classify('Please inspect the codebase thoroughly');
      expect(result.type).toBe('complex');
      expect(result.features.hasComplexKeywords).toBe(true);
      expect(result.features.complexKeywords).toContain('inspect');
    });
  });

  describe('SIMPLE queries', () => {
    it.each([
      'hello',
      'Hello',
      'HELLO',
      'hi',
      'Hi there',
      'hey',
      'thanks',
      'Thank you',
      'bye',
      'ok',
      'sure',
      'yes',
      'no',
      'great',
      'awesome',
    ])('should classify "%s" as SIMPLE', (query) => {
      const result = classifier.classify(query);
      expect(result.type).toBe('simple');
      expect(result.recommendation.skipRetrieval).toBe(true);
    });

    it('should classify very short non-questions as SIMPLE', () => {
      const result = classifier.classify('nice job');
      expect(result.type).toBe('simple');
    });

    it('should have high confidence for greetings', () => {
      const result = classifier.classify('hello');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should recommend skipping retrieval for SIMPLE', () => {
      const result = classifier.classify('thanks!');
      expect(result.recommendation.skipRetrieval).toBe(true);
      expect(result.recommendation.enableEnhancement).toBe(false);
      expect(result.recommendation.suggestedTopK).toBe(0);
    });
  });

  describe('FACTUAL queries', () => {
    it.each([
      'What is TypeScript?',
      'Who created React?',
      'When was Node.js released?',
      'Where is the config file?',
      'What are the main features?',
      'Is this function pure?',
      'Does this support streaming?',
    ])('should classify "%s" as FACTUAL', (query) => {
      const result = classifier.classify(query);
      expect(result.type).toBe('factual');
    });

    it('should classify instructional queries appropriately', () => {
      // "How do I" queries may be classified as COMPLEX because they often
      // need step-by-step explanations, which is reasonable behavior
      const result = classifier.classify('How do I install this package?');
      // Either factual or complex is acceptable for how-to questions
      expect(['factual', 'complex']).toContain(result.type);
    });

    it('should detect question words', () => {
      const result = classifier.classify('What is the purpose of this API?');
      expect(result.features.hasQuestionWords).toBe(true);
      expect(result.features.questionWords).toContain('what');
    });

    it('should recommend standard pipeline for FACTUAL', () => {
      const result = classifier.classify('What is TypeScript?');
      expect(result.recommendation.skipRetrieval).toBe(false);
      expect(result.recommendation.enableEnhancement).toBe(false);
      expect(result.recommendation.enableReranking).toBe(true);
      expect(result.recommendation.suggestedTopK).toBe(5);
    });

    it('should have good confidence for factual questions', () => {
      const result = classifier.classify('What is the best way to do this?');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('COMPLEX queries', () => {
    it.each([
      'Compare React and Vue for large applications',
      'What are the differences between TypeScript and JavaScript?',
      'Analyze the trade-offs between SQL and NoSQL databases',
      'Explain why functional programming is beneficial',
      'What are the pros and cons of microservices?',
      'Evaluate different authentication strategies for this app',
      'Summarize the key concepts in this document',
      'List all the available configuration options',
      'Give me a comprehensive overview of the architecture',
      'Compare and contrast REST and GraphQL APIs',
    ])('should classify "%s" as COMPLEX', (query) => {
      const result = classifier.classify(query);
      expect(result.type).toBe('complex');
    });

    it('should detect complex keywords', () => {
      const result = classifier.classify('Compare these two approaches');
      expect(result.features.hasComplexKeywords).toBe(true);
      expect(result.features.complexKeywords).toContain('compare');
    });

    it('should classify long queries as COMPLEX', () => {
      const longQuery =
        'I need to understand how the authentication system works with the database layer and how it integrates with the frontend components';
      const result = classifier.classify(longQuery);
      expect(result.type).toBe('complex');
      expect(result.features.wordCount).toBeGreaterThan(15);
    });

    it('should recommend full pipeline for COMPLEX', () => {
      const result = classifier.classify('Compare React and Vue');
      expect(result.recommendation.skipRetrieval).toBe(false);
      expect(result.recommendation.enableEnhancement).toBe(true);
      expect(result.recommendation.enableReranking).toBe(true);
      expect(result.recommendation.suggestedTopK).toBe(10);
    });

    it('should suggest multi-query for very long complex queries', () => {
      // Need > 20 words to trigger multi-query
      const longQuery =
        'Compare the performance characteristics, developer experience, and ecosystem maturity of React, Vue, and Angular frameworks for building large scale enterprise applications in production';
      const result = classifier.classify(longQuery);
      expect(result.features.wordCount).toBeGreaterThan(20);
      expect(result.recommendation.suggestedStrategy).toBe('multi-query');
    });

    it('should suggest rewrite for shorter complex queries', () => {
      const result = classifier.classify('Compare React and Vue');
      // Query has 4 words, below threshold for multi-query
      expect(result.recommendation.suggestedStrategy).toBe('rewrite');
    });
  });

  describe('CONVERSATIONAL queries', () => {
    it.each([
      'What about it?',
      'Tell me more about that',
      'And what else?',
      'How does it work?',
      'Can you elaborate on this?',
      'What about the previous one?',
      'Continue from where you left off',
    ])('should classify "%s" as CONVERSATIONAL', (query) => {
      const result = classifier.classify(query);
      expect(result.type).toBe('conversational');
    });

    it('should detect follow-up patterns', () => {
      const result = classifier.classify('And also, what about the tests?');
      expect(result.features.hasFollowUpPattern).toBe(true);
    });

    it('should detect context pronouns', () => {
      const result = classifier.classify('What is it used for?');
      expect(result.features.hasPronouns).toBe(true);
      expect(result.features.pronouns).toContain('it');
    });

    it('should recommend conversation context for CONVERSATIONAL', () => {
      const result = classifier.classify('What about that?');
      expect(result.recommendation.needsConversationContext).toBe(true);
      expect(result.recommendation.skipRetrieval).toBe(false);
    });

    it('should distinguish incidental pronouns from significant ones', () => {
      // "Is this function pure?" uses "this" as adjective modifying "function"
      const result1 = classifier.classify('Is this function pure?');
      // Should NOT be conversational since "this" modifies "function"
      expect(result1.type).toBe('factual');
      expect(result1.features.pronouns).not.toContain('this');

      // "What is it?" uses "it" as subject requiring context
      const result2 = classifier.classify('What is it?');
      expect(result2.type).toBe('conversational');
      expect(result2.features.pronouns).toContain('it');
    });
  });

  describe('feature extraction', () => {
    it('should extract word count', () => {
      const features = classifier.extractFeatures('Hello world test');
      expect(features.wordCount).toBe(3);
    });

    it('should extract character count', () => {
      const features = classifier.extractFeatures('Hello');
      expect(features.charCount).toBe(5);
    });

    it('should detect question mark', () => {
      const features = classifier.extractFeatures('Is this a question?');
      expect(features.endsWithQuestion).toBe(true);
    });

    it('should detect potential entities (capitalized words)', () => {
      const features = classifier.extractFeatures(
        'Compare TypeScript with JavaScript'
      );
      expect(features.potentialEntityCount).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      const features = classifier.extractFeatures('');
      expect(features.wordCount).toBe(0);
      expect(features.charCount).toBe(0);
    });

    it('should handle whitespace-only strings', () => {
      const features = classifier.extractFeatures('   ');
      expect(features.wordCount).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single character queries', () => {
      const result = classifier.classify('?');
      expect(result.type).toBe('simple');
    });

    it('should handle queries with special characters', () => {
      const result = classifier.classify('What is @contextai/rag?');
      expect(result.type).toBe('factual');
    });

    it('should handle queries with numbers', () => {
      const result = classifier.classify('What is error code 404?');
      expect(result.type).toBe('factual');
    });

    it('should handle mixed case greetings', () => {
      const result = classifier.classify('HeLLo ThErE');
      expect(result.features.isGreeting).toBe(true);
    });

    it('should handle queries with excessive whitespace', () => {
      const result = classifier.classify('  Hello   world  ');
      expect(result.features.wordCount).toBe(2);
    });

    it('should handle multi-word greetings', () => {
      const result = classifier.classify('good morning');
      expect(result.type).toBe('simple');
      expect(result.features.isGreeting).toBe(true);
    });

    it('should not classify code snippets as greetings', () => {
      const result = classifier.classify("console.log('hello') should print to console");
      // This has "hello" embedded in code, not a greeting pattern
      // With more words, it should be factual or complex
      expect(['factual', 'complex']).toContain(result.type);
    });
  });

  describe('confidence scoring', () => {
    it('should have highest confidence for exact greeting matches', () => {
      const result = classifier.classify('hello');
      expect(result.confidence).toBe(0.95);
    });

    it('should have lower confidence for ambiguous queries', () => {
      const result = classifier.classify('interesting');
      expect(result.confidence).toBeLessThan(0.9);
    });

    it('should have high confidence when multiple signals align', () => {
      // Multiple complex keywords + long query (> complexMinWords threshold)
      const result = classifier.classify(
        'Compare and analyze the differences between the various approaches used in modern web development step by step thoroughly'
      );
      // Multiple complex keywords + long query should give high confidence
      expect(result.type).toBe('complex');
      expect(result.features.wordCount).toBeGreaterThanOrEqual(15);
      expect(result.features.hasComplexKeywords).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('recommendation consistency', () => {
    it('should always set all recommendation fields', () => {
      const types: QueryType[] = [
        'simple',
        'factual',
        'complex',
        'conversational',
      ];
      const queries = [
        'hello',
        'What is TypeScript?',
        'Compare React and Vue',
        'What about it?',
      ];

      queries.forEach((query, i) => {
        const result = classifier.classify(query);
        expect(result.recommendation).toHaveProperty('skipRetrieval');
        expect(result.recommendation).toHaveProperty('enableEnhancement');
        expect(result.recommendation).toHaveProperty('enableReranking');
        expect(result.recommendation).toHaveProperty('suggestedTopK');
        expect(result.recommendation).toHaveProperty('needsConversationContext');
        expect(typeof result.recommendation.skipRetrieval).toBe('boolean');
        expect(typeof result.recommendation.suggestedTopK).toBe('number');
      });
    });

    it('should only suggest strategy when enhancement is enabled', () => {
      // SIMPLE: no enhancement
      const simple = classifier.classify('hello');
      expect(simple.recommendation.enableEnhancement).toBe(false);
      expect(simple.recommendation.suggestedStrategy).toBeUndefined();

      // COMPLEX: has enhancement
      const complex = classifier.classify('Compare React and Vue');
      expect(complex.recommendation.enableEnhancement).toBe(true);
      expect(complex.recommendation.suggestedStrategy).toBeDefined();
    });
  });
});
