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
import type { MemoryProvider } from './memory';
import { ConversationContext } from './context';
import { ReActLoop } from './react-loop';
import {
  AgentConfigSchema,
  AgentRunOptionsSchema,
  InputStringSchema,
} from './schemas';
import { ValidationError } from '../errors';

/**
 * ContextAI Agent - ReAct-based reasoning agent
 *
 * The Agent class is the main entry point for creating AI agents that can:
 * - Reason about tasks using the ReAct pattern
 * - Use tools to interact with external systems
 * - Stream responses in real-time
 * - Maintain conversation context across multiple interactions
 *
 * @example
 * ```typescript
 * // Basic usage (stateless)
 * const agent = new Agent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are a helpful assistant.',
 *   llm: myLLMProvider,
 *   tools: [searchTool, calculatorTool],
 * });
 *
 * const response = await agent.run('What is 2 + 2?');
 *
 * // With conversation memory (stateful)
 * const agent = new Agent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are a helpful assistant.',
 *   llm: myLLMProvider,
 *   memory: new InMemoryProvider(),
 *   sessionId: 'user-123',
 *   maxContextTokens: 4000,
 * });
 *
 * await agent.run('My name is Alice');
 * await agent.run('What is my name?'); // Remembers: "Alice"
 * ```
 */
export class Agent {
  readonly name: string;
  private readonly systemPrompt: string;
  private readonly reactLoop: ReActLoop;
  private readonly callbacks: ReActEventCallbacks;
  private readonly logger: Logger;
  private readonly conversationContext: ConversationContext;
  private readonly memory: MemoryProvider | undefined;
  private readonly sessionId: string | undefined;
  private contextLoaded: boolean = false;

  constructor(config: AgentConfig) {
    // Validate configuration
    const configResult = AgentConfigSchema.safeParse(config);
    if (!configResult.success) {
      throw new ValidationError(
        'Invalid Agent configuration',
        configResult.error.issues
      );
    }

    // Validate memory + sessionId pairing
    if (config.memory && !config.sessionId) {
      throw new ValidationError(
        'sessionId is required when memory is provided',
        [
          {
            code: 'custom',
            path: ['sessionId'],
            message: 'sessionId is required when memory is provided',
          },
        ]
      );
    }

    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.callbacks = config.callbacks ?? {};
    this.logger = config.logger ?? noopLogger;
    this.memory = config.memory;
    this.sessionId = config.sessionId;

    // Initialize conversation context
    this.conversationContext = new ConversationContext({
      maxTokens: config.maxContextTokens,
      initialMessages: config.context,
      tokenCounter: config.tokenCounter,
    });

    this.reactLoop = new ReActLoop(
      config.llm,
      config.tools,
      config.maxIterations,
      this.logger,
      config.errorRecovery
    );
  }

  /**
   * Load conversation history from memory provider
   * Called lazily on first run() if memory is configured
   */
  private loadContext = async (): Promise<void> => {
    if (this.contextLoaded || !this.memory || !this.sessionId) {
      return;
    }

    const savedMessages = await this.memory.load(this.sessionId);
    if (savedMessages.length > 0) {
      this.conversationContext.addMessages(savedMessages);
      this.logger.debug('Loaded conversation context from memory', {
        sessionId: this.sessionId,
        messageCount: savedMessages.length,
      });
    }

    this.contextLoaded = true;
  };

  /**
   * Save conversation history to memory provider
   */
  private saveContext = async (): Promise<void> => {
    if (!this.memory || !this.sessionId) {
      return;
    }

    await this.memory.save(
      this.sessionId,
      this.conversationContext.getMessages()
    );
    this.logger.debug('Saved conversation context to memory', {
      sessionId: this.sessionId,
      messageCount: this.conversationContext.length,
    });
  };

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
    // Validate input
    const inputResult = InputStringSchema.safeParse(input);
    if (!inputResult.success) {
      throw new ValidationError('Invalid input', inputResult.error.issues);
    }

    // Validate options if provided
    if (Object.keys(options).length > 0) {
      const optionsResult = AgentRunOptionsSchema.safeParse(options);
      if (!optionsResult.success) {
        throw new ValidationError(
          'Invalid run options',
          optionsResult.error.issues
        );
      }
    }

