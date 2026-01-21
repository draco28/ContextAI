[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / LLMProviderConfig

# Interface: LLMProviderConfig

Defined in: [core/src/provider/types.ts:257](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L257)

LLM Provider configuration

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: [core/src/provider/types.ts:258](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L258)

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [core/src/provider/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L259)

***

### model

> **model**: `string`

Defined in: [core/src/provider/types.ts:260](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L260)

***

### defaultOptions?

> `optional` **defaultOptions**: `Partial`\<[`GenerateOptions`](GenerateOptions.md)\>

Defined in: [core/src/provider/types.ts:261](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L261)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [core/src/provider/types.ts:263](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L263)

Request timeout in milliseconds

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [core/src/provider/types.ts:265](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L265)

Maximum retry attempts for failed requests

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [core/src/provider/types.ts:267](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L267)

Custom headers to include in requests

***

### organization?

> `optional` **organization**: `string`

Defined in: [core/src/provider/types.ts:269](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L269)

Organization ID (OpenAI)
