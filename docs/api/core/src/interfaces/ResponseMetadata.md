[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ResponseMetadata

# Interface: ResponseMetadata

Defined in: [core/src/provider/types.ts:89](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L89)

Response metadata for debugging and observability

## Properties

### requestId?

> `optional` **requestId**: `string`

Defined in: [core/src/provider/types.ts:91](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L91)

Provider-assigned request identifier

***

### modelVersion?

> `optional` **modelVersion**: `string`

Defined in: [core/src/provider/types.ts:93](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L93)

Model version that generated the response

***

### modelId?

> `optional` **modelId**: `string`

Defined in: [core/src/provider/types.ts:95](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L95)

Model identifier used

***

### cache?

> `optional` **cache**: [`CacheInfo`](CacheInfo.md)

Defined in: [core/src/provider/types.ts:97](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L97)

Cache information (Claude prompt caching, etc.)

***

### latencyMs?

> `optional` **latencyMs**: `number`

Defined in: [core/src/provider/types.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L99)

Response latency in milliseconds

***

### systemFingerprint?

> `optional` **systemFingerprint**: `string`

Defined in: [core/src/provider/types.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L101)

OpenAI system fingerprint for reproducibility
