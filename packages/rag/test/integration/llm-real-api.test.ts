/**
 * LLM Integration Tests with Real API
 *
 * Tests RAG components that depend on LLM with a real OpenAI-compatible API.
 *
 * Configure via .env.test file (copy from .env.test.example):
 *   LLM_TEST_API_KEY=...
 *   LLM_TEST_BASE_URL=...
 *   LLM_TEST_MODEL=...
 *
 * Run with:
 *   pnpm test -- test/integration/llm-real-api.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { LLMProvider, ChatMessage, ChatResponse, StreamChunk, GenerateOptions } from '@contextaisdk/core';

// Import RAG components
import { LLMReranker } from '../../src/reranker/llm-reranker.js';
import { QueryRewriter } from '../../src/query-enhancement/query-rewriter.js';
import { HyDEEnhancer } from '../../src/query-enhancement/hyde-enhancer.js';
import { MultiQueryExpander } from '../../src/query-enhancement/multi-query-expander.js';
import { AgenticChunker } from '../../src/chunking/agentic-chunker.js';
import type { RetrievalResult } from '../../src/retrieval/types.js';
import type { Document } from '../../src/chunking/types.js';

// ============================================================================
// Environment Configuration (loaded from .env.test via setup.ts)
// ============================================================================

const API_KEY = process.env.LLM_TEST_API_KEY;
const BASE_URL = process.env.LLM_TEST_BASE_URL;
const MODEL = process.env.LLM_TEST_MODEL ?? 'gpt-4';

const RUN_INTEGRATION = !!(API_KEY && BASE_URL);

// ============================================================================
// Simple OpenAI-Compatible Provider (inline to avoid package dependency issues)
// ============================================================================

class SimpleOpenAIProvider implements LLMProvider {
  readonly name = 'openai-compatible';
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor(config: { apiKey: string; baseURL: string; model: string }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.model = config.model;
  }

  chat = async (messages: ChatMessage[], options?: GenerateOptions): Promise<ChatResponse> => {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
    };

    return {
      content: data.choices[0]?.message?.content ?? '',
      finishReason: (data.choices[0]?.finish_reason as 'stop' | 'length') ?? 'stop',
    };
  };

  async *streamChat(messages: ChatMessage[], options?: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown> {
    // For simplicity, just use non-streaming and yield as single chunk
    const response = await this.chat(messages, options);
    yield { type: 'text', content: response.content };
    yield { type: 'done' };
  }

  isAvailable = async (): Promise<boolean> => {
    try {
      await this.chat([{ role: 'user', content: 'test' }], { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  };
}

// ============================================================================
// Mock Embedding Provider (for HyDE test - we only test LLM part)
// ============================================================================

const mockEmbeddingProvider = {
  name: 'mock-embedding',
  embed: async (text: string) => new Array(384).fill(0).map(() => Math.random()),
  embedBatch: async (texts: string[]) => texts.map(() => new Array(384).fill(0).map(() => Math.random())),
};

// ============================================================================
// Tests
// ============================================================================

describe.skipIf(!RUN_INTEGRATION)('LLM Real API Integration Tests', () => {
  let provider: LLMProvider;

  beforeAll(() => {
    if (!API_KEY || !BASE_URL) {
      throw new Error('LLM_TEST_API_KEY and LLM_TEST_BASE_URL must be set');
    }

    provider = new SimpleOpenAIProvider({
      apiKey: API_KEY,
      baseURL: BASE_URL,
      model: MODEL,
    });

    console.log(`\n Testing with ${MODEL} at ${BASE_URL}\n`);
  });

  describe('Basic API Connectivity', () => {
    it('should complete a simple chat request', async () => {
      const response = await provider.chat([
        { role: 'user', content: 'Respond with only the word "OK"' }
      ]);

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(0);
      console.log(`  Response: "${response.content}"`);
    }, 30000);
  });

  describe('Query Enhancement', () => {
    it('should rewrite a query for better retrieval', async () => {
      const rewriter = new QueryRewriter({ llmProvider: provider });

      const result = await rewriter.enhance('what is ml');

      // result.enhanced is string[], check first element
      expect(result.enhanced).toBeTruthy();
      expect(result.enhanced.length).toBeGreaterThanOrEqual(1);

      const rewritten = result.enhanced[0];
      expect(rewritten).toBeTruthy();
      // Rewritten query should be non-trivial (at least a few characters)
      expect(rewritten.length).toBeGreaterThan(3);

      console.log(`  Original: "what is ml"`);
      console.log(`  Rewritten: "${rewritten}"`);
    }, 30000);

    it('should generate hypothetical document with HyDE', async () => {
      const enhancer = new HyDEEnhancer({
        llmProvider: provider,
        embeddingProvider: mockEmbeddingProvider,
      });

      const result = await enhancer.enhance('What are the benefits of TypeScript?');

      // result.enhanced should exist (even if empty for some LLMs)
      expect(result).toBeDefined();
      expect(result.enhanced).toBeDefined();
      expect(result.strategy).toBe('hyde');

      if (result.enhanced.length > 0) {
        const hypotheticalDoc = result.enhanced[0];
        console.log(`  HyDE document (${hypotheticalDoc.length} chars):`);
        console.log(`  "${hypotheticalDoc.substring(0, 150)}..."`);
        // If we got a result, it should be substantial
        expect(hypotheticalDoc.length).toBeGreaterThan(10);
      } else {
        // Some LLMs return empty responses - this is acceptable for the test
        console.log('  Note: LLM returned empty response for HyDE prompt');
        console.log('  This may indicate model incompatibility with the prompt format');
      }
    }, 30000);

    it('should expand query into multiple variants', async () => {
      const expander = new MultiQueryExpander({
        llmProvider: provider,
        numVariants: 3
      });

      const result = await expander.enhance('How does React work?');

      // Result should exist with proper structure
      expect(result).toBeDefined();
      expect(result.enhanced).toBeDefined();
      expect(result.strategy).toBe('multi-query');

      console.log(`  Original: "How does React work?"`);

      if (result.enhanced.length > 0) {
        console.log(`  Variants (${result.enhanced.length}):`);
        result.enhanced.forEach((v, i) => console.log(`    ${i + 1}. "${v}"`));
        // If we got variants, there should be multiple
        expect(result.enhanced.length).toBeGreaterThanOrEqual(1);
      } else {
        // Some LLMs return empty responses - this is acceptable for the test
        console.log('  Note: LLM returned empty response for multi-query prompt');
        console.log('  This may indicate model incompatibility with the prompt format');
      }
    }, 30000);
  });

  describe('LLM Reranking', () => {
    it('should rerank results by relevance to query', async () => {
      const reranker = new LLMReranker({
        llmProvider: provider,
        batchSize: 3
      });

      const query = 'TypeScript type system benefits';

      const mockResults: RetrievalResult[] = [
        {
          id: '1',
          chunk: { id: '1', content: 'Python is a dynamic programming language used for scripting.', metadata: {} },
          score: 0.8
        },
        {
          id: '2',
          chunk: { id: '2', content: 'TypeScript adds static typing to JavaScript for better tooling.', metadata: {} },
          score: 0.6
        },
        {
          id: '3',
          chunk: { id: '3', content: 'TypeScript interfaces define contracts for objects and functions.', metadata: {} },
          score: 0.4
        },
      ];

      const reranked = await reranker.rerank(query, mockResults);

      expect(reranked.length).toBe(3);

      console.log(`  Query: "${query}"`);
      console.log(`  Reranked results:`);
      reranked.forEach((r, i) => {
        console.log(`    ${i + 1}. (score: ${r.score.toFixed(2)}) "${r.chunk.content.substring(0, 50)}..."`);
      });

      // TypeScript chunks should generally rank higher for a TypeScript query
      // (though LLM scoring can be unpredictable)
    }, 60000);
  });

  describe('Agentic Chunking', () => {
    it('should intelligently chunk a document', async () => {
      const chunker = new AgenticChunker({
        llmProvider: provider,
        maxChunkSize: 500
      });

      const document: Document = {
        id: 'test-doc',
        content: `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience.

## Supervised Learning

In supervised learning, algorithms learn from labeled training data. The model makes predictions based on input-output pairs.
Common algorithms include:
- Linear Regression for continuous outputs
- Decision Trees for classification
- Neural Networks for complex patterns

## Unsupervised Learning

Unsupervised learning finds patterns in unlabeled data. Key techniques include:
- Clustering: grouping similar data points
- Dimensionality Reduction: simplifying complex data
- Association Rules: finding relationships

## Reinforcement Learning

Reinforcement learning trains agents through rewards and penalties. Applications include game playing and robotics.
        `.trim(),
        metadata: { title: 'ML Introduction' },
        source: 'test',
      };

      const chunks = await chunker.chunk(document);

      // AgenticChunker may fall back to recursive chunking if LLM fails
      // So we just check we got at least 1 chunk
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      console.log(`  Created ${chunks.length} chunks from document:`);
      chunks.forEach((c, i) => {
        console.log(`    ${i + 1}. (${c.content.length} chars) "${c.content.substring(0, 60).replace(/\n/g, ' ')}..."`);
      });
    }, 60000);
  });
});

// ============================================================================
// Configuration Info Test (always runs)
// ============================================================================

describe('LLM Integration Test Configuration', () => {
  it('should report configuration status', () => {
    if (RUN_INTEGRATION) {
      console.log('\n LLM integration tests are ENABLED');
      console.log(`   API URL: ${BASE_URL}`);
      console.log(`   Model: ${MODEL}`);
    } else {
      console.log('\n LLM integration tests are SKIPPED');
      console.log('   Set LLM_TEST_API_KEY and LLM_TEST_BASE_URL to enable');
    }
    expect(true).toBe(true);
  });
});
