import { z } from 'zod';

/**
 * Schema for validating ChatMessage objects
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool'], {
    errorMap: () => ({
      message: "Role must be 'system', 'user', 'assistant', or 'tool'",
    }),
  }),
  content: z.union([z.string(), z.array(z.any())]),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
});

/**
 * Schema for validating LLMProvider interface
 * Uses passthrough to allow additional properties
 */
export const LLMProviderSchema = z
  .object({
    name: z.string({
      required_error: 'LLM provider must have a name property',
    }),
    model: z.string({
      required_error: 'LLM provider must have a model property',
    }),
    chat: z.function(),
    streamChat: z.function(),
    isAvailable: z.function(),
  })
  .passthrough();

/**
 * Schema for validating AgentConfig
 */
export const AgentConfigSchema = z.object({
  name: z
    .string({
      required_error: 'Agent name is required',
    })
    .min(1, 'Agent name cannot be empty'),
  systemPrompt: z
    .string({
      required_error: 'System prompt is required',
    })
    .min(1, 'System prompt cannot be empty'),
  llm: LLMProviderSchema,
  tools: z.array(z.any()).optional(),
  maxIterations: z
    .number()
    .int('maxIterations must be an integer')
    .positive('maxIterations must be positive')
    .max(100, 'maxIterations cannot exceed 100')
    .optional(),
  callbacks: z.object({}).passthrough().optional(),
  logger: z.object({}).passthrough().optional(),
});

/**
 * Schema for validating AgentRunOptions
 */
export const AgentRunOptionsSchema = z.object({
  maxIterations: z
    .number()
    .int('maxIterations must be an integer')
    .positive('maxIterations must be positive')
    .max(100, 'maxIterations cannot exceed 100')
    .optional(),
  context: z.array(ChatMessageSchema).optional(),
  signal: z.any().optional(), // AbortSignal is a browser/Node API
  callbacks: z.object({}).passthrough().optional(),
});

/**
 * Schema for validating string input to run() and stream()
 */
export const InputStringSchema = z
  .string({
    required_error: 'Input is required',
    invalid_type_error: 'Input must be a string',
  })
  .min(1, 'Input cannot be empty');

export type ValidatedAgentConfig = z.infer<typeof AgentConfigSchema>;
export type ValidatedAgentRunOptions = z.infer<typeof AgentRunOptionsSchema>;
