import type {
  AgentConfig,
  AgentResponse,
  AgentRunOptions,
  StreamingAgentResponse,
} from './types';
import type { ChatMessage } from '../provider/types';
import { ReActLoop } from './react-loop';

/**
 * ContextAI Agent - ReAct-based reasoning agent
 *
 * The Agent class is the main entry point for creating AI agents that can:
 * - Reason about tasks using the ReAct pattern
 * - Use tools to interact with external systems
 * - Stream responses in real-time
 *
 * @example
 * ```typescript
 * const agent = new Agent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are a helpful assistant.',
 *   llm: myLLMProvider,
 *   tools: [searchTool, calculatorTool],
 *   maxIterations: 10,
 * });
 *
 * // Non-streaming
 * const response = await agent.run('What is 2 + 2?');
 * console.log(response.output);
 *
 * // Streaming
 * for await (const event of agent.stream('Search for news')) {
 *   if (event.type === 'thought') console.log('Thinking:', event.content);
 *   if (event.type === 'action') console.log('Using tool:', event.tool);
 *   if (event.type === 'text') console.log('Output:', event.content);
 * }
 * ```
 */
export class Agent {
  readonly name: string;
  private readonly systemPrompt: string;
  private readonly reactLoop: ReActLoop;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.reactLoop = new ReActLoop(
      config.llm,
      config.tools,
      config.maxIterations
    );
  }

  /**
   * Run the agent with a user message (non-streaming)
   *
   * @param input - The user's message or question
   * @param options - Optional runtime configuration
   * @returns AgentResponse with output, trace, and success status
   *
   * @example
   * ```typescript
   * const response = await agent.run('What is the weather?', {
   *   maxIterations: 5,
   *   context: [{ role: 'user', content: 'Previous question' }],
   * });
   * ```
   */
  async run(
    input: string,
    options: AgentRunOptions = {}
  ): Promise<AgentResponse> {
    const messages = this.buildMessages(input, options.context);

    try {
      const { output, trace } = await this.reactLoop.execute(messages, options);
      return {
        output,
        trace,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        output: '',
        trace: {
          steps: [],
          iterations: 0,
          totalTokens: 0,
          durationMs: 0,
        },
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Run the agent with streaming output
   *
   * Yields events as they occur:
   * - `thought`: Agent's reasoning
   * - `action`: Tool being called
   * - `observation`: Tool result
   * - `text`: Final output text
   * - `done`: Completion with full response
   *
   * @param input - The user's message or question
   * @param options - Optional runtime configuration
   *
   * @example
   * ```typescript
   * for await (const event of agent.stream('Analyze this data')) {
   *   switch (event.type) {
   *     case 'thought':
   *       console.log('Thinking:', event.content);
   *       break;
   *     case 'action':
   *       console.log('Tool:', event.tool, 'Input:', event.input);
   *       break;
   *     case 'observation':
   *       console.log('Result:', event.result);
   *       break;
   *     case 'text':
   *       process.stdout.write(event.content);
   *       break;
   *     case 'done':
   *       console.log('Complete!', event.response.trace);
   *       break;
   *   }
   * }
   * ```
   */
  async *stream(
    input: string,
    options: AgentRunOptions = {}
  ): StreamingAgentResponse {
    // For MVP, stream wraps run() and emits events from the trace
    // Full streaming (yielding as LLM generates) is a future enhancement
    const response = await this.run(input, options);

    // Emit trace steps
    for (const step of response.trace.steps) {
      if (step.type === 'thought') {
        yield { type: 'thought', content: step.content };
      } else if (step.type === 'action') {
        yield { type: 'action', tool: step.tool, input: step.input };
      } else if (step.type === 'observation') {
        yield {
          type: 'observation',
          result: step.result,
          success: step.success,
        };
      }
    }

    // Emit final output
    if (response.output) {
      yield { type: 'text', content: response.output };
    }

    yield { type: 'done', response };
  }

  /**
   * Build conversation messages with system prompt
   */
  private buildMessages(
    input: string,
    context?: ChatMessage[]
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    if (context) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: input });

    return messages;
  }
}
