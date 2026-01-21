[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkingOptions

# Interface: ChunkingOptions

Defined in: [rag/src/chunking/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L26)

Options for chunking operations.

## Properties

### chunkSize?

> `optional` **chunkSize**: `number`

Defined in: [rag/src/chunking/types.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L28)

Target size for each chunk (default: 512)

***

### chunkOverlap?

> `optional` **chunkOverlap**: `number`

Defined in: [rag/src/chunking/types.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L30)

Overlap between consecutive chunks (default: 50)

***

### sizeUnit?

> `optional` **sizeUnit**: [`SizeUnit`](../type-aliases/SizeUnit.md)

Defined in: [rag/src/chunking/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L32)

Unit for size measurements (default: 'tokens')

***

### preserveMetadata?

> `optional` **preserveMetadata**: `boolean`

Defined in: [rag/src/chunking/types.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L34)

Preserve document metadata in chunks (default: true)

***

### addContextHeaders?

> `optional` **addContextHeaders**: `boolean`

Defined in: [rag/src/chunking/types.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L36)

Prepend contextual headers (title, section) to chunk content (default: false)
