import type {
  AgentConfig,
  AgentResponse,
  AgentRunOptions,
  StreamingAgentResponse,
  ReActEventCallbacks,
  Logger,
} from './types';
import { noopLogger } from './types';
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
  private readonly callbacks: ReActEventCallbacks;
  private readonly logger: Logger;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.callbacks = config.callbacks ?? {};
    this.logger = config.logger ?? noopLogger;
    this.reactLoop = new ReActLoop(
      config.llm,
      config.tools,
      config.maxIterations,
      this.logger
    );
  }

  /**
   * Run the agent with a user message (non-streaming)
   *
   * Uses arrow function syntax to preserve `this` binding when passed as callback.
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
   *
   * // Safe to pass as callback
   * const runFn = agent.run;
   * await runFn('Hello'); // Works correctly
   * ```
   */
  run = async (
    input: string,
    options: AgentRunOptions = {}
  ): Promise<AgentResponse> => {
    const messages = this.buildMessages(input, options.context);
    // Merge constructor callbacks with runtime callbacks (runtime overrides)
    const mergedCallbacks = { ...this.callbacks, ...options.callbacks };

    try {
      const { output, trace } = await this.reactLoop.execute(
        messages,
        options,
        mergedCallbacks
      );
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
  };

  /**
   * Run the agent with streaming output (TRUE STREAMING)
   *
   * Yields events AS THEY OCCUR during execution, not after completion.
   * This enables real-time UI updates for each thought, action, and observation.
   *
   * Event types:
   * - `thought`: Agent's reasoning (as soon as LLM responds)
   * - `action`: Tool being selected
   * - `observation`: Tool result (after execution)
   * - `text`: Final output text
   * - `done`: Completion with full response
   *
   * **Note**: Async generators cannot use arrow function syntax.
   * Do NOT pass this method as a callback - call it directly on the agent instance.
   *
   * @param input - The user's message or question
   * @param options - Optional runtime configuration
   *
   * @example
   * ```typescript
   * // ✅ CORRECT - Call directly on agent
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
   *
   * // ❌ WRONG - Do not pass as callback
   * const streamFn = agent.stream;
   * streamFn('input'); // 'this' will be undefined!
   * ```
   */
  async *stream(
    input: string,
    options: AgentRunOptions = {}
  ): StreamingAgentResponse {
    const messages = this.buildMessages(input, options.context);

    try {
      // Use executeStream for true streaming - events yielded as they happen
      for await (const event of this.reactLoop.executeStream(
        messages,
        options
      )) {
        if (event.type === 'thought') {
          yield { type: 'thought', content: event.content };
        } else if (event.type === 'action') {
          yield { type: 'action', tool: event.tool, input: event.input };
        } else if (event.type === 'observation') {
          yield {
            type: 'observation',
            result: event.result,
            success: event.success,
          };
        } else if (event.type === 'error') {
          // Handle error event from streaming
          yield {
            type: 'done',
            response: {
              output: '',
              trace: {
                steps: [],
                iterations: 0,
                totalTokens: 0,
                durationMs: 0,
              },
              success: false,
              error: event.error,
            },
          };
          return; // Stop iteration after error
        } else if (event.type === 'done') {
          // Emit final output text
          if (event.output) {
            yield { type: 'text', content: event.output };
          }
          // Emit done with full response
          yield {
            type: 'done',
            response: {
              output: event.output,
              trace: event.trace,
              success: true,
            },
          };
        }
        // Note: toolCall and delta events are internal, not exposed in StreamingAgentEvent
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      yield {
        type: 'done',
        response: {
          output: '',
          trace: {
            steps: [],
            iterations: 0,
            totalTokens: 0,
            durationMs: 0,
          },
          success: false,
          error: errorMessage,
        },
      };
    }
  }

  /**
   * Build conversation messages with system prompt
   *
   * Uses arrow function syntax to preserve `this` binding.
   */
  private buildMessages = (
    input: string,
    context?: ChatMessage[]
  ): ChatMessage[] => {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    if (context) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: input });

    return messages;
  };
}
