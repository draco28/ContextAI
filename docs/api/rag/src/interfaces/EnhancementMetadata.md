[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EnhancementMetadata

# Interface: EnhancementMetadata

Defined in: [rag/src/query-enhancement/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L43)

Metadata about the enhancement operation.
Provides transparency into what was done and at what cost.

## Properties

### tokensUsed?

> `optional` **tokensUsed**: `number`

Defined in: [rag/src/query-enhancement/types.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L45)

Total tokens used by LLM calls (if available)

***

### llmLatencyMs?

> `optional` **llmLatencyMs**: `number`

Defined in: [rag/src/query-enhancement/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L47)

Time spent on LLM calls in milliseconds

***

### hypotheticalDocs?

> `optional` **hypotheticalDocs**: `string`[]

Defined in: [rag/src/query-enhancement/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L49)

For HyDE: the generated hypothetical document(s)

***

### queryReasonings?

> `optional` **queryReasonings**: `string`[]

Defined in: [rag/src/query-enhancement/types.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L51)

For multi-query: reasoning behind each variant

***

### skipped?

> `optional` **skipped**: `boolean`

Defined in: [rag/src/query-enhancement/types.ts:53](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L53)

Whether enhancement was skipped (e.g., query too short)

***

### skipReason?

> `optional` **skipReason**: `string`

Defined in: [rag/src/query-enhancement/types.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L55)

Reason for skipping enhancement
