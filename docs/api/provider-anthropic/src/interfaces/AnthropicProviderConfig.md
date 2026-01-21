[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / AnthropicProviderConfig

# Interface: AnthropicProviderConfig

Defined in: [provider-anthropic/src/types.ts:14](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L14)

Configuration for the Anthropic Claude provider.

## Example

```typescript
const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});
```

## Extends

- `LLMProviderConfig`

## Properties

### organization?

> `optional` **organization**: `string`

Defined in: core/dist/index.d.ts:251

Organization ID (OpenAI)

#### Inherited from

`LLMProviderConfig.organization`

***

### apiKey

> **apiKey**: `string`

Defined in: [provider-anthropic/src/types.ts:19](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L19)

Anthropic API key.
Get one at: https://console.anthropic.com/

#### Overrides

`LLMProviderConfig.apiKey`

***

### model

> **model**: `string`

Defined in: [provider-anthropic/src/types.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L25)

Model identifier.
Examples: 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'

#### Overrides

`LLMProviderConfig.model`

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [provider-anthropic/src/types.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L31)

Base URL for the Anthropic API.

#### Default

```ts
'https://api.anthropic.com'
```

#### Overrides

`LLMProviderConfig.baseURL`

***

### defaultOptions?

> `optional` **defaultOptions**: `Partial`\<`GenerateOptions`\>

Defined in: [provider-anthropic/src/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L37)

Default generation options applied to all requests.
Can be overridden per-request.

#### Overrides

`LLMProviderConfig.defaultOptions`

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [provider-anthropic/src/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L43)

Request timeout in milliseconds.

#### Default

```ts
60000 (60 seconds)
```

#### Overrides

`LLMProviderConfig.timeout`

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [provider-anthropic/src/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L49)

Maximum number of retries for failed requests.

#### Default

```ts
2
```

#### Overrides

`LLMProviderConfig.maxRetries`

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [provider-anthropic/src/types.ts:54](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L54)

Custom headers to include in all requests.

#### Overrides

`LLMProviderConfig.headers`

***

### betaFeatures?

> `optional` **betaFeatures**: `string`[]

Defined in: [provider-anthropic/src/types.ts:61](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/types.ts#L61)

Enable beta features.
Adds the 'anthropic-beta' header with the specified features.

#### Example

```ts
['prompt-caching-2024-07-31', 'max-tokens-3-5-sonnet-2024-07-15']
```
