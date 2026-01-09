import { describe, it, expect } from 'vitest';
import { ToolCallAggregator } from '../src/agent/tool-call-aggregator';
import type { StreamChunk } from '../src/provider/types';

describe('ToolCallAggregator', () => {
  it('should aggregate a complete tool call from chunks', () => {
    const aggregator = new ToolCallAggregator();

    // Simulate chunks arriving from LLM stream
    const chunks: StreamChunk[] = [
      { type: 'tool_call', toolCall: { id: 'call_123' } },
      { type: 'tool_call', toolCall: { name: 'search' } },
      { type: 'tool_call', toolCall: { arguments: '{"query":' } },
      { type: 'tool_call', toolCall: { arguments: ' "weather"}' } },
    ];

    for (const chunk of chunks) {
      aggregator.process(chunk);
    }

    const toolCalls = aggregator.finalize();

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0]).toEqual({
      id: 'call_123',
      name: 'search',
      arguments: { query: 'weather' },
    });
  });

  it('should handle multiple tool calls', () => {
    const aggregator = new ToolCallAggregator();

    const chunks: StreamChunk[] = [
      { type: 'tool_call', toolCall: { id: 'call_1', name: 'search' } },
      { type: 'tool_call', toolCall: { arguments: '{"q": "a"}' } },
      { type: 'tool_call', toolCall: { id: 'call_2', name: 'calculate' } },
      { type: 'tool_call', toolCall: { arguments: '{"x": 1}' } },
    ];

    for (const chunk of chunks) {
      aggregator.process(chunk);
    }

    const toolCalls = aggregator.finalize();

    expect(toolCalls).toHaveLength(2);
    expect(toolCalls[0].name).toBe('search');
    expect(toolCalls[1].name).toBe('calculate');
  });

  it('should skip incomplete tool calls (missing name)', () => {
    const aggregator = new ToolCallAggregator();

    const chunks: StreamChunk[] = [
      { type: 'tool_call', toolCall: { id: 'call_123' } },
      { type: 'tool_call', toolCall: { arguments: '{}' } },
      // Missing name - should be skipped
    ];

    for (const chunk of chunks) {
      aggregator.process(chunk);
    }

    const toolCalls = aggregator.finalize();
    expect(toolCalls).toHaveLength(0);
  });

  it('should handle malformed JSON gracefully', () => {
    const aggregator = new ToolCallAggregator();

    const chunks: StreamChunk[] = [
      { type: 'tool_call', toolCall: { id: 'call_123', name: 'search' } },
      { type: 'tool_call', toolCall: { arguments: '{invalid json' } },
    ];

    for (const chunk of chunks) {
      aggregator.process(chunk);
    }

    const toolCalls = aggregator.finalize();
    expect(toolCalls).toHaveLength(0); // Skipped due to JSON parse error
  });

  it('should handle pre-parsed arguments object', () => {
    const aggregator = new ToolCallAggregator();

    const chunks: StreamChunk[] = [
      {
        type: 'tool_call',
        toolCall: {
          id: 'call_123',
          name: 'search',
          arguments: { query: 'test' } as unknown as Record<string, unknown>,
        },
      },
    ];

    for (const chunk of chunks) {
      aggregator.process(chunk);
    }

    const toolCalls = aggregator.finalize();

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].arguments).toEqual({ query: 'test' });
  });

  it('should reset state correctly', () => {
    const aggregator = new ToolCallAggregator();

    aggregator.process({
      type: 'tool_call',
      toolCall: { id: 'call_1', name: 'test', arguments: '{}' },
    });

    expect(aggregator.hasPending()).toBe(true);

    aggregator.reset();

    expect(aggregator.hasPending()).toBe(false);
    expect(aggregator.finalize()).toHaveLength(0);
  });

  it('should ignore non-tool_call chunks', () => {
    const aggregator = new ToolCallAggregator();

    aggregator.process({ type: 'text', content: 'hello' });
    aggregator.process({ type: 'done' });

    expect(aggregator.hasPending()).toBe(false);
    expect(aggregator.finalize()).toHaveLength(0);
  });
});
