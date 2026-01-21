[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / LLMProvider

# Interface: LLMProvider

Defined in: [core/src/provider/types.ts:299](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L299)

LLM Provider interface - implement this for each provider

## Example

```typescript
class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  readonly model: string;

  constructor(config: LLMProviderConfig) {
    this.model = config.model;
  }

  async chat(messages, options) {
    // Implementation
  }

  async *streamChat(messages, options) {
    // Implementation
  }

  async isAvailable() {
    return true;
  }
}
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [core/src/provider/types.ts:300](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L300)

***

### model

> `readonly` **model**: `string`

Defined in: [core/src/provider/types.ts:301](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L301)

## Methods

### chat()

> **chat**(`messages`, `options?`): `Promise`\<[`ChatResponse`](ChatResponse.md)\>

Defined in: [core/src/provider/types.ts:306](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L306)

Generate a chat completion

#### Parameters

##### messages

[`ChatMessage`](ChatMessage.md)[]

##### options?

[`GenerateOptions`](GenerateOptions.md)

#### Returns

`Promise`\<[`ChatResponse`](ChatResponse.md)\>

***

### streamChat()

> **streamChat**(`messages`, `options?`): `AsyncGenerator`\<[`StreamChunk`](StreamChunk.md), `void`, `unknown`\>

Defined in: [core/src/provider/types.ts:314](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L314)

Stream a chat completion

#### Parameters

##### messages

[`ChatMessage`](ChatMessage.md)[]

##### options?

[`GenerateOptions`](GenerateOptions.md)

#### Returns

`AsyncGenerator`\<[`StreamChunk`](StreamChunk.md), `void`, `unknown`\>

***

### isAvailable()

> **isAvailable**(): `Promise`\<`boolean`\>

Defined in: [core/src/provider/types.ts:322](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L322)

Check if provider is configured and available

#### Returns

`Promise`\<`boolean`\>

***

### getRateLimits()?

> `optional` **getRateLimits**(): `Promise`\<[`RateLimitInfo`](RateLimitInfo.md)\>

Defined in: [core/src/provider/types.ts:327](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L327)

Get current rate limit status (optional)

#### Returns

`Promise`\<[`RateLimitInfo`](RateLimitInfo.md)\>

***

### listModels()?

> `optional` **listModels**(): `Promise`\<[`ModelInfo`](ModelInfo.md)[]\>

Defined in: [core/src/provider/types.ts:332](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L332)

List available models (optional)

#### Returns

`Promise`\<[`ModelInfo`](ModelInfo.md)[]\>

***

### countTokens()?

> `optional` **countTokens**(`messages`): `Promise`\<`number`\>

Defined in: [core/src/provider/types.ts:337](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L337)

Count tokens in messages (optional)

#### Parameters

##### messages

[`ChatMessage`](ChatMessage.md)[]

#### Returns

`Promise`\<`number`\>
