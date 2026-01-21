[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-ollama/src](../README.md) / OllamaProvider

# Class: OllamaProvider

Defined in: [provider-ollama/src/ollama-provider.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L71)

Ollama Local LLM Provider.

Provides chat completions using locally running Ollama models with support for:
- Streaming and non-streaming responses
- Tool/function calling (Ollama 0.1.44+)
- Multimodal inputs (images for LLaVA, etc.)
- Model listing and availability checks

## Implements

- `LLMProvider`

## Constructors

### Constructor

> **new OllamaProvider**(`config`): `OllamaProvider`

Defined in: [provider-ollama/src/ollama-provider.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L99)

Creates a new Ollama provider instance.

#### Parameters

##### config

[`OllamaProviderConfig`](../interfaces/OllamaProviderConfig.md)

Provider configuration

#### Returns

`OllamaProvider`

#### Throws

If configuration is invalid

## Properties

### name

> `readonly` **name**: `"ollama"` = `'ollama'`

Defined in: [provider-ollama/src/ollama-provider.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L73)

Provider identifier

#### Implementation of

`LLMProvider.name`

***

### model

> `readonly` **model**: `string`

Defined in: [provider-ollama/src/ollama-provider.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L76)

Model being used (e.g., 'llama3.2', 'mistral')

#### Implementation of

`LLMProvider.model`

## Methods

### chat()

> **chat**(`messages`, `options?`): `Promise`\<`ChatResponse`\>

Defined in: [provider-ollama/src/ollama-provider.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L142)

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

Defined in: [provider-ollama/src/ollama-provider.ts:223](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L223)

Sends a streaming chat completion request.

Yields chunks as they arrive:
- `{ type: 'text', content: '...' }` - Incremental text
- `{ type: 'tool_call', toolCall: {...} }` - Tool invocation
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

Defined in: [provider-ollama/src/ollama-provider.ts:314](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L314)

Checks if the Ollama server is running and the model is available.

Makes a request to the /api/tags endpoint to verify connectivity.
Optionally checks if the configured model is in the list.

#### Returns

`Promise`\<`boolean`\>

true if available, false otherwise

#### Example

```typescript
if (await provider.isAvailable()) {
  // Safe to make requests
} else {
  console.error('Ollama not available. Run: ollama serve');
}
```

#### Implementation of

`LLMProvider.isAvailable`

***

### listModels()

> **listModels**(): `Promise`\<`ModelInfo`[]\>

Defined in: [provider-ollama/src/ollama-provider.ts:363](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/ollama-provider.ts#L363)

Lists all models available on the Ollama server.

#### Returns

`Promise`\<`ModelInfo`[]\>

Array of model information

#### Example

```typescript
const models = await provider.listModels();
console.log('Available models:', models.map(m => m.id));
```

#### Implementation of

`LLMProvider.listModels`
