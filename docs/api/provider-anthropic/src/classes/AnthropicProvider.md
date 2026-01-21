[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / AnthropicProvider

# Class: AnthropicProvider

Defined in: [provider-anthropic/src/anthropic-provider.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L58)

Anthropic Claude LLM Provider.

Provides chat completions using Anthropic's Claude models with support for:
- Streaming and non-streaming responses
- Tool/function calling
- Extended thinking (reasoning)
- Multimodal inputs (images)
- Rate limit tracking

## Implements

- `LLMProvider`

## Constructors

### Constructor

> **new AnthropicProvider**(`config`): `AnthropicProvider`

Defined in: [provider-anthropic/src/anthropic-provider.ts:87](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L87)

Creates a new Anthropic provider instance.

#### Parameters

##### config

[`AnthropicProviderConfig`](../interfaces/AnthropicProviderConfig.md)

Provider configuration

#### Returns

`AnthropicProvider`

#### Throws

If configuration is invalid

## Properties

### name

> `readonly` **name**: `"anthropic"` = `'anthropic'`

Defined in: [provider-anthropic/src/anthropic-provider.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L60)

Provider identifier

#### Implementation of

`LLMProvider.name`

***

### model

> `readonly` **model**: `string`

Defined in: [provider-anthropic/src/anthropic-provider.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L63)

Model being used (e.g., 'claude-sonnet-4-20250514')

#### Implementation of

`LLMProvider.model`

## Methods

### chat()

> **chat**(`messages`, `options?`): `Promise`\<`ChatResponse`\>

Defined in: [provider-anthropic/src/anthropic-provider.ts:147](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L147)

Sends a chat completion request (non-streaming).

#### Parameters

##### messages

`ChatMessage`[]

Conversation messages

##### options?

`GenerateOptions`

Generation options (temperature, tools, etc.)

#### Returns

`Promise`\<`ChatResponse`\>

Chat response with content, tool calls, and usage

#### Example

```typescript
const response = await provider.chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'What is 2+2?' }
], { temperature: 0 });

console.log(response.content); // "4"
```

#### Implementation of

`LLMProvider.chat`

***

### streamChat()

> **streamChat**(`messages`, `options?`): `AsyncGenerator`\<`StreamChunk`, `void`, `unknown`\>

Defined in: [provider-anthropic/src/anthropic-provider.ts:216](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L216)

Sends a streaming chat completion request.

Yields chunks as they arrive:
- `{ type: 'text', content: '...' }` - Incremental text
- `{ type: 'tool_call', toolCall: {...} }` - Tool invocation
- `{ type: 'thinking', thinking: '...' }` - Extended thinking
- `{ type: 'usage', usage: {...} }` - Token counts
- `{ type: 'done', metadata: {...} }` - Stream complete

#### Parameters

##### messages

`ChatMessage`[]

Conversation messages

##### options?

`GenerateOptions`

Generation options

#### Returns

`AsyncGenerator`\<`StreamChunk`, `void`, `unknown`\>

#### Yields

StreamChunk objects

#### Example

```typescript
for await (const chunk of provider.streamChat(messages)) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.content ?? '');
      break;
    case 'tool_call':
      console.log('Tool:', chunk.toolCall);
      break;
  }
}
```

#### Remarks

This is an async generator method, not an arrow function, because
JavaScript doesn't support arrow function generators (`async *() =>`).
Avoid passing this method as a callback without binding.

#### Implementation of

`LLMProvider.streamChat`

***

### isAvailable()

> **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [provider-anthropic/src/anthropic-provider.ts:323](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L323)

Checks if the provider is available and credentials are valid.

Makes a minimal API call to verify the API key works.
Use this to validate configuration before making real requests.

#### Returns

`Promise`\<`boolean`\>

true if available, false otherwise

#### Example

```typescript
if (await provider.isAvailable()) {
  // Safe to make requests
} else {
  console.error('Anthropic provider not available');
}
```

#### Implementation of

`LLMProvider.isAvailable`

***

### getRateLimits()

> **getRateLimits**(): `Promise`\<`RateLimitInfo`\>

Defined in: [provider-anthropic/src/anthropic-provider.ts:376](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/anthropic-provider.ts#L376)

Returns current rate limit information from the last API response.

Anthropic includes rate limit headers in responses:
- anthropic-ratelimit-requests-remaining
- anthropic-ratelimit-tokens-remaining
- anthropic-ratelimit-*-reset

#### Returns

`Promise`\<`RateLimitInfo`\>

Rate limit info or null if not available

#### Example

```typescript
const limits = await provider.getRateLimits();
if (limits?.requestsRemaining === 0) {
  await sleep(limits.resetAt - Date.now());
}
```

#### Implementation of

`LLMProvider.getRateLimits`
