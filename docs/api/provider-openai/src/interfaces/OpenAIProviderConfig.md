[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-openai/src](../README.md) / OpenAIProviderConfig

# Interface: OpenAIProviderConfig

Defined in: [provider-openai/src/types.ts:16](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L16)

Configuration for the OpenAI provider.

## Example

```typescript
const config: OpenAIProviderConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  organization: 'org-xxx', // optional
  baseURL: 'https://api.openai.com/v1', // optional, for OpenRouter etc.
};
```

## Extends

- `LLMProviderConfig`

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [provider-openai/src/types.ts:20](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L20)

OpenAI API key. Required unless using a custom baseURL that doesn't need auth.

#### Overrides

`LLMProviderConfig.apiKey`

***

### model

> **model**: `string`

Defined in: [provider-openai/src/types.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L25)

Model identifier (e.g., 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo').

#### Overrides

`LLMProviderConfig.model`

***

### organization?

> `optional` **organization**: `string`

Defined in: [provider-openai/src/types.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L30)

Optional organization ID for OpenAI API requests.

#### Overrides

`LLMProviderConfig.organization`

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [provider-openai/src/types.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L38)

Optional base URL for the API. Useful for:
- OpenRouter: 'https://openrouter.ai/api/v1'
- Azure OpenAI: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}'
- Local proxies or self-hosted endpoints

#### Overrides

`LLMProviderConfig.baseURL`

***

### defaultOptions?

> `optional` **defaultOptions**: `Partial`\<`GenerateOptions`\>

Defined in: [provider-openai/src/types.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L44)

Default generation options applied to all requests.
Can be overridden per-request.

#### Overrides

`LLMProviderConfig.defaultOptions`

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [provider-openai/src/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L49)

Request timeout in milliseconds. Default: 60000 (60 seconds).

#### Overrides

`LLMProviderConfig.timeout`

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [provider-openai/src/types.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L54)

Maximum number of retries for failed requests. Default: 2.

#### Overrides

`LLMProviderConfig.maxRetries`

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [provider-openai/src/types.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-openai/src/types.ts#L59)

Additional headers to include in API requests.

#### Overrides

`LLMProviderConfig.headers`
