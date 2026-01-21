[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / EnhancementResult

# Interface: EnhancementResult

Defined in: [rag/src/query-enhancement/types.ts:64](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L64)

Result of a query enhancement operation.

Always returns the original query plus enhanced variants.
The enhanced array may be empty if enhancement was skipped.

## Properties

### original

> **original**: `string`

Defined in: [rag/src/query-enhancement/types.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L66)

The original input query (unchanged)

***

### enhanced

> **enhanced**: `string`[]

Defined in: [rag/src/query-enhancement/types.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L76)

Enhanced query variants.

For 'rewrite': Single clarified query
For 'hyde': Queries derived from hypothetical documents
For 'multi-query': Multiple perspective queries

May be empty if enhancement was skipped.

***

### strategy

> **strategy**: [`EnhancementStrategy`](../type-aliases/EnhancementStrategy.md)

Defined in: [rag/src/query-enhancement/types.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L78)

Strategy that produced this result

***

### metadata

> **metadata**: [`EnhancementMetadata`](EnhancementMetadata.md)

Defined in: [rag/src/query-enhancement/types.ts:80](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/query-enhancement/types.ts#L80)

Metadata about the operation
