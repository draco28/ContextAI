[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / RecursiveChunker

# Class: RecursiveChunker

Defined in: [rag/src/chunking/recursive-chunker.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/recursive-chunker.ts#L45)

Recursive chunking strategy.

Splits text using a hierarchy of separators, preserving natural
document structure when possible. Falls back to smaller separators
when chunks are too large.

Best for:
- Prose and natural language documents
- Documents with clear paragraph/section structure
- When semantic coherence matters more than exact sizes

## Example

```typescript
const chunker = new RecursiveChunker();

const chunks = await chunker.chunk(document, {
  chunkSize: 512,
  chunkOverlap: 50
});
```

## Extends

- [`BaseChunker`](BaseChunker.md)

## Constructors

### Constructor

> **new RecursiveChunker**(`separators`): `RecursiveChunker`

Defined in: [rag/src/chunking/recursive-chunker.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/recursive-chunker.ts#L51)

#### Parameters

##### separators

`string`[] = `DEFAULT_SEPARATORS`

#### Returns

`RecursiveChunker`

#### Overrides

[`BaseChunker`](BaseChunker.md).[`constructor`](BaseChunker.md#constructor)

## Properties

### name

> `readonly` **name**: `"RecursiveChunker"` = `'RecursiveChunker'`

Defined in: [rag/src/chunking/recursive-chunker.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/recursive-chunker.ts#L46)

Human-readable name of this chunker

#### Overrides

[`BaseChunker`](BaseChunker.md).[`name`](BaseChunker.md#name)

## Methods

### chunk()

> **chunk**(`document`, `options?`): `Promise`\<[`Chunk`](../interfaces/Chunk.md)[]\>

Defined in: [rag/src/chunking/base-chunker.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/base-chunker.ts#L58)

Split a document into chunks.

Validates inputs, merges options with defaults, then delegates
to the subclass implementation.

#### Parameters

##### document

[`Document`](../interfaces/Document.md)

##### options?

[`ChunkingOptions`](../interfaces/ChunkingOptions.md)

#### Returns

`Promise`\<[`Chunk`](../interfaces/Chunk.md)[]\>

#### Inherited from

[`BaseChunker`](BaseChunker.md).[`chunk`](BaseChunker.md#chunk)
