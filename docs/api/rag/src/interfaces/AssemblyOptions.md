[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AssemblyOptions

# Interface: AssemblyOptions

Defined in: [rag/src/assembly/types.ts:289](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L289)

Options for a single assembly operation.

Can override config defaults for specific queries.

## Properties

### topK?

> `optional` **topK**: `number`

Defined in: [rag/src/assembly/types.ts:291](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L291)

Maximum number of chunks to include (before deduplication)

***

### ordering?

> `optional` **ordering**: [`OrderingStrategy`](../type-aliases/OrderingStrategy.md)

Defined in: [rag/src/assembly/types.ts:294](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L294)

Override ordering strategy

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [rag/src/assembly/types.ts:297](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L297)

Override token budget

***

### deduplicationThreshold?

> `optional` **deduplicationThreshold**: `number`

Defined in: [rag/src/assembly/types.ts:300](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L300)

Override deduplication threshold

***

### preamble?

> `optional` **preamble**: `string`

Defined in: [rag/src/assembly/types.ts:303](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L303)

Additional context to prepend (e.g., system instructions)

***

### postamble?

> `optional` **postamble**: `string`

Defined in: [rag/src/assembly/types.ts:306](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L306)

Additional context to append (e.g., query recap)
