[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkMetadata

# Interface: ChunkMetadata

Defined in: [rag/src/vector-store/types.ts:18](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L18)

Metadata associated with a text chunk.

Common fields are strongly typed; chunkers can add custom fields
via the index signature.

## Indexable

\[`key`: `string`\]: `unknown`

Allow chunker-specific custom fields

## Properties

### startIndex?

> `optional` **startIndex**: `number`

Defined in: [rag/src/vector-store/types.ts:20](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L20)

Start character index in original document

***

### endIndex?

> `optional` **endIndex**: `number`

Defined in: [rag/src/vector-store/types.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L22)

End character index in original document

***

### pageNumber?

> `optional` **pageNumber**: `number`

Defined in: [rag/src/vector-store/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L24)

Page number (for paginated documents)

***

### section?

> `optional` **section**: `string`

Defined in: [rag/src/vector-store/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L26)

Section or heading this chunk belongs to
