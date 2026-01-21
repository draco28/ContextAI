[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-openai/src](../README.md) / OpenAIProvider

# Class: OpenAIProvider

Defined in: [provider-openai/src/openai-provider.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L50)

OpenAI LLM provider for ContextAI SDK.

Supports GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, and other OpenAI models.
Also compatible with OpenAI-compatible APIs like OpenRouter.

## Example

```typescript
import { OpenAIProvider } from '@contextai/provider-openai';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

// Non-streaming
const response = await provider.chat([
  { role: 'user', content: 'Hello!' }
]);

// Streaming
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Tell me a story' }
])) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content!);
  }
}
```

## Implements

- `LLMProvider`

## Constructors

### Constructor

> **new OpenAIProvider**(`config`): `OpenAIProvider`

Defined in: [provider-openai/src/openai-provider.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L64)

#### Parameters

##### config

[`OpenAIProviderConfig`](../interfaces/OpenAIProviderConfig.md)

#### Returns

`OpenAIProvider`

## Properties

### name

> `readonly` **name**: `"openai"` = `'openai'`

Defined in: [provider-openai/src/openai-provider.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L51)

#### Implementation of

`LLMProvider.name`

***

### model

> `readonly` **model**: `string`

Defined in: [provider-openai/src/openai-provider.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L52)

#### Implementation of

`LLMProvider.model`

## Methods

### chat()

> **chat**(`messages`, `options?`): `Promise`\<`ChatResponse`\>

Defined in: [provider-openai/src/openai-provider.ts:82](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L82)

Send a chat completion request (non-streaming).

#### Parameters

##### messages

`ChatMessage`[]

##### options?

`GenerateOptions`

#### Returns

`Promise`\<`ChatResponse`\>

#### Implementation of

`LLMProvider.chat`

***

### streamChat()

> **streamChat**(`messages`, `options?`): `AsyncGenerator`\<`StreamChunk`, `void`, `unknown`\>

Defined in: [provider-openai/src/openai-provider.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L115)

Send a streaming chat completion request.

Note: This is a regular async generator method, not an arrow function,
because TypeScript doesn't support arrow function generators.
Do not pass this method as a callback without binding.

#### Parameters

##### messages

`ChatMessage`[]

##### options?

`GenerateOptions`

#### Returns

`AsyncGenerator`\<`StreamChunk`, `void`, `unknown`\>

#### Implementation of

`LLMProvider.streamChat`

***

### isAvailable()

> **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [provider-openai/src/openai-provider.ts:183](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L183)

Check if the provider is available (API key is set).

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`LLMProvider.isAvailable`

***

### getRateLimits()

> **getRateLimits**(): `Promise`\<`RateLimitInfo`\>

Defined in: [provider-openai/src/openai-provider.ts:198](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/openai-provider.ts#L198)

Get current rate limit information.
Returns cached values from the most recent API response.

#### Returns

`Promise`\<`RateLimitInfo`\>

#### Implementation of

`LLMProvider.getRateLimits`
