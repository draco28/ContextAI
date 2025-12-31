import type { LLMProvider, ChatMessage, ToolCall } from '../provider/types';
import type { Tool } from '../tool/types';
import type {
  ReActStep,
  ReActTrace,
  Thought,
  Action,
  Observation,
  AgentRunOptions,
} from './types';
import { AgentError } from '../errors/errors';

const DEFAULT_MAX_ITERATIONS = 10;

/**
 * ReAct (Reasoning + Acting) loop implementation
 *
 * Executes the Thought -> Action -> Observation cycle:
 * 1. LLM generates a Thought (reasoning about what to do)
 * 2. LLM decides on an Action (which tool to use)
 * 3. Tool is executed and produces an Observation
 * 4. Loop repeats until LLM produces a final answer
 *
 * @example
 * ```typescript
 * const loop = new ReActLoop(llmProvider, tools, 10);
 * const { output, trace } = await loop.execute(messages);
 * console.log(trace.steps); // See the reasoning chain
 * ```
 */
export class ReActLoop {
  private readonly llm: LLMProvider;
  private readonly tools: Map<string, Tool>;
  private readonly maxIterations: number;

  constructor(
    llm: LLMProvider,
    tools: Tool[] = [],
    maxIterations: number = DEFAULT_MAX_ITERATIONS
  ) {
    this.llm = llm;
    this.tools = new Map(tools.map((t) => [t.name, t]));
    this.maxIterations = maxIterations;
  }

  /**
   * Execute the ReAct loop
   */
  async execute(
    messages: ChatMessage[],
    options: AgentRunOptions = {}
  ): Promise<{ output: string; trace: ReActTrace }> {
    const maxIter = options.maxIterations ?? this.maxIterations;
    const steps: ReActStep[] = [];
    const startTime = Date.now();
    let totalTokens = 0;
    let iterations = 0;

    const conversationMessages = [...messages];
    const toolDefs = Array.from(this.tools.values()).map((t) => t.toJSON());

    while (iterations < maxIter) {
      iterations++;

      // Check for abort
      if (options.signal?.aborted) {
        throw new AgentError('Agent execution aborted');
      }

      // Generate response from LLM
      const response = await this.llm.chat(conversationMessages, {
        tools: toolDefs.length > 0 ? toolDefs : undefined,
      });

      totalTokens += response.usage?.totalTokens ?? 0;

      // Record thought (the reasoning in the response)
      if (response.content) {
        const thought: Thought = {
          type: 'thought',
          content: response.content,
          timestamp: Date.now(),
        };
        steps.push(thought);
      }

      // If no tool calls, we have the final answer
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return {
          output: response.content,
          trace: {
            steps,
            iterations,
            totalTokens,
            durationMs: Date.now() - startTime,
          },
        };
      }

      // Execute tool calls
      for (const toolCall of response.toolCalls) {
        const action: Action = {
          type: 'action',
          tool: toolCall.name,
          input: toolCall.arguments,
          timestamp: Date.now(),
        };
        steps.push(action);

        const observation = await this.executeTool(toolCall, options.signal);
        steps.push(observation);

        // Add tool result to conversation
        conversationMessages.push({
          role: 'assistant',
          content: response.content || '',
        });
        conversationMessages.push({
          role: 'tool',
          content: JSON.stringify(observation.result),
          toolCallId: toolCall.id,
          name: toolCall.name,
        });
      }
    }

    throw new AgentError(
      `ReAct loop exceeded maximum iterations (${maxIter}). Consider increasing maxIterations or simplifying the task.`
    );
  }

  /**
   * Execute a single tool call
   */
  private async executeTool(
    toolCall: ToolCall,
    signal?: AbortSignal
  ): Promise<Observation> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      return {
        type: 'observation',
        result: { error: `Tool "${toolCall.name}" not found` },
        success: false,
        timestamp: Date.now(),
      };
    }

    try {
      const result = await tool.execute(toolCall.arguments, { signal });
      return {
        type: 'observation',
        result: result.success ? result.data : { error: result.error },
        success: result.success,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        type: 'observation',
        result: {
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        timestamp: Date.now(),
      };
    }
  }
}