    // Load context from memory on first run
    await this.loadContext();

    // Add user message to conversation context
    const userMessage: ChatMessage = { role: 'user', content: input };
    this.conversationContext.addMessage(userMessage);

    // Build messages: system prompt + conversation context + runtime context
    const messages = this.buildMessages(options.context);

    // Merge constructor callbacks with runtime callbacks (runtime overrides)
    const mergedCallbacks = { ...this.callbacks, ...options.callbacks };

    try {
      const { output, trace } = await this.reactLoop.execute(
        messages,
        options,
        mergedCallbacks
      );

      // Add assistant response to conversation context
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: output,
      };
      this.conversationContext.addMessage(assistantMessage);

      // Truncate if over token limit
      await this.conversationContext.truncate();

      // Save to memory
      await this.saveContext();

      return {
        output,
        trace,
        success: true,
      };
    } catch (error) {
      // Remove the user message we added since the call failed
      // This prevents partial state from being saved
      const contextMessages = this.conversationContext.getMessages();
      const lastMessage = contextMessages[contextMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        // Re-initialize context without the failed message
        this.conversationContext.clear();
        this.conversationContext.addMessages(contextMessages.slice(0, -1));
      }

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
    // Validate input
    const inputResult = InputStringSchema.safeParse(input);
    if (!inputResult.success) {
      throw new ValidationError('Invalid input', inputResult.error.issues);
    }

    // Validate options if provided
    if (Object.keys(options).length > 0) {
      const optionsResult = AgentRunOptionsSchema.safeParse(options);
      if (!optionsResult.success) {
        throw new ValidationError(
          'Invalid run options',
          optionsResult.error.issues
        );
      }
    }

    // Load context from memory on first run
    await this.loadContext();

    // Add user message to conversation context
    const userMessage: ChatMessage = { role: 'user', content: input };
    this.conversationContext.addMessage(userMessage);

    // Build messages: system prompt + conversation context + runtime context
    const messages = this.buildMessages(options.context);

    try {
      let finalOutput = '';

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
          // Remove the user message since the call failed
          const msgs = this.conversationContext.getMessages();
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'user') {
            this.conversationContext.clear();
            this.conversationContext.addMessages(msgs.slice(0, -1));
          }

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
          return;
        } else if (event.type === 'done') {
          finalOutput = event.output;

          // Add assistant response to conversation context
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: finalOutput,
          };
          this.conversationContext.addMessage(assistantMessage);

          // Truncate if over token limit
          await this.conversationContext.truncate();

          // Save to memory
          await this.saveContext();

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
      }
    } catch (error) {
      // Remove the user message since the call failed
      const msgs = this.conversationContext.getMessages();
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        this.conversationContext.clear();
        this.conversationContext.addMessages(msgs.slice(0, -1));
      }

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
   * Get the current conversation context
   *
   * @returns ConversationContext instance for inspection or manipulation
   */
  getContext = (): ConversationContext => {
    return this.conversationContext;
  };

  /**
   * Clear the conversation context and optionally clear memory
   *
   * @param clearMemory - If true, also clears persisted memory
   */
  clearContext = async (clearMemory: boolean = false): Promise<void> => {
    this.conversationContext.clear();

    if (clearMemory && this.memory && this.sessionId) {
      await this.memory.clear(this.sessionId);
      this.logger.debug('Cleared conversation memory', {
        sessionId: this.sessionId,
      });
    }
  };

  /**
   * Build conversation messages with system prompt
   *
   * Uses arrow function syntax to preserve `this` binding.
   */
  private buildMessages = (runtimeContext?: ChatMessage[]): ChatMessage[] => {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    // Add conversation history (excluding system messages already in context)
    const contextMessages = this.conversationContext.getMessages();
    for (const msg of contextMessages) {
      if (msg.role !== 'system') {
        messages.push(msg);
      }
    }

    // Add runtime context if provided (for one-off additional context)
    if (runtimeContext) {
      messages.push(...runtimeContext);
    }

    return messages;
  };
}
