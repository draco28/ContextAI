[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-ollama/src](../README.md) / OllamaProviderConfig

# Interface: OllamaProviderConfig

Defined in: [provider-ollama/src/types.ts:14](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L14)

Configuration for the Ollama local LLM provider.

## Example

```typescript
const provider = new OllamaProvider({
  model: 'llama3.2',
  host: 'http://localhost:11434',
});
```

## Extends

- `Omit`\<`LLMProviderConfig`, `"apiKey"`\>

## Properties

### baseURL?

> `optional` **baseURL**: `string`

Defined in: core/dist/index.d.ts:241

#### Inherited from

`Omit.baseURL`

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: core/dist/index.d.ts:247

Maximum retry attempts for failed requests

#### Inherited from

`Omit.maxRetries`

***

### organization?

> `optional` **organization**: `string`

Defined in: core/dist/index.d.ts:251

Organization ID (OpenAI)

#### Inherited from

[`AnthropicProviderConfig`](../../../provider-anthropic/src/interfaces/AnthropicProviderConfig.md).[`organization`](../../../provider-anthropic/src/interfaces/AnthropicProviderConfig.md#organization)

***

### model

> **model**: `string`

Defined in: [provider-ollama/src/types.ts:19](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L19)

Model identifier (e.g., 'llama3.2', 'mistral', 'codellama').
Run `ollama list` to see available models.

#### Overrides

`Omit.model`

***

### host?

> `optional` **host**: `string`

Defined in: [provider-ollama/src/types.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L25)

Ollama server host URL.

#### Default

```ts
'http://localhost:11434'
```

***

### defaultOptions?

> `optional` **defaultOptions**: `Partial`\<`GenerateOptions`\>

Defined in: [provider-ollama/src/types.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L31)

Default generation options applied to all requests.
Can be overridden per-request.

#### Overrides

`Omit.defaultOptions`

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [provider-ollama/src/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L37)

Request timeout in milliseconds.

#### Default

```ts
120000 (2 minutes - local models can be slow)
```

#### Overrides

`Omit.timeout`

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [provider-ollama/src/types.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L42)

Custom headers to include in all requests.

#### Overrides

`Omit.headers`

***

### keepAlive?

> `optional` **keepAlive**: `string`

Defined in: [provider-ollama/src/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/types.ts#L49)

Keep model loaded in memory between requests.
Set to '0' to unload immediately, or a duration like '5m'.

#### Default

```ts
undefined (uses Ollama's default)
```
