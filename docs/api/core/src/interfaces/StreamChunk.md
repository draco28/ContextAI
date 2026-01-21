[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / StreamChunk

# Interface: StreamChunk

Defined in: [core/src/provider/types.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L140)

Streaming chunk from LLM

## Properties

### type

> **type**: `"text"` \| `"done"` \| `"thinking"` \| `"tool_call"` \| `"usage"`

Defined in: [core/src/provider/types.ts:141](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L141)

***

### content?

> `optional` **content**: `string`

Defined in: [core/src/provider/types.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L142)

***

### toolCall?

> `optional` **toolCall**: `object`

Defined in: [core/src/provider/types.ts:143](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L143)

#### id?

> `optional` **id**: `string`

#### name?

> `optional` **name**: `string`

#### arguments?

> `optional` **arguments**: `string` \| `Record`\<`string`, `unknown`\>

Arguments as JSON string fragment (streaming) or parsed object

***

### usage?

> `optional` **usage**: [`TokenUsage`](TokenUsage.md)

Defined in: [core/src/provider/types.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L150)

Token usage (typically sent with 'usage' or 'done' chunk)

***

### metadata?

> `optional` **metadata**: [`ResponseMetadata`](ResponseMetadata.md)

Defined in: [core/src/provider/types.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L152)

Response metadata (typically sent with 'done' chunk)

***

### thinking?

> `optional` **thinking**: `string`

Defined in: [core/src/provider/types.ts:154](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L154)

Thinking/reasoning content (streamed in 'thinking' chunks)

***

### error?

> `optional` **error**: `object`

Defined in: [core/src/provider/types.ts:156](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L156)

Error information (for error chunks or partial failures)

#### message

> **message**: `string`

#### code?

> `optional` **code**: `string`
