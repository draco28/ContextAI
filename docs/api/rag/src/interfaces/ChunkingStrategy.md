[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkingStrategy

# Interface: ChunkingStrategy

Defined in: [rag/src/chunking/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L71)

Interface for text chunking strategies.

Chunkers are responsible for splitting documents into smaller chunks
suitable for embedding and retrieval.

## Example

```typescript
const chunker: ChunkingStrategy = new RecursiveChunker();

const chunks = await chunker.chunk(document, {
  chunkSize: 512,
  chunkOverlap: 50,
  sizeUnit: 'tokens'
});
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/chunking/types.ts:73](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L73)

Human-readable name of this strategy

## Methods

### chunk()

> **chunk**(`document`, `options?`): `Promise`\<[`Chunk`](Chunk.md)[]\>

Defined in: [rag/src/chunking/types.ts:83](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/types.ts#L83)

Split a document into chunks.

#### Parameters

##### document

[`Document`](Document.md)

The document to chunk

##### options?

[`ChunkingOptions`](ChunkingOptions.md)

Chunking options (size, overlap, etc.)

#### Returns

`Promise`\<[`Chunk`](Chunk.md)[]\>

Array of chunks with position metadata

#### Throws

If chunking fails
